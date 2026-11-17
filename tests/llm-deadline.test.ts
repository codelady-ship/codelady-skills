// The AI fallback chain stops at one overall deadline. fetch is stubbed: no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.AI_PROVIDERS = 'gemini,groq';
process.env.GEMINI_API_KEY = 'test';
process.env.GROQ_API_KEY = 'test';
process.env.GEMINI_TEXT_MODELS = 'g1,g2,g3';
process.env.GROQ_MODELS = 'q1,q2,q3';

const { firstAnswer } = await import('../src/server/llm.ts');

type Call = { url: string; body: Record<string, unknown> };

/** Replaces fetch for one test; `answer` returns a Response, or null to hang until aborted. */
async function withFetch(answer: (c: Call) => Response | null, run: () => Promise<void>) {
  const real = globalThis.fetch;
  const calls: Call[] = [];
  globalThis.fetch = ((url: string, init: RequestInit) => {
    const c = { url: String(url), body: JSON.parse(String(init.body)) };
    calls.push(c);
    const r = answer(c);
    if (r) return Promise.resolve(r);
    return new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(init.signal!.reason)));
  }) as typeof fetch;
  try { await run(); } finally { globalThis.fetch = real; }
  return calls;
}

test('services that hang are cut off at the overall deadline, with no retry after a timeout', async () => {
  let out: unknown = 'unset';
  const t0 = Date.now();
  const calls = await withFetch(() => null, async () => {
    out = await firstAnswer({ system: 's', user: 'u', search: true }, 300);
  });
  const took = Date.now() - t0;
  assert.equal(out, null);
  assert.ok(took < 2000, `took ${took} ms`);
  assert.equal(calls.length, 1, 'one hanging call uses the whole budget; nothing starts after the deadline');
  assert.ok(calls[0].body.tools, 'the first call asks for web search; it is not repeated without search after a timeout');
});

test('after a real 429 the same model is asked again without web search', async () => {
  let out: { engine: string } | null = null;
  const calls = await withFetch((c) => c.body.tools
    ? new Response('{}', { status: 429 })
    : new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'hello' }] } }] }), { status: 200 }), async () => {
    out = await firstAnswer({ system: 's', user: 'u', search: true }, 5000);
  });
  assert.equal(out!.engine, 'gemini:g1');
  assert.equal(calls.length, 2);
});

test('a failing service hands over to the next while time is left', async () => {
  let out: { engine: string; text: string } | null = null;
  await withFetch((c) => c.url.includes('groq')
    ? new Response(JSON.stringify({ choices: [{ message: { content: 'from groq' } }] }), { status: 200 })
    : new Response('{}', { status: 500 }), async () => {
    out = await firstAnswer({ system: 's', user: 'u' }, 5000);
  });
  assert.equal(out!.engine, 'groq:q1');
});
