import { DEFAULT_MODEL_ID } from '../server/chat-config.js';
import { generateChatReply } from '../server/chat-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const result = await generateChatReply({
    body: req.body,
    apiKey: process.env.GROQ_API_KEY,
    modelId: process.env.GROQ_MODEL_ID || DEFAULT_MODEL_ID
  });
  return res.status(result.status).json(result.body);
}