module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const content = body.content || '';
    const username = body.username || 'Nequi Webhook';

    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }

    const webhookUrl = 'https://discord.com/api/webhooks/1533510435662331944/DYDjW9TD5X6m7oypId0yEJO9KQeLxidPG46HxsLg77h7X_1ydWj3AzYQFTmxYrWfLaLE';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, username }),
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Discord error', details: text });
    }

    return res.status(200).json({ ok: true, status: response.status, details: text });
  } catch (error) {
    return res.status(500).json({ error: 'Webhook proxy failed', details: error.message });
  }
};
