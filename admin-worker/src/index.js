const API = "https://api.github.com";
const TOKEN_INFO = "https://oauth2.googleapis.com/tokeninfo";
const MAX_BODY_BYTES = 900_000;
const MAX_QUESTIONS = 500;
const PACKAGE_ROOT = "admin/packages/";
const TEMPLATE_PATH = "admin/package-template.html";
const SEARCH_PATH = "suallar-data.js";
const CATALOG_PATH = "published-packages.js";
const DEFAULT_PACKAGE_ICON = "https://i.ibb.co/3mjVHt5R/Yeni-Proje-2.png";
const RESERVED_IDS = new Set(["admin", "index", "paketler", "muellifler"]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function response(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  if (!origin || !allowedOrigins(env).includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function assertOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins(env).includes(origin)) {
    throw new HttpError(403, "Bu origin üçün API-yə icazə yoxdur.");
  }
}

async function authenticate(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) throw new HttpError(401, "Google hesabı ilə daxil olun.");
  if (!env.GOOGLE_CLIENT_ID || !env.ADMIN_EMAILS) {
    throw new HttpError(503, "Worker-in Google və admin konfiqurasiyası tamamlanmayıb.");
  }

  let tokenResponse;
  try {
    tokenResponse = await fetch(`${TOKEN_INFO}?id_token=${encodeURIComponent(match[1])}`);
  } catch {
    throw new HttpError(502, "Google girişini yoxlamaq mümkün olmadı. Yenidən cəhd edin.");
  }
  if (!tokenResponse.ok) throw new HttpError(401, "Google giriş tokeni etibarlı deyil.");

  let claims;
  try {
    claims = await tokenResponse.json();
  } catch {
    throw new HttpError(502, "Google-dan etibarsız cavab alındı.");
  }

  const expiry = Number(claims.exp);
  const verified = claims.email_verified === true || claims.email_verified === "true";
  if (
    claims.aud !== env.GOOGLE_CLIENT_ID ||
    !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) ||
    !Number.isFinite(expiry) ||
    expiry <= Math.floor(Date.now() / 1000) ||
    !verified ||
    typeof claims.email !== "string"
  ) {
    throw new HttpError(401, "Google hesabının doğrulanması uğursuz oldu.");
  }

  const admins = String(env.ADMIN_EMAILS)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!admins.includes(claims.email.trim().toLowerCase())) {
    throw new HttpError(403, "Bu Google hesabının admin icazəsi yoxdur.");
  }
}

function githubHeaders(env) {
  if (!env.GITHUB_TOKEN || !env.REPO_OWNER || !env.REPO_NAME || !env.REPO_BRANCH) {
    throw new HttpError(503, "GitHub Worker konfiqurasiyası tamamlanmayıb.");
  }
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Peaksel-Admin-Publisher",
    "Content-Type": "application/json",
  };
}

async function github(env, path, options = {}) {
  let result;
  try {
    result = await fetch(`${API}/repos/${env.REPO_OWNER}/${env.REPO_NAME}${path}`, {
      ...options,
      headers: { ...githubHeaders(env), ...(options.headers || {}) },
    });
  } catch {
    throw new HttpError(502, "GitHub-a qoşulmaq mümkün olmadı.");
  }
  if (!result.ok) {
    if (result.status === 409 || result.status === 422) {
      throw new HttpError(409, "GitHub branch-i dəyişib. Səhifəni yeniləyib yenidən cəhd edin.");
    }
    if (result.status === 401 || result.status === 403) {
      throw new HttpError(502, "GitHub tokeninin repo icazələrini yoxlayın.");
    }
    throw new HttpError(502, `GitHub əməliyyatı uğursuz oldu (${result.status}).`);
  }
  if (result.status === 204) return null;
  try {
    return await result.json();
  } catch {
    throw new HttpError(502, "GitHub-dan etibarsız cavab alındı.");
  }
}

async function getRepositoryTree(env) {
  const branch = encodeURIComponent(env.REPO_BRANCH);
  const ref = await github(env, `/git/ref/heads/${branch}`);
  const headSha = ref.object?.sha;
  if (!headSha) throw new HttpError(502, "GitHub branch başlığını oxumaq mümkün olmadı.");
  const commit = await github(env, `/git/commits/${headSha}`);
  const treeSha = commit.tree?.sha;
  if (!treeSha) throw new HttpError(502, "GitHub tree məlumatı tapılmadı.");
  const tree = await github(env, `/git/trees/${treeSha}?recursive=1`);
  if (tree.truncated) {
    throw new HttpError(502, "Repo tree siyahısı kəsildi; CMS əməliyyatı dayandırıldı.");
  }
  return { headSha, treeSha, entries: tree.tree || [] };
}

async function readBlob(env, sha) {
  const blob = await github(env, `/git/blobs/${sha}`);
  if (blob.encoding !== "base64" || typeof blob.content !== "string") {
    throw new HttpError(502, "GitHub faylını oxumaq mümkün olmadı.");
  }
  const binary = atob(blob.content.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function entryFor(entries, path) {
  return entries.find((entry) => entry.path === path && entry.type === "blob");
}

async function readPath(env, entries, path) {
  const entry = entryFor(entries, path);
  if (!entry) throw new HttpError(500, `Repo faylı tapılmadı: ${path}`);
  return readBlob(env, entry.sha);
}

function packagePath(id) {
  return `${PACKAGE_ROOT}${id}.json`;
}

function safeText(value, field, max = 20_000, required = false) {
  if (typeof value !== "string") {
    if (required) throw new HttpError(400, `${field} mətn olmalıdır.`);
    return "";
  }
  const text = value.trim();
  if (required && !text) throw new HttpError(400, `${field} boş ola bilməz.`);
  if (text.length > max) throw new HttpError(400, `${field} çox uzundur.`);
  return text;
}

function normalizeQuestion(question, group, type, questionIndex) {
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    throw new HttpError(400, `Sual ${questionIndex + 1} düzgün formatda deyil.`);
  }
  const normalized = {
    question: safeText(question.question, "Sual", 20_000, true),
    answer: safeText(question.answer, "Cavab", 20_000, true),
    comment: safeText(question.comment, "Şərh"),
    source: safeText(question.source, "Mənbə"),
    criteria: safeText(question.criteria, "Qəbul meyarı"),
    handout: safeText(question.handout, "Paylama materialı"),
    reqImg: safeImageUrl(safeText(question.reqImg, "Rekvizit şəkli", 2_000)),
    extraImage: safeImageUrl(safeText(question.extraImage, "Əlavə şəkil", 2_000)),
    author: safeText(question.author, "Müəllif", 200) || group.author,
  };
  if (type === "xemse") normalized.author = group.author;
  return normalized;
}

function safeImageUrl(value) {
  if (!value) return "";
  if (/[\u0000-\u0020"'<>\\]/.test(value) || value.startsWith("//")) {
    throw new HttpError(400, "Şəkil linkində icazəsiz simvol var.");
  }
  let url;
  try {
    url = new URL(value, "https://peaksel.az");
  } catch {
    throw new HttpError(400, "Şəkil linki düzgün deyil.");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new HttpError(400, "Şəkil linki HTTPS və ya sayt daxilindəki / yol ilə başlamalıdır.");
  }
  if (value.startsWith("/") && url.origin !== "https://peaksel.az") {
    throw new HttpError(400, "Saytdaxili şəkil linki düzgün deyil.");
  }
  if (!value.startsWith("/") && !/^https:\/\//i.test(value)) {
    throw new HttpError(400, "Şəkil linki HTTPS və ya sayt daxilindəki / yol ilə başlamalıdır.");
  }
  return value.startsWith("/") ? `${url.pathname}${url.search}${url.hash}` : url.href;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function searchText(value) {
  const plain = String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'");
  return escapeHtml(plain.replace(/\s+/g, " ").trim());
}

export function validatePackage(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Paket məlumatları düzgün formatda deyil.");
  }
  const id = safeText(input.id, "Slug", 80, true).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || RESERVED_IDS.has(id)) {
    throw new HttpError(400, "Slug yalnız kiçik latın hərfləri, rəqəmlər və defisdən ibarət olmalıdır.");
  }
  const title = safeText(input.title, "Paket adı", 200, true);
  const type = safeText(input.type, "Format", 20, true);
  if (!["nhn", "breyn", "xemse", "ferdi"].includes(type)) {
    throw new HttpError(400, "Paket formatı tanınmadı.");
  }
  const date = safeText(input.date, "Tarix", 10, true);
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new HttpError(400, "Tarix YYYY-MM-DD formatında olmalıdır.");
  }
  const icon = safeImageUrl(safeText(input.icon, "Şəkil linki", 2_000));
  if (!Array.isArray(input.sections) || input.sections.length < 1 || input.sections.length > 40) {
    throw new HttpError(400, "Paketdə 1–40 tur/bölmə olmalıdır.");
  }

  let questionCount = 0;
  const sections = input.sections.map((section, sectionIndex) => {
    if (!section || typeof section !== "object" || !Array.isArray(section.groups)) {
      throw new HttpError(400, `Bölmə ${sectionIndex + 1} düzgün formatda deyil.`);
    }
    const name = safeText(section.name, "Bölmə adı", 200, true);
    if (section.groups.length < 1 || section.groups.length > 100) {
      throw new HttpError(400, `“${name}” bölməsində 1–100 mövzu olmalıdır.`);
    }
    const groups = section.groups.map((group, groupIndex) => {
      if (!group || typeof group !== "object" || !Array.isArray(group.questions)) {
        throw new HttpError(400, `“${name}” bölməsinin ${groupIndex + 1}-ci mövzusu düzgün deyil.`);
      }
      const groupName = safeText(group.name, "Mövzu adı", 200) || `Mövzu ${groupIndex + 1}`;
      const author = safeText(group.author, "Müəllif", 200);
      if (type === "xemse" && !author) {
        throw new HttpError(400, `Xəmsə formatında “${groupName}” mövzusunun müəllifi qeyd edilməlidir.`);
      }
      if (!group.questions.length || group.questions.length > MAX_QUESTIONS) {
        throw new HttpError(400, `“${groupName}” mövzusunda sual olmalıdır.`);
      }
      if (type === "xemse" && group.questions.length !== 5) {
        throw new HttpError(400, `Xəmsə formatında “${groupName}” mövzusu dəqiq 5 sualdan ibarət olmalıdır.`);
      }
      questionCount += group.questions.length;
      if (questionCount > MAX_QUESTIONS) {
        throw new HttpError(400, `Paketdə maksimum ${MAX_QUESTIONS} sual ola bilər.`);
      }
      return {
        name: groupName,
        author,
        questions: group.questions.map((question, questionIndex) =>
          normalizeQuestion(question, { author }, type, questionIndex),
        ),
      };
    });
    return { name, groups };
  });

  return { id, title, type, date, icon, sections };
}

export function toCatalog(packages) {
  const rows = packages.map(({ id, title, type, date, icon }) => ({
    title,
    type,
    date,
    icon: icon || DEFAULT_PACKAGE_ICON,
    link: `/${id}`,
  }));
  return `window.PUBLISHED_PACKAGES = ${JSON.stringify(rows)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")};\n`;
}

export function toSearchEntry(pkg) {
  const tours = {};
  const topics = {};
  const groupedByTopic = pkg.type === "xemse" || pkg.type === "ferdi";
  const makeQuestion = (question, group) => ({
    question: searchText(question.question),
    answer: searchText(question.answer),
    comment: searchText(question.comment),
    source: searchText(question.source),
    criteria: searchText(question.criteria),
    handout: searchText(question.handout),
    reqImg: question.reqImg,
    extraImage: question.extraImage,
    author: question.author || group.author,
  });
  let index = 0;
  pkg.sections.forEach((section) => {
    if (groupedByTopic) {
      section.groups.forEach((group) => {
        index += 1;
        const key = String(index);
        topics[key] = searchText(group.name);
        tours[key] = group.questions.map((question) => makeQuestion(question, group));
      });
    } else {
      index += 1;
      tours[String(index)] = section.groups.flatMap((group) =>
        group.questions.map((question) => makeQuestion(question, group)),
      );
    }
  });
  const entry = {
    id: pkg.id,
    title: pkg.title,
    type: pkg.type,
    date: pkg.date,
    link: `/${pkg.id}`,
    tours,
  };
  if (groupedByTopic) entry.topics = topics;
  return entry;
}

export function updateSearchData(source, id, pkg) {
  const start = `/* CMS_PACKAGE:${id}:START */`;
  const end = `/* CMS_PACKAGE:${id}:END */`;
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(
    `\\s*\\/\\* CMS_PACKAGE:${escapedId}:START \\*\\/[\\s\\S]*?\\/\\* CMS_PACKAGE:${escapedId}:END \\*\\/\\s*`,
  );
  let updated = source.replace(block, "\n");
  if (pkg) {
    updated = `${updated.trimEnd()}\n${start}\nwindow.SUAL_DATA.push(${JSON.stringify(toSearchEntry(pkg))});\n${end}\n`;
  }
  return updated;
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function renderPackage(template, pkg) {
  const marker = "<!-- PACKAGE_DATA -->";
  if (template.split(marker).length !== 2) {
    throw new HttpError(500, "Paket səhifəsi şablonunda data marker-i tapılmadı.");
  }
  return template.replace(marker, `<script>window.PACKAGE_DATA=${escapeScriptJson(pkg)};</script>`);
}

function parsePackageFiles(env, entries) {
  const packageEntries = entries.filter(
    (entry) => entry.type === "blob" && entry.path.startsWith(PACKAGE_ROOT) && entry.path.endsWith(".json"),
  );
  return Promise.all(
    packageEntries.map(async (entry) => {
      try {
        const parsed = JSON.parse(await readBlob(env, entry.sha));
        return validatePackage(parsed);
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(500, `CMS paket faylı oxunmadı: ${entry.path}`);
      }
    }),
  );
}

async function commitFiles(env, snapshot, changes) {
  const tree = await github(env, "/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: snapshot.treeSha,
      tree: changes.map((change) => ({
        path: change.path,
        mode: "100644",
        type: "blob",
        ...(change.delete ? { sha: null } : { content: change.content }),
      })),
    }),
  });
  const commit = await github(env, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: "Update public question package via admin CMS",
      tree: tree.sha,
      parents: [snapshot.headSha],
    }),
  });
  try {
    await github(env, `/git/refs/heads/${encodeURIComponent(env.REPO_BRANCH)}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 409) throw error;
    throw error;
  }
  return commit.sha;
}

async function publish(env, input) {
  const pkg = validatePackage(input);
  const snapshot = await getRepositoryTree(env);
  const canonicalPath = packagePath(pkg.id);
  const oldCanonical = entryFor(snapshot.entries, canonicalPath);
  const detailPath = `${pkg.id}.html`;
  if (!oldCanonical && entryFor(snapshot.entries, detailPath)) {
    throw new HttpError(409, "Bu slug artıq saytda mövcuddur və CMS onu əvəz etməyəcək.");
  }

  const packages = await parsePackageFiles(env, snapshot.entries);
  const nextPackages = packages.filter((item) => item.id !== pkg.id).concat(pkg);
  const template = await readPath(env, snapshot.entries, TEMPLATE_PATH);
  const searchData = await readPath(env, snapshot.entries, SEARCH_PATH);
  const updatedSearch = updateSearchData(searchData, pkg.id, pkg);
  const changes = [
    { path: canonicalPath, content: `${JSON.stringify(pkg, null, 2)}\n` },
    { path: detailPath, content: renderPackage(template, pkg) },
    { path: CATALOG_PATH, content: toCatalog(nextPackages) },
    { path: SEARCH_PATH, content: updatedSearch },
  ];
  return commitFiles(env, snapshot, changes);
}

async function removePackage(env, id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || RESERVED_IDS.has(id)) {
    throw new HttpError(400, "Paket slug-ı düzgün deyil.");
  }
  const snapshot = await getRepositoryTree(env);
  const canonicalPath = packagePath(id);
  if (!entryFor(snapshot.entries, canonicalPath)) {
    throw new HttpError(404, "CMS-də belə paket tapılmadı.");
  }
  const packages = (await parsePackageFiles(env, snapshot.entries)).filter((item) => item.id !== id);
  const searchData = await readPath(env, snapshot.entries, SEARCH_PATH);
  const changes = [
    { path: canonicalPath, delete: true },
    { path: `${id}.html`, delete: true },
    { path: CATALOG_PATH, content: toCatalog(packages) },
    { path: SEARCH_PATH, content: updateSearchData(searchData, id, null) },
  ];
  return commitFiles(env, snapshot, changes);
}

async function parseRequestBody(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) throw new HttpError(413, "Paket məlumatları çox böyükdür.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new HttpError(413, "Paket məlumatları çox böyükdür.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Sorğu JSON formatında deyil.");
  }
}

async function route(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/health") {
    return response({ ok: true, service: "peaksel-admin-publisher" }, 200);
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  assertOrigin(request, env);
  await authenticate(request, env);

  if (request.method === "GET" && url.pathname === "/api/packages") {
    const snapshot = await getRepositoryTree(env);
    const packages = await parsePackageFiles(env, snapshot.entries);
    return response({ packages: packages.sort((a, b) => b.date.localeCompare(a.date)) }, 200);
  }
  if (request.method === "POST" && url.pathname === "/api/packages") {
    const input = await parseRequestBody(request);
    const commit = await publish(env, input);
    return response({ ok: true, commit }, 201);
  }
  const deleteMatch = /^\/api\/packages\/([a-z0-9-]+)$/.exec(url.pathname);
  if (request.method === "DELETE" && deleteMatch) {
    const commit = await removePackage(env, deleteMatch[1]);
    return response({ ok: true, commit }, 200);
  }
  return response({ error: "API endpoint tapılmadı." }, 404);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const headers = corsHeaders(origin, env);
    try {
      const result = await route(request, env);
      const merged = new Headers(result.headers);
      for (const [key, value] of Object.entries(headers)) merged.set(key, value);
      merged.set("X-Content-Type-Options", "nosniff");
      return new Response(result.body, { status: result.status, headers: merged });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : "Server xətası baş verdi.";
      return response({ error: message }, status, headers);
    }
  },
};
