// Shared helpers for the API functions. Files starting with "_" are not exposed as endpoints.
const crypto = require('crypto');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const PASSWORD = process.env.DASHBOARD_PASSWORD || '';
const ROWS_KEY = 'ama:nps:rows';
const COOKIE = 'ama_session';

async function redisCall(path, body) {
  const r = await fetch(REDIS_URL.replace(/\/$/, '') + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j) throw new Error('Database request failed (' + r.status + ')');
  return j;
}
async function redis(cmd) {
  const j = await redisCall('', cmd);
  if (j.error) throw new Error(j.error);
  return j.result;
}
async function pipeline(cmds) {
  const j = await redisCall('/pipeline', cmds);
  for (const x of j) if (x.error) throw new Error(x.error);
  return j.map(x => x.result);
}

function sessionToken() {
  return crypto.createHmac('sha256', PASSWORD).update('ama-concierge-session-v1').digest('hex');
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function isAuthed(req) {
  if (!PASSWORD) return false;
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([a-f0-9]{64})'));
  return !!m && safeEqual(m[1], sessionToken());
}
function missingConfig() {
  const miss = [];
  if (!PASSWORD) miss.push('DASHBOARD_PASSWORD');
  if (!REDIS_URL || !REDIS_TOKEN) miss.push('the Redis database (KV_REST_API_URL and KV_REST_API_TOKEN)');
  return miss;
}
// Returns true when the request may continue; otherwise it has already answered.
function guard(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const miss = missingConfig();
  if (miss.length) { res.status(500).json({ error: 'not_configured', message: 'Missing in Vercel: ' + miss.join(' and ') + '.' }); return false; }
  if (!isAuthed(req)) { res.status(401).json({ error: 'signed_out' }); return false; }
  return true;
}

const FIELDS = { client: 's', reason: 's', partner: 's', concierge: 's', property: 's', propertyRef: 's', bookingId: 's', date: 's', tipCurrency: 's', partnerListing: 's', country: 's', month: 's', vote: 'n', tip: 'n', seq: 'n', surveyId: 'n' };
function cleanRow(input) {
  if (!input || typeof input !== 'object') return null;
  const id = String(input.id || '');
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return null;
  const row = { id };
  for (const [k, t] of Object.entries(FIELDS)) {
    const v = input[k];
    if (t === 's') row[k] = typeof v === 'string' ? v.slice(0, 600) : '';
    else row[k] = typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  if (!row.client.trim() || !Number.isInteger(row.vote) || row.vote < 0 || row.vote > 10 || !/^\d{4}-\d{2}$/.test(row.month)) return null;
  row.at = new Date().toISOString();
  return row;
}

function parseHash(flat) {
  const rows = [];
  if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) { try { rows.push(JSON.parse(flat[i + 1])); } catch (e) { /* skip a damaged row */ } }
  else if (flat && typeof flat === 'object') for (const v of Object.values(flat)) { try { rows.push(typeof v === 'string' ? JSON.parse(v) : v); } catch (e) { /* skip */ } }
  return rows;
}
// Reads every response. The first time the database is empty, it is filled from _seed.json.
async function loadRows() {
  let rows = parseHash(await redis(['HGETALL', ROWS_KEY]));
  if (rows.length) return rows;
  const lock = await redis(['SET', 'ama:nps:seeding', '1', 'NX', 'EX', '120']);
  if (lock !== 'OK') { await new Promise(r => setTimeout(r, 2500)); return parseHash(await redis(['HGETALL', ROWS_KEY])); }
  const seed = require('./_seed.json');
  const cmds = [];
  for (let i = 0; i < seed.length; i += 150) {
    const cmd = ['HSET', ROWS_KEY];
    for (const r of seed.slice(i, i + 150)) cmd.push(r.id, JSON.stringify(r));
    cmds.push(cmd);
  }
  await pipeline(cmds);
  return seed;
}

module.exports = { redis, pipeline, guard, isAuthed, sessionToken, safeEqual, missingConfig, cleanRow, loadRows, ROWS_KEY, COOKIE, PASSWORD };
