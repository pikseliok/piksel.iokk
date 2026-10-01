export default {
  async fetch(req, env) {
    const m = new URL(req.url).pathname.match(/^\/room\/([A-Za-z0-9]{4,8})$/);
    if (!m) return new Response('piksel-nhn işləyir');
    if (req.headers.get('Upgrade') !== 'websocket')
      return new Response('WebSocket lazımdır', { status: 426 });
    const id = env.ROOMS.idFromName(m[1].toUpperCase());
    return env.ROOMS.get(id).fetch(req);
  }
};

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
