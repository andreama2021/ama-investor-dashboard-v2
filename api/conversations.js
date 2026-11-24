const { guard, redis } = require('./_lib');
const KEY = 'ama:conv';
const okId = id => /^[A-Za-z0-9_-]{1,40}$/.test(String(id || ''));

// GET                      returns every analysed conversation
// POST { upsert: conv }    adds or replaces one conversation
// POST { remove: [id] }    deletes conversations
module.exports = async (req, res) => {
  if (!guard(req, res)) return;
  try {
    if (req.method === 'GET') {
      const flat = await redis(['HGETALL', KEY]);
      const out = [];
      if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) { try { out.push(JSON.parse(flat[i + 1])); } catch (e) { /* skip a damaged record */ } }
      return res.status(200).json({ conversations: out });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const body = req.body || {};
    if (body.upsert) {
      const c = body.upsert;
      if (!okId(c.id) || typeof c.client !== 'string' || !Array.isArray(c.messages) || !c.messages.length) return res.status(400).json({ error: 'invalid_conversation' });
      c.savedAt = new Date().toISOString();
      const json = JSON.stringify(c);
      if (json.length > 900000) return res.status(400).json({ error: 'too_large', message: 'This conversation is too long to store in one piece.' });
      await redis(['HSET', KEY, c.id, json]);
      return res.status(200).json({ ok: true, conversation: c });
    }
    if (Array.isArray(body.remove)) {
      const ids = body.remove.filter(okId).slice(0, 100);
      if (ids.length) await redis(['HDEL', KEY, ...ids]);
      return res.status(200).json({ ok: true });
    }
    res.status(400).json({ error: 'invalid_request' });
  } catch (e) { res.status(502).json({ error: 'database_error', message: String(e.message || e) }); }
};
