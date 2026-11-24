const { guard } = require('./_lib');

// Sends a conversation (and optionally a booking screenshot) to the Claude API and returns one JSON object.
module.exports = async (req, res) => {
  if (!guard(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'not_configured', message: 'Missing in Vercel: ANTHROPIC_API_KEY.' });
  const body = req.body || {};
  const prompt = String(body.prompt || '').slice(0, 240000);
  const images = (Array.isArray(body.images) ? body.images : []).slice(0, 3)
    .filter(i => i && /^image\/(png|jpeg|webp|gif)$/.test(i.mediaType) && typeof i.data === 'string');
  if (!prompt) return res.status(400).json({ error: 'invalid_request' });
  const content = images.map(i => ({ type: 'image', source: { type: 'base64', media_type: i.mediaType, data: i.data } }));
  content.push({ type: 'text', text: prompt });
  try {
    const r = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 8000, messages: [{ role: 'user', content }] }),
    });
    const j = await r.json().catch(() => null);
    if (r.status === 429) return res.status(429).json({ error: 'rate_limited' });
    if (!r.ok || !j) return res.status(502).json({ error: 'upstream_error', message: (j && j.error && j.error.message) || ('Claude API answered ' + r.status) });
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    let result = null;
    try { result = JSON.parse(a >= 0 && b > a ? text.slice(a, b + 1) : text); } catch (e) { /* handled below */ }
    if (!result || typeof result !== 'object') return res.status(502).json({ error: 'invalid_json' });
    res.status(200).json({ result });
  } catch (e) { res.status(502).json({ error: 'upstream_error', message: String(e.message || e) }); }
};
