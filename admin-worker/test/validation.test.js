import test from "node:test";
import assert from "node:assert/strict";
import worker, { renderPackage, toCatalog, toSearchEntry, updateSearchData, validatePackage } from "../src/index.js";

function packageData(overrides = {}) {
  return {
    id: "numune-paketi",
    title: "Nümunə paket",
    type: "nhn",
    date: "2026-03-10",
    icon: "",
    sections: [{
      name: "1-ci tur",
      groups: [{
        name: "Sual bloku",
        author: "A. Müəllif",
        questions: [{
          question: "Sual",
          answer: "Cavab",
          comment: "",
          source: "",
          criteria: "",
          handout: "",
          reqImg: "",
          extraImage: "",
          author: "",
        }],
      }],
    }],
    ...overrides,
  };
}

test("validates and normalizes a standard package", () => {
  const pkg = validatePackage(packageData());
  assert.equal(pkg.id, "numune-paketi");
  assert.equal(pkg.sections[0].groups[0].questions[0].author, "A. Müəllif");
});

test("rejects malformed slugs and impossible dates", () => {
  assert.throws(() => validatePackage(packageData({ id: "../bad" })), /Slug/);
  assert.throws(() => validatePackage(packageData({ date: "2026-02-30" })), /YYYY-MM-DD/);
  assert.throws(() => validatePackage(packageData({ icon: "https://example.test/\" onerror=alert(1)" })), /Şəkil linki/);
});

test("requires exactly five authored questions in each Xəmsə topic", () => {
  const topic = packageData({
    type: "xemse",
    sections: [{
      name: "I raund",
      groups: [{
        name: "Mövzu",
        author: "Müəllif",
        questions: Array.from({ length: 5 }, () => ({ question: "Sual", answer: "Cavab" })),
      }],
    }],
  });
  assert.equal(validatePackage(topic).sections[0].groups[0].questions.length, 5);
  topic.sections[0].groups[0].questions.pop();
  assert.throws(() => validatePackage(topic), /dəqiq 5/);
  topic.sections[0].groups[0].questions.push({ question: "Sual", answer: "Cavab" });
  topic.sections[0].groups[0].author = "";
  assert.throws(() => validatePackage(topic), /müəllifi/);
});

test("keeps the author page search data in its expected tour-array shape", () => {
  const pkg = validatePackage(packageData());
  const search = toSearchEntry(pkg);
  assert.equal(search.tours["1"][0].author, "A. Müəllif");
  assert.equal(search.link, "/numune-paketi");
});

test("groups Xəmsə and Fərdi search entries by topic and strips rich markup", () => {
  const pkg = validatePackage(packageData({
    type: "xemse",
    sections: [{
      name: "I raund",
      groups: [
        { name: "Birinci <b>mövzu</b>", author: "A", questions: Array.from({ length: 5 }, () => ({ question: "<b>Sual</b>", answer: "Cavab" })) },
        { name: "İkinci mövzu", author: "B", questions: Array.from({ length: 5 }, () => ({ question: "<script>alert(1)</script>Təhlükəsiz", answer: "Cavab" })) },
      ],
    }],
  }));
  const search = toSearchEntry(pkg);
  assert.deepEqual(Object.keys(search.tours), ["1", "2"]);
  assert.equal(search.topics["1"], "Birinci mövzu");
  assert.equal(search.tours["1"][0].question, "Sual");
  assert.equal(search.tours["2"][0].question, "Təhlükəsiz");
});

test("HTML-escapes titles sent to the package-card innerHTML renderer", () => {
  const catalog = toCatalog([validatePackage(packageData({ title: "A <script>test</script> & B" }))]);
  assert.match(catalog, /A \\u003cscript\\u003etest\\u003c\/script\\u003e \\u0026 B/);
  assert.doesNotMatch(catalog, /<script>test<\/script>/);
  assert.match(catalog, /Yeni-Proje-2\.png/);
});

test("upserts and removes only the matching generated search-data block", () => {
  const source = "window.SUAL_DATA = window.SUAL_DATA || [];\n";
  const once = updateSearchData(source, "numune-paketi", validatePackage(packageData()));
  const twice = updateSearchData(once, "numune-paketi", validatePackage(packageData({ title: "Yenilənmiş" })));
  assert.equal((twice.match(/CMS_PACKAGE:numune-paketi:START/g) || []).length, 1);
  assert.match(twice, /Yenilənmiş/);
  assert.equal(updateSearchData(twice, "numune-paketi", null).includes("CMS_PACKAGE:numune-paketi"), false);
});

test("renders JSON safely into exactly one package-template marker", () => {
  const template = "<head><!-- PACKAGE_DATA --></head>";
  const html = renderPackage(template, validatePackage(packageData({ title: "</script><script>alert(1)</script>" })));
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.throws(() => renderPackage("missing marker", validatePackage(packageData())), /marker/);
});

test("health endpoint is public and returns service status", async () => {
  const result = await worker.fetch(new Request("https://worker.example/api/health"), {});
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true, service: "peaksel-admin-publisher" });
});

test("publishes canonical content and all generated surfaces in one GitHub commit", async () => {
  const originalFetch = globalThis.fetch;
  const blobs = {
    template: "<html><head><!-- PACKAGE_DATA --></head></html>",
    search: "window.SUAL_DATA = window.SUAL_DATA || [];\n",
  };
  let treeRequest;
  let refUpdated = false;
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input);
    if (url.hostname === "oauth2.googleapis.com") {
      return Response.json({
        aud: "public-client-id",
        iss: "https://accounts.google.com",
        exp: String(Math.floor(Date.now() / 1000) + 3600),
        email_verified: "true",
        email: "admin@example.test",
      });
    }
    if (url.hostname !== "api.github.com") throw new Error("Unexpected network request");
    if (url.pathname.endsWith("/git/ref/heads/main") && options.method !== "PATCH") {
      return Response.json({ object: { sha: "head-sha" } });
    }
    if (url.pathname.endsWith("/git/commits/head-sha")) {
      return Response.json({ tree: { sha: "base-tree" } });
    }
    if (url.pathname.endsWith("/git/trees/base-tree")) {
      return Response.json({
        truncated: false,
        tree: [
          { path: "admin/package-template.html", type: "blob", sha: "template" },
          { path: "suallar-data.js", type: "blob", sha: "search" },
        ],
      });
    }
    if (url.pathname.endsWith("/git/blobs/template") || url.pathname.endsWith("/git/blobs/search")) {
      const sha = url.pathname.endsWith("/template") ? "template" : "search";
      return Response.json({ encoding: "base64", content: Buffer.from(blobs[sha]).toString("base64") });
    }
    if (url.pathname.endsWith("/git/trees") && options.method === "POST") {
      treeRequest = JSON.parse(options.body);
      return Response.json({ sha: "new-tree" });
    }
    if (url.pathname.endsWith("/git/commits") && options.method === "POST") {
      return Response.json({ sha: "new-commit" });
    }
    if (url.pathname.endsWith("/git/refs/heads/main") && options.method === "PATCH") {
      refUpdated = true;
      return Response.json({ object: { sha: "new-commit" } });
    }
    throw new Error(`Unexpected GitHub request: ${options.method || "GET"} ${url.pathname}`);
  };

  try {
    const request = new Request("https://worker.example/api/packages", {
      method: "POST",
      headers: {
        Origin: "https://peaksel.az",
        Authorization: "Bearer test-id-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packageData({ title: "Test <script>not executable</script>" })),
    });
    const result = await worker.fetch(request, {
      GOOGLE_CLIENT_ID: "public-client-id",
      ADMIN_EMAILS: "admin@example.test",
      GITHUB_TOKEN: "test-token",
      REPO_OWNER: "owner",
      REPO_NAME: "repo",
      REPO_BRANCH: "main",
      ALLOWED_ORIGINS: "https://peaksel.az",
    });
    assert.equal(result.status, 201);
    assert.equal((await result.json()).commit, "new-commit");
    assert.equal(refUpdated, true);
    assert.deepEqual(treeRequest.tree.map((entry) => entry.path).sort(), [
      "admin/packages/numune-paketi.json",
      "numune-paketi.html",
      "published-packages.js",
      "suallar-data.js",
    ]);
    const catalog = treeRequest.tree.find((entry) => entry.path === "published-packages.js").content;
    assert.match(catalog, /\\u003cscript\\u003e/);
    assert.doesNotMatch(catalog, /<script>not executable<\/script>/);
    const search = treeRequest.tree.find((entry) => entry.path === "suallar-data.js").content;
    assert.match(search, /window\.SUAL_DATA\.push/);
    assert.match(search, /not executable/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
