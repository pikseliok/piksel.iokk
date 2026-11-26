import test from "node:test";
import assert from "node:assert/strict";
import worker, { Account } from "../src/index.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }
  async get(key) {
    return this.values.get(key);
  }
  async put(key, value) {
    this.values.set(key, value);
  }
  async delete(key) {
    return this.values.delete(key);
  }
}

function accountNamespace() {
  const storage = new MemoryStorage();
  const instance = new Account({ storage });
  return {
    storage,
    get: () => ({
      fetch: (input, init) => instance.fetch(new Request(input, init))
    }),
    idFromName: (id) => id
  };
}

async function authenticatedAccount() {
  const storage = new MemoryStorage();
  const account = new Account({ storage });
  const login = await account.fetch(new Request("https://account/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "12345678901", name: "Player", email: "player@example.test" })
  }));
  const session = await login.json();
  const request = (path, method = "GET", body) => account.fetch(new Request("https://account" + path, {
    method,
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  }));
  return { account, request };
}

test("publishes account configuration only to allowed origins", async () => {
  const env = { GOOGLE_CLIENT_ID: "public-client-id" };
  const allowed = await worker.fetch(new Request("https://worker.test/account/config", {
    headers: { Origin: "https://peaksel.az" }
  }), env);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), "https://peaksel.az");
  assert.deepEqual(await allowed.json(), { googleClientId: "public-client-id" });

  const rejected = await worker.fetch(new Request("https://worker.test/account/config", {
    headers: { Origin: "https://attacker.test" }
  }), env);
  assert.equal(rejected.status, 403);
});

test("requires a configured Google Client ID before starting a session", async () => {
  const response = await worker.fetch(new Request("https://worker.test/account/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://peaksel.az" },
    body: JSON.stringify({ credential: "valid-looking-google-credential" })
  }), {});
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Client ID/);
});

test("verifies Google identity, protects account data, and persists favorites/results", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.match(String(input), /oauth2\.googleapis\.com\/tokeninfo/);
    return Response.json({
      aud: "public-client-id",
      iss: "https://accounts.google.com",
      exp: String(Math.floor(Date.now() / 1000) + 3600),
      email_verified: "true",
      sub: "12345678901234567890",
      name: "Test Oyunçu",
      email: "player@example.test"
    });
  };

  const accounts = accountNamespace();
  const env = { GOOGLE_CLIENT_ID: "public-client-id", ACCOUNTS: accounts };
  try {
    const login = await worker.fetch(new Request("https://worker.test/account/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://peaksel.az" },
      body: JSON.stringify({ credential: "valid-looking-google-credential" })
    }), env);
    assert.equal(login.status, 200);
    const { token, profile } = await login.json();
    assert.equal(profile.name, "Test Oyunçu");

    const endpoint = "https://worker.test/account/12345678901234567890";
    const favoriteResponse = await worker.fetch(new Request(endpoint + "/favorites", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        favorite: true,
        item: { id: "question-1", question: "Test sualı", answer: "Test cavabı" }
      })
    }), env);
    assert.equal(favoriteResponse.status, 200);

    const resultResponse = await worker.fetch(new Request(endpoint + "/results", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        result: {
          id: "room-abc_1",
          game: "nhn-voice",
          title: "Səsli oyun",
          teams: [{ name: "Komanda", score: 3 }]
        }
      })
    }), env);
    assert.equal(resultResponse.status, 200);

    const dataResponse = await worker.fetch(new Request(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    }), env);
    const data = await dataResponse.json();
    assert.equal(data.favorites[0].question, "Test sualı");
    assert.equal(data.results[0].teams[0].score, 3);

    const unauthorized = await worker.fetch(new Request(endpoint), env);
    assert.equal(unauthorized.status, 401);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects malformed or unsupported game results", async () => {
  const storage = new MemoryStorage();
  const account = new Account({ storage });
  const login = await account.fetch(new Request("https://account/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "12345678901", name: "Player", email: "player@example.test" })
  }));
  const { token } = await login.json();
  const response = await account.fetch(new Request("https://account/results", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      result: { id: "bad", game: "other-game", teams: [{ name: "A", score: 2 }] }
    })
  }));
  assert.equal(response.status, 400);
});

test("updates display names and rejects invalid profile names", async () => {
  const { request } = await authenticatedAccount();
  const updated = await request("/profile", "PUT", { name: "Yeni oyunçu" });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).profile.name, "Yeni oyunçu");

  const blank = await request("/profile", "PUT", { name: " " });
  assert.equal(blank.status, 400);
  const tooLong = await request("/profile", "PUT", { name: "a".repeat(41) });
  assert.equal(tooLong.status, 400);
});

test("creates private packages from selected favorites and enforces limits", async () => {
  const first = await authenticatedAccount();
  const second = await authenticatedAccount();
  await first.request("/favorites", "PUT", {
    favorite: true,
    item: { id: "favorite-1", question: "Paketə daxil olan sual", answer: "Cavab" }
  });
  await first.request("/favorites", "PUT", {
    favorite: true,
    item: { id: "favorite-2", question: "Seçilməyən sual", answer: "Başqa cavab" }
  });

  const missingFavorite = await first.request("/packages", "POST", {
    title: "Test", favoriteIds: ["not-a-favorite"]
  });
  assert.equal(missingFavorite.status, 400);
  const tooMany = await first.request("/packages", "POST", {
    title: "Test",
    favoriteIds: Array.from({ length: 101 }, (_, index) => "question-" + index)
  });
  assert.equal(tooMany.status, 400);
  const invalidTitle = await first.request("/packages", "POST", {
    title: " ", favoriteIds: ["favorite-1"]
  });
  assert.equal(invalidTitle.status, 400);

  const created = await first.request("/packages", "POST", {
    title: "Seçilmiş suallar",
    favoriteIds: ["favorite-1"]
  });
  assert.equal(created.status, 200);
  const packages = (await created.json()).packages;
  assert.equal(packages[0].title, "Seçilmiş suallar");
  assert.deepEqual(packages[0].questions.map((item) => item.id), ["favorite-1"]);
  const otherAccount = await second.request("/", "GET");
  assert.deepEqual((await otherAccount.json()).packages, []);

  for (let index = 1; index < 20; index++) {
    const response = await first.request("/packages", "POST", {
      title: "Paket " + index,
      favoriteIds: ["favorite-1"]
    });
    assert.equal(response.status, 200);
  }
  const overLimit = await first.request("/packages", "POST", {
    title: "Limitdən artıq",
    favoriteIds: ["favorite-1"]
  });
  assert.equal(overLimit.status, 409);
});
