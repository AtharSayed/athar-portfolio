import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { DEFAULT_MODEL_ID } from './chat-config.js';
import { generateChatReply } from './chat-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 5173;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL_ID = process.env.GROQ_MODEL_ID || DEFAULT_MODEL_ID;

const FALLBACK_RESUME_JSON = {
  name: 'Athar Sayed',
  summary: 'AI/ML Engineer who completed an M.Tech in Artificial Intelligence at NMIMS in 2026. Expertise in Python, C++, TensorFlow, real-time systems, and production deployment.',
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  publications: [],
  achievements: []
};

if (!GROQ_API_KEY) {
  console.warn('GROQ_API_KEY is not set. Add it to server/.env or the server environment.');
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

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

app.post('/api/chat', async (req, res) => {
  const result = await generateChatReply({ body: req.body, apiKey: GROQ_API_KEY, modelId: GROQ_MODEL_ID });
  return res.status(result.status).json(result.body);
});

app.listen(PORT, () => console.log(`Portfolio chat server running on http://localhost:${PORT}`));