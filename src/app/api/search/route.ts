import { runJson } from '@/server/llm';
import { allow, sameOrigin } from '@/server/rate';

const cache = new Map<string, string[]>();

/**
 * Turns a search typed in any language into short English keywords, so the browser
 * can match it against skill names and descriptions. Uses the free AI services;
 * returns an empty list when none is available (the browser then matches the words as typed).
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ keywords: [] }, { status: 403 });
  const q = String((await request.json().catch(() => ({})))?.q || '').trim().slice(0, 200);
  if (q.length < 2) return Response.json({ keywords: [] });
  const key = q.toLowerCase();
  if (cache.has(key)) return Response.json({ keywords: cache.get(key) });
  if (!allow(request, 'search')) return Response.json({ keywords: [] });

  const out = await runJson<{ keywords?: unknown }>(
    'You help a search box for AI skills. The user typed a need in any language. Return JSON {"keywords": [...]} with 4-8 short English search words or synonyms that a skill name or description would contain (e.g. "visa", "cover letter", "background removal", "trading journal"). Only JSON.',
    q,
  ).catch(() => null);
  const keywords = Array.isArray(out?.keywords)
    ? out.keywords.map((k) => String(k).toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 8)
    : [];
  if (cache.size > 500) cache.clear();
  cache.set(key, keywords);
  return Response.json({ keywords });
}
