import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());

const PORT = process.env.PORT || 5173;
const HF_API_KEY = process.env.HF_API_KEY;

// Official OpenAI-compatible router endpoint
const HF_CHAT_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';

// Minimal fallback JSON
const FALLBACK_RESUME_JSON = {
  name: "Athar Sayed",
  summary: "AI/ML Engineer pursuing M.Tech in AI at NMIMS. Expertise in Python, C++, TensorFlow, real-time systems, and production deployment.",
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  publications: [],
  achievements: []
};

if (!HF_API_KEY) {
  console.warn('⚠️ Warning: HF_API_KEY not set. Set it in .env or environment.');
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Resume endpoint: PDF primary, HTML supplement, fallback last
app.get('/api/resume', async (req, res) => {
  let resumeJson = { ...FALLBACK_RESUME_JSON };
  let sources = [];

  try {
    // 1. PDF parsing (primary source)
    const pdfPath = path.join(__dirname, '..', 'Athar-Sayed-Resume.pdf');
    if (fs.existsSync(pdfPath)) {
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfParse = await import('pdf-parse');
      const parsed = await pdfParse.default(dataBuffer);
      const rawText = String(parsed.text || '').replace(/\s+/g, ' ').trim();
      if (rawText.length > 200) {
        const pdfJson = parseResumeToJson(rawText);
        resumeJson = {
          ...resumeJson,
          academic: pdfJson.academic || [],
          projects: pdfJson.projects || [],
          experience: pdfJson.experience || [],
          certifications: pdfJson.certifications || [],
          publications: pdfJson.publications || [],
          skills: pdfJson.skills || [],
          extraCurricular: pdfJson.extraCurricular || []
        };
        sources.push('PDF');
      }
    }

    // 2. HTML portfolio supplement
    const htmlPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const portfolio = parsePortfolioHtml(htmlContent);
      resumeJson.summary = portfolio.summary || resumeJson.summary;
      resumeJson.education = portfolio.education.length ? portfolio.education : resumeJson.academic.map(a => ({ degree: a, details: '' }));
      resumeJson.projects = [...resumeJson.projects, ...portfolio.projects];
      resumeJson.certifications = [...resumeJson.certifications, ...portfolio.certifications.map(c => c.title + ' - ' + c.issuer)];
      resumeJson.achievements = [...(resumeJson.achievements || []), ...portfolio.achievements];
      sources.push('Portfolio HTML');
    }

    // Ensure all arrays
    ['education', 'experience', 'projects', 'skills', 'certifications', 'publications', 'achievements'].forEach(k => {
      resumeJson[k] = Array.isArray(resumeJson[k]) ? resumeJson[k] : [];
    });

    console.log(`✅ Resume loaded from ${sources.join(' + ')} | Projects: ${resumeJson.projects.length} | Experience: ${resumeJson.experience.length}`);
    return res.json(resumeJson);
  } catch (err) {
    console.error('Resume load error:', err);
    return res.status(500).json({ error: 'Failed to load; using fallback', resume: resumeJson });
  }
});

// Chat endpoint: Fixed typo here
app.post('/api/chat', async (req, res) => {
  if (!HF_API_KEY) return res.status(500).json({ error: 'HF_API_KEY missing' });

  try {
    const { prompt = '', context = '', history = [] } = req.body || {};
    if (!prompt.trim()) return res.status(400).json({ error: 'Prompt required' });

    // Context can now be a string (from frontend gatherProfileContext) or JSON object
    let contextText = '';
    if (typeof context === 'string') {
      contextText = context; // Already formatted text from frontend
    } else if (typeof context === 'object' && context !== null) {
      // Fallback: if context is still an object, format it
      contextText = `
Name: ${context.name || 'Athar Sayed'}
Summary: ${context.summary || 'N/A'}
Education: ${(context.education || []).map(e => e.degree || e || 'N/A').join('\n') || 'N/A'}
Experience: ${(context.experience || []).map(e => `${e.role || ''} @ ${e.company || ''} (${e.dates || ''}): ${(e.details || []).join('; ')}`).join('\n') || 'N/A'}
Projects: ${(context.projects || []).map(p => `${p.name || ''}: ${(p.details || []).join('; ')}`).join('\n') || 'N/A'}
Skills: ${(context.skills || []).join('; ') || 'N/A'}
Certifications: ${(context.certifications || []).join('; ') || 'N/A'}
      `.trim();
    }

    console.log('Chat request | Context length:', contextText.length, '| Prompt:', prompt.substring(0, 50));

    // Strengthened system message emphasizing context-only answers
    const systemMessage = {
      role: 'system',
      content: `You are a professional assistant for Athar Sayed's portfolio and resume. You MUST ONLY answer questions using the provided resume/profile context below. DO NOT use external knowledge or assumptions. Keep answers concise (2-3 sentences max) and factual. If the answer is not in the context, respond with "I don't know." Always reference specifics from the resume.`
    };

    const messages = [systemMessage];
    (history || []).slice(-5).forEach(h => messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }));

    // Build the full prompt with context and question
    messages.push({
      role: 'user',
      content: `RESUME/PROFILE CONTEXT:\n${contextText}\n\n---\n\nQUESTION: ${prompt}\n\nANSWER (use only context above):`
    });

    const response = await fetch(HF_CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        messages,
        temperature: 0.1,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('HF error:', err);
      return res.status(502).json({ error: 'Model failed', details: err });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() || 'No reply';

    // Safer sanitizer: remove code fences and excessive whitespace, but preserve punctuation,
    // parentheses, acronyms, and other useful characters so the model's full answer remains intact.
    function sanitizeReplyText(text) {
      if (!text) return '';
      let t = String(text);
      // Remove fenced code blocks (```...```) entirely
      t = t.replace(/```[\s\S]*?```/g, '');
      // Remove inline code backticks but keep the content
      t = t.replace(/`([^`]*)`/g, '$1');
      // Normalize line endings
      t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      // Collapse more than two newlines to two
      t = t.replace(/\n{3,}/g, '\n\n');
      // Collapse multiple spaces/tabs into a single space
      t = t.replace(/[ \t]{2,}/g, ' ');
      // Trim
      return t.trim();
    }

    reply = sanitizeReplyText(reply);
    // If reply is empty after sanitization, fall back to a safe unknown response
    if (!reply) reply = "I don't know.";

    console.log('Reply preview:', reply.substring(0, 100));
    return res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Robust Resume Chat Proxy running on http://localhost:${PORT}`));