import { ANSWER_LANGUAGE, DEFAULT_LOCALE, hasLocale, type Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { runSkill } from '@/server/llm';
import { allow, sameOrigin } from '@/server/rate';
import { instructions, parseGithub, readRepo } from '@/server/github-skill';

/**
 * Runs a skill the visitor added from GitHub. The instructions are read again from
 * GitHub on the server (cached), never taken from the browser.
 */
export async function POST(request: Request) {
  let url = '', lang: Locale = DEFAULT_LOCALE, values: Record<string, string> = {}, labels: Record<string, string> = {};
  try {
    const body = await request.json();
    url = String(body?.url || '').slice(0, 500);
    if (typeof body?.lang === 'string' && hasLocale(body.lang)) lang = body.lang;
    const clean = (o: unknown, max: number) =>
      Object.fromEntries(Object.entries((o as Record<string, unknown>) || {}).slice(0, 8).map(([k, v]) => [k.slice(0, 40), String(v ?? '').slice(0, max)]));
    values = clean(body?.values, 8000);
    labels = clean(body?.labels, 80);
  } catch {
    return Response.json({ error: UI.az.apiBad }, { status: 400 });
  }
  const t = UI[lang];
  if (!sameOrigin(request)) return Response.json({ error: t.apiForbidden }, { status: 403 });
  const src = parseGithub(url);
  if (!src) return Response.json({ error: t.importErrors.bad_url }, { status: 400 });
  if (!Object.values(values).some((v) => v.trim())) return Response.json({ error: t.apiEmpty }, { status: 400 });
  if (!allow(request)) return Response.json({ error: t.apiLimit }, { status: 429 });

  const files = await readRepo(src);
  if (files === 'not_found' || files === 'too_big') return Response.json({ error: t.importErrors[files] }, { status: 404 });

  const userRequest =
    Object.entries(values).filter(([, v]) => v.trim()).map(([k, v]) => `${labels[k] || k}:\n${v}`).join('\n\n') +
    `\n\nWrite the whole answer in ${ANSWER_LANGUAGE[lang]}, in plain words a first-time reader understands.`;
  try {
    return Response.json(await runSkill(instructions(files), userRequest, lang));
  } catch (e) {
    console.error('run-custom failed', src.url, e);
    return Response.json({ error: t.genericError }, { status: 502 });
  }
}
