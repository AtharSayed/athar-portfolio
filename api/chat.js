module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const [{ DEFAULT_MODEL_ID }, { generateChatReply }] = await Promise.all([
    import('../server/chat-config.js'),
    import('../server/chat-service.js')
  ]);

  const result = await generateChatReply({
    body: req.body,
    apiKey: process.env.GROQ_API_KEY,
    modelId: process.env.GROQ_MODEL_ID || DEFAULT_MODEL_ID
  });
  return res.status(result.status).json(result.body);
};
