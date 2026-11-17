import { getSkill, promptKeyFor } from '@/skills/registry';
import { SKILL_PROMPTS } from '@/server/prompts.generated';
import { runSkill } from '@/server/llm';
import { allow, sameOrigin } from '@/server/rate';
import { UI } from '@/i18n/ui';
import { errorText } from '@/i18n/market';
import { builtinGate } from '@/server/market/service';
import { ANSWER_LANGUAGE, DEFAULT_LOCALE, hasLocale, type Locale } from '@/i18n/config';


export async function POST(request: Request, ctx: RouteContext<'/api/run/[slug]'>) {
  const { slug } = await ctx.params;
  let values: Record<string, string>;
  let lang: Locale = DEFAULT_LOCALE;
  try {
    const body = await request.json();
    if (typeof body?.lang === 'string' && hasLocale(body.lang)) lang = body.lang;
    values = Object.fromEntries(
      Object.entries(body?.values || {}).map(([k, v]) => [k, String(v ?? '').slice(0, 8000)]),
    );
  } catch {
    return Response.json({ error: UI.az.apiBad }, { status: 400 });
  }
  const t = UI[lang];

  const skill = getSkill(slug);
  const key = promptKeyFor(slug);
  if (!skill || skill.kind !== 'assistant' || !key || !SKILL_PROMPTS[key]) {
    return Response.json({ error: t.apiNotFound }, { status: 404 });
  }
  if (!sameOrigin(request)) {
    return Response.json({ error: t.apiForbidden }, { status: 403 });
  }

  // Built-in skills are free unless the admin put a price on one (marketplace). Checked before the AI call.
  const gate = await builtinGate(slug);
  if (gate) return Response.json({ error: errorText(lang, gate.reason), code: gate.reason }, { status: gate.status });

  if (!allow(request)) {
    return Response.json({ error: t.apiLimit }, { status: 429 });
  }

  for (const f of skill.fields || []) {
    if (f.required && !values[f.name]?.trim()) {
      return Response.json({ error: t.apiEmpty }, { status: 400 });
    }
  }

  const userRequest =
    (skill.buildRequest ? skill.buildRequest(values) : JSON.stringify(values)) +
    `

Write the whole answer in ${ANSWER_LANGUAGE[lang]}, in plain words a first-time reader understands. Keep official names, links and quoted text as they are. If I asked above for a letter or post in a specific language, write that letter or post in that language.`;
  try {
    const out = await runSkill(SKILL_PROMPTS[key], userRequest, lang, Object.values(values).find((v) => v.trim()));
    return Response.json(out);
  } catch (e) {
    console.error('run failed', slug, e);
    return Response.json({ error: t.genericError }, { status: 502 });
  }
}
