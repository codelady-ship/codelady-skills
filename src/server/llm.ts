import 'server-only';
import { UI } from '@/i18n/ui';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

// Text answers for 'assistant' skills, from free AI services only.
// Tried in order (AI_PROVIDERS, default below); a service without its key is skipped,
// and a busy or failing one hands over to the next:
//   gemini      free tier key from Google AI Studio (GEMINI_API_KEY); can search the web
//   groq        free tier key from console.groq.com (GROQ_API_KEY)
//   openrouter  free ":free" models with a key from openrouter.ai (OPENROUTER_API_KEY)
//   workers-ai  Cloudflare Workers AI daily free allowance; needs no key once deployed
//               (binding "AI" in wrangler.jsonc)
// Default order (checked 2026-11-11 with live keys): Gemini Flash → Groq (Qwen 3.8 by Alibaba, GPT-OSS)
// → OpenRouter free (ERNIE by Baidu, dots by Xiaohongshu, openrouter/free) → Workers AI.
// Gemini Pro has no free quota (429), and Kimi, DeepSeek and GLM are no longer free there. A model that is out of its free limit (429), busy or slow hands over to the next one.
// With none of them available the site answers with a short test reply.
// Model names change often: each one can be overridden with the *_MODELS variables.

export type RunResult = { text: string; engine: string; sources: { title: string; url: string }[] };
/** `deadline`: epoch ms after which no new request starts and running ones are aborted. */
type Msg = { system: string; user: string; json?: boolean; search?: boolean; deadline: number };
type Provider = { id: string; ready: () => boolean | Promise<boolean>; run: (m: Msg) => Promise<RunResult | null> };

/** Per-request time limit, so a slow service hands over instead of keeping the visitor waiting. */
const TIMEOUT_MS = 40_000;
/** One overall limit per answer (all services, models and retries together). */
export const RUN_BUDGET_MS = 45_000;
const left = (m: Msg) => m.deadline - Date.now();
/** Abort signal for one request: its own limit, but never past the overall deadline. */
const signalFor = (m: Msg) => AbortSignal.timeout(Math.max(1, Math.min(TIMEOUT_MS, left(m))));
/** Reasoning models (Qwen, ERNIE, dots) may put their thinking in <think> tags: keep only the answer. */
const clean = (t: string) => t.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '').trim();
const list = (v: string | undefined, fallback: string) => (v || fallback).split(',').map((s) => s.trim()).filter(Boolean);

// ---- Gemini (free tier) ----
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/';
const gemini: Provider = {
  id: 'gemini',
  ready: () => !!process.env.GEMINI_API_KEY,
  async run(m) {
    const body = {
      systemInstruction: { parts: [{ text: m.system }] },
      contents: [{ role: 'user', parts: [{ text: m.user }] }],
      ...(m.search ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { temperature: m.json ? 0.3 : 0.4, maxOutputTokens: 4096, ...(m.json ? { responseMimeType: 'application/json' } : {}) },
    };
    for (const model of list(process.env.GEMINI_TEXT_MODELS, 'gemini-3.8-flash,gemini-3.5-flash,gemini-3-flash-preview,gemini-flash-lite-latest')) {
      if (left(m) <= 0) return null;
      const call = (withSearch: boolean) => fetch(`${GEMINI}${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
        body: JSON.stringify(withSearch ? body : { ...body, tools: undefined }),
        signal: signalFor(m),
      }).catch(() => null);
      let res = await call(!!m.search);
      // Web search has no free quota on many keys (429/400): answer without it rather than not at all.
      // Only after a real 400/429 answer (a timeout gives null and moves on) and while time is left.
      if (m.search && res && (res.status === 429 || res.status === 400) && left(m) > 0) res = await call(false);
      if (!res?.ok) continue;
      const data = await res.json().catch(() => null);
      const cand = data?.candidates?.[0];
      const text = clean((cand?.content?.parts || []).map((p: { text?: string }) => p.text || '').join(''));
      const sources = (cand?.groundingMetadata?.groundingChunks || [])
        .map((c: { web?: { title?: string; uri?: string } }) => ({ title: c.web?.title || '', url: c.web?.uri || '' }))
        .filter((s: { url: string }) => s.url)
        .slice(0, 8);
      if (text) return { text, engine: `gemini:${model}`, sources };
    }
    return null;
  },
};

// ---- OpenAI-compatible free services ----
function openaiCompatible(id: string, url: string, keyVar: string, modelsVar: string, models: string, extraHeaders: Record<string, string> = {}): Provider {
  return {
    id,
    ready: () => !!process.env[keyVar],
    async run(m) {
      for (const model of list(process.env[modelsVar], models)) {
        if (left(m) <= 0) return null;
        const call = (jsonMode: boolean) => fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env[keyVar]}`, ...extraHeaders },
          body: JSON.stringify({
            model,
            temperature: m.json ? 0.3 : 0.4,
            max_tokens: 4096,
            messages: [{ role: 'system', content: m.system }, { role: 'user', content: m.user }],
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          }),
          signal: signalFor(m),
        }).catch(() => null);
        let res = await call(!!m.json);
        // Some free models reject JSON mode: ask again without it (the prompt still asks for JSON).
        // Only after a real 400 answer, never after a timeout, and while time is left.
        if (m.json && res && res.status === 400 && left(m) > 0) res = await call(false);
        if (!res?.ok) continue;
        const data = await res.json().catch(() => null);
        const text = clean(String(data?.choices?.[0]?.message?.content || ''));
        if (text) return { text, engine: `${id}:${model}`, sources: [] };
      }
      return null;
    },
  };
}

const groq = openaiCompatible(
  'groq', 'https://api.groq.com/openai/v1/chat/completions', 'GROQ_API_KEY', 'GROQ_MODELS',
  'qwen/qwen3.8-27b,openai/gpt-oss-120b',
);
const openrouter = openaiCompatible(
  'openrouter', 'https://openrouter.ai/api/v1/chat/completions', 'OPENROUTER_API_KEY', 'OPENROUTER_MODELS',
  'baidu/ernie-5.5-flash-preview:free,dots-studio/dots-3-note-preview:free,openrouter/free',
  { 'X-Title': 'Codelady Skills' },
);

// ---- Cloudflare Workers AI (binding, no key) ----
type AiBinding = { run: (model: string, input: unknown) => Promise<{ response?: string }> };
async function aiBinding(): Promise<AiBinding | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as { AI?: AiBinding }).AI) || null;
  } catch {
    return null; // local `next start`: no Cloudflare runtime
  }
}
const workersAi: Provider = {
  id: 'workers-ai',
  ready: async () => !!(await aiBinding()),
  async run(m) {
    const ai = await aiBinding();
    if (!ai) return null;
    for (const model of list(process.env.WORKERS_AI_MODELS, '@cf/meta/llama-3.3-70b-instruct-fp8-fast')) {
      if (left(m) <= 0) return null;
      // The binding takes no abort signal: stop waiting at the deadline instead.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const out = await Promise.race([
        ai.run(model, {
          messages: [{ role: 'system', content: m.system }, { role: 'user', content: m.user }],
          max_tokens: 2048,
        }).catch(() => null),
        new Promise<null>((r) => { timer = setTimeout(() => r(null), Math.max(1, left(m))); }),
      ]).finally(() => clearTimeout(timer));
      const text = String(out?.response || '').trim();
      if (text) return { text, engine: `workers-ai:${model}`, sources: [] };
    }
    return null;
  },
};

const ALL: Record<string, Provider> = { gemini, groq, openrouter, 'workers-ai': workersAi };

/** The first answer from the services in AI_PROVIDERS order, or null when none answers within `budgetMs`. */
export async function firstAnswer(msg: Omit<Msg, 'deadline'>, budgetMs = RUN_BUDGET_MS): Promise<RunResult | null> {
  const m: Msg = { ...msg, deadline: Date.now() + budgetMs };
  for (const id of list(process.env.AI_PROVIDERS, 'gemini,groq,openrouter,workers-ai')) {
    if (left(m) <= 0) break;
    const p = ALL[id];
    if (!p || !(await p.ready())) continue;
    const out = await p.run(m).catch((e) => { console.error('provider failed', id, e); return null; });
    if (out) return out;
  }
  return null;
}

export async function anyProvider() {
  for (const p of Object.values(ALL)) if (await p.ready()) return true;
  return false;
}

/** `preview`: the visitor's own words, quoted back in test mode (the request itself is an internal prompt). */
export async function runSkill(system: string, request: string, lang: Locale = DEFAULT_LOCALE, preview?: string): Promise<RunResult> {
  if (!(await anyProvider())) return testReply(preview || request, lang);
  const out = await firstAnswer({ system: system + HOUSE_RULES, user: request, search: true });
  if (!out) throw new Error('no provider answered');
  return out;
}

/** One JSON object from the first free service that answers. Null when none can. */
export async function runJson<T>(system: string, request: string): Promise<T | null> {
  const out = await firstAnswer({ system, user: request, json: true });
  if (!out) return null;
  const raw = out.text.replace(/^```(?:json)?\s*|\s*```$/g, '');
  try { return JSON.parse(raw) as T; } catch { return null; }
}

const HOUSE_RULES = `

---
Site rules (these override formatting advice above):
- You are running inside a web form, not a chat with tools. Do not mention files, templates, scripts or "this skill".
- Answer in the language the user asks for (Azerbaijani by default), plain and warm, short paragraphs, phone-readable.
- Use Markdown headings and lists only where they help. No emoji.
- Never ask for passwords, ID numbers or card numbers.`;

function testReply(request: string, lang: Locale): RunResult {
  const first = request.split('\n').find(Boolean)?.slice(0, 140) || '';
  return {
    engine: 'test',
    sources: [],
    text: UI[lang].testReply(first),
  };
}
