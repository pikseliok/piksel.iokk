export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/account/')) {
      return handleAccountRequest(req, env, url);
    }
    if (url.pathname === '/turn') {
      const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
      try {
        const r = await fetch(
          `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${env.TURN_KEY_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ttl: 86400 })
          }
        );
        return new Response(await r.text(), { headers: h });
      } catch (e) {
        return new Response('{}', { headers: h });
      }
    }
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]{4,8})$/);
    if (!m) return new Response('piksel-nhn işləyir');
    if (req.headers.get('Upgrade') !== 'websocket')
      return new Response('WebSocket lazımdır', { status: 426 });
    const id = env.ROOMS.idFromName(m[1].toUpperCase());
    return env.ROOMS.get(id).fetch(req);
  }
};

const ACCOUNT_ORIGINS = ['https://peaksel.az', 'https://www.peaksel.az'];
class AccountError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const accountJson = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
});

function accountCors(req) {
  const origin = req.headers.get('Origin');
  if (!origin) return {};
  if (!ACCOUNT_ORIGINS.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

async function accountBody(req) {
  const length = Number(req.headers.get('Content-Length') || 0);
  if (length > 32_000) throw new AccountError(413, 'Sorğu çox böyükdür.');
  let value;
  try { value = await req.json(); } catch { throw new AccountError(400, 'Sorğu JSON formatında deyil.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AccountError(400, 'Sorğunun məlumat formatı etibarlı deyil.');
  }
  if (JSON.stringify(value).length > 32_000) throw new AccountError(413, 'Sorğu çox böyükdür.');
  return value;
}

async function verifyGoogleCredential(credential, env) {
  if (!env.GOOGLE_CLIENT_ID) {
    return { status: 503, error: 'Google Client ID konfiqurasiya edilməyib.' };
  }
  if (typeof credential !== 'string' || credential.length < 20 || credential.length > 10_000) {
    return { status: 401, error: 'Google giriş tokeni etibarlı deyil.' };
  }
  let result;
  try {
    result = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  } catch {
    return { status: 502, error: 'Google girişini yoxlamaq mümkün olmadı. Yenidən cəhd edin.' };
  }
  if (!result.ok) return { status: result.status >= 500 ? 502 : 401, error: 'Google giriş tokeni etibarlı deyil.' };
  let claims;
  try { claims = await result.json(); } catch {
    return { status: 502, error: 'Google-dan etibarsız cavab alındı.' };
  }
  const expiry = Number(claims.exp);
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  if (
    claims.aud !== env.GOOGLE_CLIENT_ID ||
    !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) ||
    !Number.isFinite(expiry) ||
    expiry <= Math.floor(Date.now() / 1000) ||
    !verified ||
    typeof claims.sub !== 'string' ||
    !/^[0-9]{5,30}$/.test(claims.sub)
  ) {
    return { status: 401, error: 'Google hesabının doğrulanması alınmadı.' };
  }
  const email = String(claims.email || '').slice(0, 254);
  const fallbackName = email.includes('@') ? email.split('@')[0] : 'Oyunçu';
  return {
    user: {
      id: claims.sub,
      name: String(claims.name || fallbackName).trim().slice(0, 80) || fallbackName,
      email
    }
  };
}

async function handleAccountRequest(req, env, url) {
  const cors = accountCors(req);
  if (cors === null) return accountJson({ error: 'Bu origin üçün API-yə icazə yoxdur.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const withCors = response => {
    const headers = new Headers(response.headers);
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'no-store');
    return new Response(response.body, { status: response.status, headers });
  };

  try {
    if (req.method === 'GET' && url.pathname === '/account/config') {
      return withCors(accountJson({ googleClientId: env.GOOGLE_CLIENT_ID || '' }));
    }
    if (req.method === 'POST' && url.pathname === '/account/session') {
      const body = await accountBody(req);
      const verification = await verifyGoogleCredential(body.credential, env);
      if (verification.error) return withCors(accountJson({ error: verification.error }, verification.status));
      const account = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(verification.user.id));
      const result = await account.fetch('https://account/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verification.user)
      });
      return withCors(result);
    }

    const match = /^\/account\/([0-9]{5,30})(?:\/(favorites|results|session|profile|packages))?$/.exec(url.pathname);
    if (!match) return withCors(accountJson({ error: 'API endpoint tapılmadı.' }, 404));
    if (!['GET', 'PUT', 'POST', 'DELETE'].includes(req.method)) {
      return withCors(accountJson({ error: 'HTTP metodu dəstəklənmir.' }, 405));
    }
    const [, uid, resource] = match;
    if (!resource && req.method !== 'GET') return withCors(accountJson({ error: 'API endpoint tapılmadı.' }, 404));
    const authorization = req.headers.get('Authorization') || '';
    const tokenMatch = /^Bearer\s+([A-Za-z0-9-]{36})$/i.exec(authorization);
    if (!tokenMatch) return withCors(accountJson({ error: 'Hesaba daxil olun.' }, 401));
    const account = env.ACCOUNTS.get(env.ACCOUNTS.idFromName(uid));
    const body = ['PUT', 'POST'].includes(req.method) ? await accountBody(req) : null;
    const accountPath = resource ? `/${resource}` : '/';
    const response = await account.fetch(`https://account${accountPath}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenMatch[1]}` },
      body: body === null ? undefined : JSON.stringify(body)
    });
    return withCors(response);
  } catch (error) {
    const status = error instanceof AccountError ? error.status : 500;
    if (status === 500) console.error('Account API sorğusu uğursuz oldu.', error);
    return withCors(accountJson({
      error: status === 500 ? 'Server xətası baş verdi. Yenidən cəhd edin.' : error.message
    }, status));
  }
}

const clean = s => String(s || '').trim().slice(0, 24);
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class Room {
  constructor(state, env) {
    this.peers = new Map();
    this.teams = {};
    this.hostId = null;
    this.phase = 'lobby';
    this.endsAt = 0;
    this.speaker = null;
    this.timer = null;
  }

  async fetch(req) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const id = crypto.randomUUID().slice(0, 8);
    this.peers.set(id, { ws: server, role: null, team: null, name: '', wants: false });
    server.send(JSON.stringify({ t: 'hello', id }));
    server.addEventListener('message', e => this.onMsg(id, e.data));
    server.addEventListener('close', () => this.onClose(id));
    server.addEventListener('error', () => this.onClose(id));
    return new Response(null, { status: 101, webSocket: client });
  }

  send(id, obj) {
    const p = this.peers.get(id);
    if (p) { try { p.ws.send(JSON.stringify(obj)); } catch (e) {} }
  }
  err(id, msg) { this.send(id, { t: 'error', msg }); }
  members(code) {
    return [...this.peers.entries()].filter(([, p]) => p.team === code);
  }
  newCode() {
    let c;
    do { c = Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join(''); }
    while (this.teams[c]);
    return c;
  }
  allowed(a, b) {
    const pa = this.peers.get(a), pb = this.peers.get(b);
    if (!pa || !pb || !pa.role || !pb.role) return false;
    if (pa.role === 'host' || pb.role === 'host') return true;
    if (pa.team && pa.team === pb.team) return true;
    if (this.speaker === a || this.speaker === b) return true;
    return false;
  }

  stateFor(id) {
    const me = this.peers.get(id);
    const isHost = me.role === 'host';
    return {
      t: 'state',
      you: id,
      role: me.role,
      team: me.team,
      now: Date.now(),
      phase: this.phase,
      endsAt: this.endsAt,
      speaker: this.speaker,
      hostId: this.hostId,
      teams: Object.values(this.teams).map(t => ({
        name: t.name,
        score: t.score,
        answered: t.answer !== null,
        code: isHost || me.team === t.code ? t.code : null,
        answer: isHost ? t.answer : undefined,
        members: this.members(t.code).map(([pid, p]) => ({
          id: pid, name: p.name, captain: p.role === 'captain', wants: p.wants
        }))
      }))
    };
  }
  broadcast() {
    for (const [id, p] of this.peers) if (p.role) this.send(id, this.stateFor(id));
  }

  onMsg(id, raw) {
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    const me = this.peers.get(id);
    if (!me) return;
    const isHost = me.role === 'host';

    switch (m.t) {
      case 'host':
        if (this.hostId) return this.err(id, 'Bu otağın aparıcısı artıq var');
        me.role = 'host'; me.name = 'Aparıcı'; this.hostId = id;
        break;

      case 'captain': {
        if (!this.hostId) return this.err(id, 'Otaq tapılmadı');
        if (this.phase !== 'lobby') return this.err(id, 'Oyun artıq başlayıb');
        if (Object.keys(this.teams).length >= 5) return this.err(id, 'Otaq doludur (maksimum 5 komanda)');
        const name = clean(m.name), team = clean(m.team);
        if (!name || !team) return this.err(id, 'Komanda adı və adın lazımdır');
        const code = this.newCode();
        this.teams[code] = { name: team, code, score: 0, answer: null };
        me.role = 'captain'; me.team = code; me.name = name;
        break;
      }

      case 'player': {
        const code = String(m.code || '').trim().toUpperCase();
        const t = this.teams[code];
        const name = clean(m.name);
        if (!t) return this.err(id, 'Komanda kodu səhvdir');
        if (!name) return this.err(id, 'Adın lazımdır');
        if (this.members(code).length >= 6) return this.err(id, 'Komanda doludur (maksimum 6 nəfər)');
        me.role = 'player'; me.team = code; me.name = name;
        break;
      }

      case 'signal': {
        if (this.allowed(id, m.to)) this.send(m.to, { t: 'signal', from: id, data: m.data });
        return;
      }

      case 'begin':
        if (!isHost) return;
        if (Object.keys(this.teams).length < 2) return this.err(id, 'Ən azı 2 komanda lazımdır');
        this.phase = 'idle';
        break;

      case 'ask': {
        if (!isHost || this.phase === 'lobby') return;
        const secs = Math.max(5, Math.min(600, Number(m.seconds) || 60));
        for (const t of Object.values(this.teams)) t.answer = null;
        this.phase = 'running';
        this.endsAt = Date.now() + secs * 1000;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          if (this.phase === 'running') { this.phase = 'ended'; this.broadcast(); }
        }, secs * 1000);
        break;
      }

      case 'answer': {
        if (me.role !== 'captain' || this.phase !== 'running') return;
        this.teams[me.team].answer = String(m.text || '').slice(0, 300);
        break;
      }

      case 'score': {
        if (!isHost) return;
        const t = this.teams[m.code];
        if (t) t.score = Math.max(0, t.score + (Number(m.delta) > 0 ? 1 : -1));
        break;
      }

      case 'next':
        if (!isHost) return;
        clearTimeout(this.timer);
        this.phase = 'idle';
        for (const t of Object.values(this.teams)) t.answer = null;
        break;

      case 'talkreq':
        if (me.role !== 'captain') return;
        me.wants = true;
        break;

      case 'talkgrant':
        if (!isHost) return;
        { const p = this.peers.get(m.id);
          if (!p || p.role !== 'captain') return;
          p.wants = false; this.speaker = m.id; }
        break;

      case 'talkend':
        if (!isHost) return;
        this.speaker = null;
        break;

      default: return;
    }
    this.broadcast();
  }

  onClose(id) {
    const me = this.peers.get(id);
    if (!me) return;
    this.peers.delete(id);
    if (this.speaker === id) this.speaker = null;
    if (id === this.hostId) {
      for (const pid of this.peers.keys()) this.send(pid, { t: 'closed' });
      return;
    }
    if (me.team && this.teams[me.team]) {
      const rest = this.members(me.team);
      if (!rest.length) delete this.teams[me.team];
      else if (me.role === 'captain') rest[0][1].role = 'captain';
    }
    this.broadcast();
  }
}

export class Account {
  constructor(state) {
    this.storage = state.storage;
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === '/session') {
      const user = await req.json();
      const token = crypto.randomUUID();
      const profile = {
        id: String(user.id || ''),
        name: String(user.name || '').trim().slice(0, 80),
        email: String(user.email || '').slice(0, 254)
      };
      if (!profile.id || !profile.name) return accountJson({ error: 'Profil məlumatı natamamdır.' }, 400);
      await this.storage.put(`session:${token}`, { expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
      await this.storage.put('profile', profile);
      return accountJson({ token, profile }, 200);
    }

    const auth = req.headers.get('Authorization') || '';
    const tokenMatch = /^Bearer\s+([A-Za-z0-9-]{36})$/i.exec(auth);
    if (!tokenMatch) return accountJson({ error: 'Hesaba daxil olun.' }, 401);
    const token = tokenMatch[1];
    const session = await this.storage.get(`session:${token}`);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) await this.storage.delete(`session:${token}`);
      return accountJson({ error: 'Sessiyanın vaxtı bitib. Yenidən daxil olun.' }, 401);
    }

    if (url.pathname === '/session' && req.method === 'DELETE') {
      await this.storage.delete(`session:${token}`);
      return accountJson({ ok: true });
    }
    if (url.pathname === '/' && req.method === 'GET') {
      return accountJson({
        profile: await this.storage.get('profile'),
        favorites: await this.storage.get('favorites') || [],
        results: await this.storage.get('results') || [],
        packages: await this.storage.get('packages') || []
      });
    }
    if (url.pathname === '/profile' && req.method === 'PUT') {
      const body = await req.json();
      const name = typeof body?.name === 'string' ? body.name.trim() : '';
      if (!name || name.length > 40) return accountJson({ error: 'Ad 1-40 simvol arasında olmalıdır.' }, 400);
      const profile = await this.storage.get('profile');
      if (!profile) return accountJson({ error: 'Profil tapılmadı.' }, 404);
      profile.name = name;
      await this.storage.put('profile', profile);
      return accountJson({ profile });
    }
    if (url.pathname === '/favorites' && req.method === 'PUT') {
      const body = await req.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return accountJson({ error: 'Favori sual məlumatı etibarlı deyil.' }, 400);
      }
      const item = body.item;
      if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 512) {
        return accountJson({ error: 'Favori sual məlumatı etibarlı deyil.' }, 400);
      }
      let favorites = await this.storage.get('favorites') || [];
      favorites = favorites.filter(value => value.id !== item.id);
      if (body.favorite === true) {
        if (favorites.length >= 500) return accountJson({ error: 'Favori limiti (500) dolub.' }, 409);
        favorites.unshift({
          id: item.id,
          question: String(item.question || '').slice(0, 4000),
          answer: String(item.answer || '').slice(0, 4000),
          packageName: String(item.packageName || '').slice(0, 160),
          packageLink: String(item.packageLink || '').slice(0, 500),
          topic: String(item.topic || '').slice(0, 160),
          type: String(item.type || '').slice(0, 30)
        });
      }
      await this.storage.put('favorites', favorites);
      return accountJson({ favorites });
    }
    if (url.pathname === '/packages' && req.method === 'POST') {
      const body = await req.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return accountJson({ error: 'Paket məlumatı etibarlı deyil.' }, 400);
      }
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const favoriteIds = Array.isArray(body.favoriteIds)
        ? Array.from(new Set(body.favoriteIds.filter(id => typeof id === 'string')))
        : [];
      if (!title || title.length > 60) return accountJson({ error: 'Paket adı 1-60 simvol arasında olmalıdır.' }, 400);
      if (!favoriteIds.length || favoriteIds.length > 100) {
        return accountJson({ error: 'Paket üçün 1-100 favori sual seçin.' }, 400);
      }
      const favorites = await this.storage.get('favorites') || [];
      const selected = favorites.filter(item => favoriteIds.includes(item.id));
      if (selected.length !== favoriteIds.length) {
        return accountJson({ error: 'Seçilən suallardan bəziləri favorilərinizdə tapılmadı.' }, 400);
      }
      let packages = await this.storage.get('packages') || [];
      if (packages.length >= 20) return accountJson({ error: 'Şəxsi paket limiti (20) dolub.' }, 409);
      packages = [{
        id: crypto.randomUUID(),
        title,
        createdAt: Date.now(),
        questions: selected
      }, ...packages];
      await this.storage.put('packages', packages);
      return accountJson({ packages });
    }
    if (url.pathname === '/results' && req.method === 'POST') {
      const body = await req.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return accountJson({ error: 'Oyun nəticəsinin formatı etibarlı deyil.' }, 400);
      }
      const result = body.result;
      if (
        !result ||
        typeof result.id !== 'string' ||
        !/^[A-Za-z0-9_-]{1,100}$/.test(result.id) ||
        !['nhn-voice', 'breyn-voice', 'xemse-voice'].includes(result.game) ||
        !Array.isArray(result.teams) ||
        result.teams.length < 1 ||
        result.teams.length > 8
      ) {
        return accountJson({ error: 'Oyun nəticəsinin formatı etibarlı deyil.' }, 400);
      }
      const teams = [];
      for (const team of result.teams) {
        if (!team || typeof team !== 'object') {
          return accountJson({ error: 'Komanda nəticəsi etibarlı deyil.' }, 400);
        }
        const score = Number(team.score);
        if (!Number.isInteger(score) || score < 0 || score > 100_000) {
          return accountJson({ error: 'Komanda xalı etibarlı deyil.' }, 400);
        }
        teams.push({ name: String(team.name || '').slice(0, 80), score });
      }
      const stored = await this.storage.get('results') || [];
      const entry = {
        id: result.id,
        game: result.game,
        title: String(result.title || '').slice(0, 120),
        teams,
        playedAt: Date.now()
      };
      const results = [entry, ...stored.filter(value => value.id !== entry.id)].slice(0, 100);
      await this.storage.put('results', results);
      return accountJson({ results });
    }
    return accountJson({ error: 'API endpoint tapılmadı.' }, 404);
  }
}
