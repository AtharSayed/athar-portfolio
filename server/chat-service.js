import {
  GROQ_CHAT_ENDPOINT,
  DEFAULT_MODEL_ID,
  OWNER_EMAIL,
  INTERNAL_PROMPT_RESPONSE,
  buildChatMessages,
  cleanReply,
  detectIntent,
  isInternalPromptRequest,
  loadPortfolioContext,
  normalizeChatInput
} from './chat-config.js';

// A failure is NOT the same as "not in the portfolio", so it gets its own message.
export const ERROR_RESPONSE = `I'm having trouble responding right now. Please try again in a moment, or email Athar directly at ${OWNER_EMAIL}.`;

const BASE_PARAMS = {
  temperature: 0.3,
  top_p: 0.9,
  reasoning_effort: 'low',   // 'medium' if answers feel shallow; GPT-OSS cannot turn reasoning off
  include_reasoning: false
};
const TOKEN_BUDGET = 2000;        // INCLUDES hidden reasoning tokens
const TOKEN_BUDGET_RETRY = 4000;  // used once if the first attempt ran out of tokens
const TIMEOUT_MS = 25000;

let includeReasoningParam = true; // flips to false if Groq rejects the parameter

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (reply) => ({ status: 200, body: { reply } });

async function requestGroq({ apiKey, modelId, messages, maxTokens }) {
  const body = {
    model: modelId,
    messages,
    ...BASE_PARAMS,
    include_reasoning: includeReasoningParam ? false : undefined,
    max_completion_tokens: maxTokens
  };
  const res = await fetch(GROQ_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (res.ok) return { ok: true, status: res.status, data: await res.json() };
  return { ok: false, status: res.status, errText: (await res.text().catch(() => '')).slice(0, 300) };
}

// One call with the retries that actually help: bad optional param, rate limit, 5xx.
async function callWithRetries(args) {
  let r = await requestGroq(args);

  if (!r.ok && r.status === 400 && includeReasoningParam && /reasoning/i.test(r.errText)) {
    console.warn('[chat] Groq rejected include_reasoning; retrying without it:', r.errText);
    includeReasoningParam = false;
    r = await requestGroq(args);
  }
  if (!r.ok && (r.status === 429 || r.status >= 500)) {
    await sleep(800);
    r = await requestGroq(args);
  }
  return r;
}

export async function generateChatReply({ body, apiKey, modelId = DEFAULT_MODEL_ID }) {
  if (!apiKey) return { status: 500, body: { error: 'GROQ_API_KEY missing' } };

  const { prompt, history } = normalizeChatInput(body);
  if (!prompt) return { status: 400, body: { error: 'Prompt required' } };
  if (isInternalPromptRequest(prompt)) return ok(INTERNAL_PROMPT_RESPONSE);

  const context = loadPortfolioContext();
  if (!context) {
    console.error('[chat] Portfolio context is empty (is index.html bundled/readable?)');
    return ok(ERROR_RESPONSE);
  }

  const intent = detectIntent(prompt);
  const messages = buildChatMessages({ prompt, context, history });
  const started = Date.now();

  try {
    let r = await callWithRetries({ apiKey, modelId, messages, maxTokens: TOKEN_BUDGET });
    let reply = '';
    let attempts = 1;

    const readReply = (result) => {
      if (!result.ok) return { text: '', finish: `http_${result.status}` };
      const choice = result.data.choices?.[0];
      return { text: cleanReply(choice?.message?.content), finish: choice?.finish_reason };
    };

    let parsed = readReply(r);
    reply = parsed.text;

    // Ran out of tokens while "thinking": retry once with a larger budget instead of failing.
    if (!reply && parsed.finish === 'length') {
      attempts = 2;
      r = await callWithRetries({ apiKey, modelId, messages, maxTokens: TOKEN_BUDGET_RETRY });
      parsed = readReply(r);
      reply = parsed.text;
    }

    const usage = r.ok ? r.data.usage : null;
    console.log(JSON.stringify({
      evt: 'chat', intent, attempts, finish: parsed.finish, ms: Date.now() - started,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens
    }));

    if (!r.ok) console.error('[chat] Groq error', r.status, r.errText);
    return ok(reply || ERROR_RESPONSE);
  } catch (err) {
    console.error('[chat] request failed:', err?.name, err?.message);
    return ok(ERROR_RESPONSE);
  }
}