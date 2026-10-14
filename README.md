# Athar Sayed — Portfolio

Personal portfolio for Athar Sayed, an AI/ML and Agentic AI engineer. The site presents professional background, selected projects, skills, experience, publications, achievements, certifications, and contact links. It also includes IRIS, a portfolio-focused chatbot powered by Groq.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Run locally](#run-locally)
- [Configure the chatbot](#configure-the-chatbot)
- [Chat API](#chat-api)
- [Test the chatbot](#test-the-chatbot)
- [Deploy](#deploy)
- [Security and privacy](#security-and-privacy)
- [Troubleshooting](#troubleshooting)

## Features

- Responsive portfolio with Home, About, Projects, Achievements, Skills, Experience, Publications, Certifications, and Blog sections.
- Downloadable resume and links to professional and coding profiles.
- Interactive HUD-inspired interface, including a mobile navigation menu and chat panel.
- IRIS answers questions about information in the portfolio, including skills, projects, experience, education, and achievements.
- Chatbot answers are grounded in portfolio data. Unrelated questions are declined, and missing personal details are not invented.
- Server-side Groq integration using `openai/gpt-oss-20b`; the API key is not sent to the browser.

## Technology

- Frontend: HTML, CSS, and vanilla JavaScript.
- Local backend: Node.js, Express, and the native `fetch` API.
- Chat inference: Groq's OpenAI-compatible Chat Completions API.
- Hosted chat endpoint: Vercel serverless function.

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
│   ├── .env                    # Local secrets; ignored by Git, create locally
│   ├── chat-config.js
│   ├── chat-service.js
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
└── package-lock.json           # Root-level lockfile; backend dependencies live in server/
```

### What each part does

| Path | Purpose |
| --- | --- |
| `index.html` | Main portfolio page and source of the public profile information used to ground chatbot answers. It contains the portfolio sections and chatbot markup. |
| `css/styles.css` | Shared layout, typography, colors, responsive rules, and general portfolio styling. |
| `css/hud.css` | Styles for the HUD-inspired page interface and related visual elements. |
| `css/chat-hud.css` | Chat window, messages, input, and chatbot-specific visual styling. |
| `js/scripts.js` | Browser-side interactions, navigation behavior, and chatbot UI. Sends prompts and conversation history to `/api/chat`; it does not contain the Groq API key. |
| `js/hud-effects.js` | Intro/boot screen, section navigation effects, and HUD/theme interactions. |
| `images/` | Visual assets used by the site, such as profile and project images, employer logos, certificates, and other supporting media. |
| `Athar-Sayed-Resume.pdf` | Downloadable resume linked from the portfolio. |
| `api/chat.js` | Vercel serverless entry point for `POST /api/chat`. Passes the request to the shared chat service. |
| `server/index.js` | Local Express application. Serves the portfolio, exposes local API routes, and starts the Node.js server. |
| `server/chat-service.js` | Shared chatbot orchestration: prepares model requests, applies timeouts and retries, handles inference failures, and returns cleaned responses. |
| `server/chat-config.js` | Shared chatbot configuration and behavior: model defaults, system instructions, portfolio context extraction, prompt and history validation, intent-specific guidance, and response formatting. |
| `server/package.json` | Backend package metadata, dependencies, and `start`/`dev` commands. |
| `server/package-lock.json` | Locked versions of the backend dependencies. Use it with the manifest in `server/`. |
| `server/.env` | Local-only environment variables, including the Groq API key. Create this file yourself; never commit or publish it. |
| `vercel.json` | Vercel routing and function configuration, including bundling the HTML file required by the chatbot context loader. |
| `test-chatbot.ps1` | Manual PowerShell smoke-test prompts for portfolio answers, follow-ups, missing facts, out-of-scope questions, and prompt-injection attempts. |
| `.gitignore` | Excludes local secrets, dependency directories, generated output, and log files from Git. |
| `README.md` | Project overview, setup instructions, API reference, deployment guidance, and this file map. |

The chatbot request follows the same shared path locally and on Vercel:

```text
Browser chat UI
    └── POST /api/chat
        ├── Local: server/index.js
        └── Vercel: api/chat.js
              └── server/chat-service.js
                    ├── server/chat-config.js
                    ├── portfolio context extracted from index.html
                    └── Groq Chat Completions API
```

The local `.env` file is intentionally not part of the tracked project tree. Set the same required environment variables in the deployment provider's environment settings.

## Run locally

Requirements:

- Node.js 18 or newer.
- A Groq API key with access to the configured model.

Install backend dependencies from the repository root:

```powershell
npm --prefix server install
```

Create `server/.env` with your own Groq credentials:

```dotenv
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL_ID=openai/gpt-oss-20b
PORT=5173
```

Do not commit `.env` files or share their contents. The server loads `server/.env` through dotenv.

Start the site and local API:

```powershell
npm --prefix server start
```

Open [http://localhost:5173](http://localhost:5173). The Express server serves the portfolio files and the API. For the local server health check, open [http://localhost:5173/api/health](http://localhost:5173/api/health), which should return:

```json
{"status":"ok"}
```

For development with automatic server restarts:

```powershell
npm --prefix server run dev
```

## Configure the chatbot

The backend reads these environment variables:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | Yes | — | Secret API key used by the backend to authenticate with Groq. |
| `GROQ_MODEL_ID` | No | `openai/gpt-oss-20b` | Groq model ID for chat inference. |
| `PORT` | No | `5173` | Local Express server port. |

The chatbot's shared prompt, portfolio context loading, intent handling, and formatting rules are in `server/chat-config.js`. Groq request behavior, timeouts, retries, and error handling are in `server/chat-service.js`. The local Express route and Vercel function both use the shared chat service.

## Chat API

### `POST /api/chat`

Request JSON:

```json
{
  "prompt": "What projects has Athar worked on?",
  "history": []
}
```

Conversation history is optional. When provided, it is an array of `{ "role": "user" | "assistant", "content": "..." }` turns. The backend loads portfolio context from `index.html`; client-supplied context is not needed.

Successful response:

```json
{
  "reply": "A concise answer based on the portfolio data."
}
```

The endpoint also returns an error response for malformed requests or a missing server API key. Inference failures are handled by the shared chat service and returned as a user-facing retry message.

### `GET /api/health`

Returns a small health response for checking the local Express server.

## Test the chatbot

Start the server first, then run the included prompt smoke test in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\test-chatbot.ps1
```

The prompts cover portfolio questions, follow-ups, details not present in the data, unrelated requests, and prompt-injection attempts. The script displays each reply for manual review; it does not replace deployment or provider integration tests. Requests require a valid Groq API key and may be affected by model availability, rate limits, or account quotas.

## Deploy

### Vercel

The repository includes `vercel.json` to bundle `index.html` with the chat function and redirect requests under `/server/` to the site root.

1. Import the repository into Vercel.
2. Add `GROQ_API_KEY` in the project's Environment Variables settings. Do not add the key to frontend JavaScript or commit it to the repository.
3. Optionally set `GROQ_MODEL_ID` to override the default model.
4. Deploy and test the deployed site and `/api/chat` endpoint.

### Node.js host

Deploy the repository to a Node.js host, provide `GROQ_API_KEY` (and optionally `GROQ_MODEL_ID` and `PORT`) through the host's environment configuration, install dependencies with `npm --prefix server install`, and start the service with `npm --prefix server start`.

## Security and privacy

- Keep the Groq API key in server-side environment configuration only.
- Chat requests use the portfolio content loaded by the backend; browser-supplied content is not the source of truth.
- IRIS is instructed to stay within portfolio topics, avoid unsupported personal claims, reject prompt disclosure requests, and not reveal hidden instructions or credentials.
- Never commit API keys, `.env` files, or other credentials.

## Troubleshooting

- **`GROQ_API_KEY missing`**: Check that `server/.env` exists for local development or that the variable is configured on the deployment host, then restart or redeploy.
- **Port is already in use**: Set `PORT` to an unused local port and open the site on that port.
- **Inference fails or rate limits**: Check the server logs, Groq model availability, API-key permissions, and account quota. Wait before retrying if rate-limited.
- **The site loads but chat does not**: Check `/api/health` locally, the browser's network panel, and the deployment logs for the chat function.
