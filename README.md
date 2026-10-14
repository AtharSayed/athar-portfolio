<div align="center">

# Athar Sayed

### AI/ML · Generative AI · Agentic AI

A personal portfolio showcasing my professional experience, selected projects, technical skills, publications, achievements, and certifications — with **IRIS**, an AI portfolio assistant powered by Groq.

<p>
  <a href="https://athar-sayed-portfolio.vercel.app/">View Portfolio</a>
</p>

<p>
  <img src="https://img.shields.io/badge/HTML5-Markup-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-Styling-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=flat-square&logo=javascript&logoColor=111111" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-API-444444?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Groq-LLM_Inference-F55036?style=flat-square" alt="Groq" />
  <img src="https://img.shields.io/badge/Vercel-Deployment-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

</div>

---

## Overview

This repository contains the source for my portfolio website. It combines a responsive, HUD-inspired interface with sections covering my background and work. The site also includes **IRIS**, a portfolio-focused chatbot that answers questions using information available in the portfolio.

IRIS uses Groq's OpenAI-compatible Chat Completions API with the `openai/gpt-oss-20b` model. Chat requests are handled server-side so the Groq API key is not exposed to the browser.

## At a glance

| Area | Details |
| --- | --- |
| **Portfolio** | Home, About, Projects, Achievements, Skills, Experience, Publications, Certifications, and Blog |
| **Interface** | Responsive layout, HUD-inspired visuals, mobile navigation, and floating chat panel |
| **AI assistant** | IRIS answers portfolio-related questions about skills, projects, experience, education, and achievements |
| **Response grounding** | Answers are based on portfolio content; unsupported personal details are not invented and unrelated questions are declined |
| **Chat backend** | Node.js and Express locally; Vercel serverless function when deployed |
| **Model provider** | Groq — `openai/gpt-oss-20b` |

## Contents

- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [How IRIS works](#how-iris-works)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [Chat API](#chat-api)
- [Test the chatbot](#test-the-chatbot)
- [Deployment](#deployment)
- [Security and privacy](#security-and-privacy)
- [Troubleshooting](#troubleshooting)

## Technology stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | HTML, CSS, vanilla JavaScript |
| **Local backend** | Node.js, Express, native `fetch` API |
| **LLM inference** | Groq OpenAI-compatible Chat Completions API |
| **Hosted chat API** | Vercel serverless function |
| **Testing** | PowerShell smoke-test script |

## Project structure

```text
.
├── .gitignore
├── README.md
├── Athar-Sayed-Resume.pdf
├── index.html
├── test-chatbot.ps1
├── vercel.json
├── api/
│   └── chat.js
├── css/
│   ├── styles.css
│   ├── hud.css
│   └── chat-hud.css
├── images/
├── js/
│   ├── scripts.js
│   └── hud-effects.js
├── server/
│   ├── .env                    # Create locally; contains secrets and is ignored by Git
│   ├── chat-config.js
│   ├── chat-service.js
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
└── package-lock.json           # Root-level lockfile; backend dependencies live in server/
```

### Key files

| Path | Responsibility |
| --- | --- |
| `index.html` | Main portfolio page, chatbot markup, and public profile content used to ground answers. |
| `css/styles.css` | Shared layout, typography, colors, responsive rules, and general site styling. |
| `css/hud.css` | HUD-inspired page interface and related visual elements. |
| `css/chat-hud.css` | Chat window, message bubbles, input, and chatbot-specific styling. |
| `js/scripts.js` | Browser interactions, navigation, and chatbot UI. Sends prompts and conversation history to `/api/chat`; contains no Groq API key. |
| `js/hud-effects.js` | Intro/boot screen, section-navigation effects, and HUD/theme interactions. |
| `images/` | Profile and project images, employer logos, certificates, and supporting media. |
| `Athar-Sayed-Resume.pdf` | Downloadable resume linked from the portfolio. |
| `api/chat.js` | Vercel serverless entry point for `POST /api/chat`; forwards requests to the shared chat service. |
| `server/index.js` | Local Express application that serves the portfolio, exposes local API routes, and starts the Node.js server. |
| `server/chat-service.js` | Shared request orchestration, model calls, timeouts, retries, inference-error handling, and response cleanup. |
| `server/chat-config.js` | Model defaults, system instructions, portfolio-context extraction, prompt/history validation, intent guidance, and response formatting. |
| `server/package.json` | Backend package metadata, dependencies, and `start`/`dev` scripts. |
| `server/package-lock.json` | Locked versions of backend dependencies. Use with the manifest in `server/`. |
| `server/.env` | Local environment variables, including the Groq API key. Create locally and never commit it. |
| `vercel.json` | Vercel routing and function configuration, including bundling `index.html` for chatbot context loading. |
| `test-chatbot.ps1` | Manual smoke-test prompts for portfolio questions, follow-ups, missing facts, out-of-scope requests, and prompt-injection attempts. |
| `.gitignore` | Excludes local secrets, dependency directories, generated output, and log files from Git. |

## How IRIS works

The local Express route and Vercel function use the same shared chat service, keeping request handling consistent across environments.

```text
Browser chat UI
    │
    └── POST /api/chat
         ├── Local: server/index.js
         └── Vercel: api/chat.js
                  │
                  └── server/chat-service.js
                           ├── server/chat-config.js
                           ├── Portfolio context from index.html
                           └── Groq Chat Completions API
```

The backend loads portfolio context from `index.html`. Client-supplied context is not required as the source of truth.

## Run locally

### Prerequisites

- **Node.js 18 or newer**
- A **Groq API key** with access to the configured model

### 1. Install dependencies

Run this command from the repository root:

```powershell
npm --prefix server install
```

### 2. Configure environment variables

Create a `server/.env` file and add your own Groq credentials:

```dotenv
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL_ID=openai/gpt-oss-20b
PORT=5173
```

Keep this file private. The local server loads `server/.env` through `dotenv`; never commit or share its contents.

### 3. Start the application

```powershell
npm --prefix server start
```

Open the portfolio at **http://localhost:5173**.

To check whether the local API server is running, open **http://localhost:5173/api/health**. A healthy server returns:

```json
{
  "status": "ok"
}
```

### Development mode

For automatic server restarts during development:

```powershell
npm --prefix server run dev
```

## Configuration

The backend reads the following environment variables:

| Variable | Required | Default | Description |
| --- | :---: | --- | --- |
| `GROQ_API_KEY` | Yes | — | Server-side secret used to authenticate with Groq. |
| `GROQ_MODEL_ID` | No | `openai/gpt-oss-20b` | Model ID used for chat inference. |
| `PORT` | No | `5173` | Port used by the local Express server. |

Chat behavior and request handling are split across these files:

- **`server/chat-config.js`** — prompt instructions, portfolio context, intent handling, validation, and response formatting.
- **`server/chat-service.js`** — Groq requests, timeouts, retries, and inference-error handling.

The local Express route and Vercel function both call the shared chat service.

## Chat API

### `POST /api/chat`

Sends a user prompt and optional conversation history to IRIS.

**Request body**

```json
{
  "prompt": "What projects has Athar worked on?",
  "history": []
}
```

`history` is optional. When supplied, it is an array of conversation turns in this format:

```json
{
  "role": "user",
  "content": "Tell me about your AI projects."
}
```

The `role` can be `user` or `assistant`. The backend loads portfolio context from `index.html`; there is no need to send portfolio context from the browser.

**Successful response**

```json
{
  "reply": "A concise answer based on the portfolio data."
}
```

Malformed requests and missing API credentials result in error responses. Inference failures are handled by the shared chat service and returned as a user-facing retry message.

### `GET /api/health`

Returns a small health response for checking the local Express server.

## Test the chatbot

Start the local server first, then run the PowerShell smoke-test script from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\test-chatbot.ps1
```

The script displays replies for manual review. Its prompts cover:

- Portfolio questions and follow-up questions
- Details that are not present in the portfolio
- Unrelated or out-of-scope requests
- Prompt-injection attempts

This is a manual smoke test, not a replacement for deployment or provider integration tests. Tests require a valid Groq API key and may be affected by model availability, rate limits, or account quotas.

## Deployment

### Vercel

The repository includes `vercel.json` to bundle `index.html` with the chat function and redirect requests under `/server/` to the site root.

1. Import the repository into Vercel.
2. Add `GROQ_API_KEY` under the project's **Environment Variables** settings.
3. Optionally set `GROQ_MODEL_ID` to override the default model.
4. Deploy the project and test the website and `/api/chat` endpoint.

**Never add the API key to frontend JavaScript or commit it to the repository.**

### Node.js host

Deploy the repository to a Node.js host and configure `GROQ_API_KEY` through the host's environment settings. You can also set `GROQ_MODEL_ID` and `PORT` if needed.

Install the backend dependencies and start the service with:

```powershell
npm --prefix server install
npm --prefix server start
```

## Security and privacy

- Keep `GROQ_API_KEY` in server-side environment configuration only.
- Do not commit `.env` files, API keys, or other credentials.
- The backend uses portfolio content loaded from `index.html`; browser-supplied context is not treated as the source of truth.
- IRIS is instructed to stay within portfolio topics, avoid unsupported personal claims, reject requests to disclose prompts, and not reveal hidden instructions or credentials.

## Troubleshooting

| Issue | What to check |
| --- | --- |
| `GROQ_API_KEY missing` | Ensure `server/.env` exists for local development or the key is configured on the deployment host. Restart the local server or redeploy after changing environment settings. |
| Port already in use | Set `PORT` to an available local port, then open the site on that port. |
| Inference errors or rate limits | Check server logs, Groq model availability, API-key permissions, and account quota. If rate-limited, wait before retrying. |
| Site loads but chat does not respond | Check `/api/health` locally, the browser's Network panel, and deployment logs for the chat function. |

---

<div align="center">

**Athar Sayed** · AI/ML & Generative AI Portfolio

</div>
