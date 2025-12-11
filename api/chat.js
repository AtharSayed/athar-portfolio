// api/chat.js — Vercel serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const HF_API_KEY = process.env.HF_API_KEY;
  const HF_CHAT_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';

  if (!HF_API_KEY) {
    return res.status(500).json({ error: 'HF_API_KEY missing' });
  }

  try {
    const { prompt = '', context = '', history = [] } = req.body;

    // Logging for reliability (visible in Vercel logs)
    console.log('Chat request received:', {
      promptPreview: prompt.substring(0, 50) + '...',
      contextLength: context.length,
      contextPreview: context.substring(0, 100) + '...',
      historyLength: history.length
    });

    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant specialized in Athar Sayed's professional background, resume, and portfolio. 
IMPORTANT: Base EVERY answer EXCLUSIVELY on the provided Resume Context. Do not use external knowledge or assumptions. 
If the context does not directly address the question, respond briefly: "Based on the resume, I don't have specific details on that." 
Keep responses concise (under 150 words), factual, and structured (e.g., use bullet points for lists). 
Always reference key details from the context to show relevance.`.trim()
    };

    const messages = [systemMessage];

    for (const turn of history) {
      messages.push({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.content
      });
    }

    const userContent = context 
      ? `Resume Context (use this only):\n\n${context}\n\nUser Question: ${prompt}\n\nResponse (based strictly on the context above):`
      : `No resume context available. User Question: ${prompt}`;
    
    messages.push({
      role: 'user',
      content: userContent
    });

    const response = await fetch(HF_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        messages,
        temperature: 0.3,  // Lowered for more deterministic, context-faithful responses
        max_tokens: 400    // Slightly increased for complete answers
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API error:', response.status, errorText);
      return res.status(502).json({ error: 'Model inference failed', details: errorText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: 'Empty response from model', raw: data });
    }

    console.log('Model reply preview:', reply.substring(0, 100) + '...');

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Vercel Llama error:', err);
    return res.status(500).json({ error: err.message });
  }
}