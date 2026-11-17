import { ANSWER_LANGUAGE, DEFAULT_LOCALE, hasLocale, type Locale } from '@/i18n/config';
import { errorText } from '@/i18n/market';
import { UI } from '@/i18n/ui';
import { runSkill } from '@/server/llm';
import { allow, sameOrigin } from '@/server/rate';
import { getUser } from '@/server/market/session';
import { getStore } from '@/server/market/store';
import { accessFor } from '@/server/market/service';

/**
 * Runs a marketplace skill. The access check happens HERE, on the server, before the AI is
 * called: free + approved → anyone; paid → creator, buyer, live subscriber, live trial,
 * admin grant or admin. Instructions are read from the database and never sent to the browser.
 */
export async function POST(request: Request, ctx: RouteContext<'/api/market/run/[id]'>) {
  const { id } = await ctx.params;
  let lang: Locale = DEFAULT_LOCALE;
  let input = '';
  try {
    const body = await request.json();
    if (typeof body?.lang === 'string' && hasLocale(body.lang)) lang = body.lang;
    input = String(body?.values?.request ?? '').slice(0, 8000);
  } catch {
    return Response.json({ error: UI.az.apiBad }, { status: 400 });
  }
  const t = UI[lang];
  const err = (code: string, status: number) => Response.json({ error: errorText(lang, code), code }, { status });
  if (!sameOrigin(request)) return err('forbidden', 403);
  const store = getStore();
  if (!store) return err('not_configured', 503);

  const skill = await store.getSkill(id).catch(() => null);
  if (!skill) return err('not_found', 404);
  const user = await getUser();
  const access = await accessFor(store, user, skill);
  if (!access.allowed) {
    return err(access.reason, access.reason === 'login' ? 401 : access.reason === 'payment' ? 402 : 404);
  }
  if (!input.trim()) return Response.json({ error: t.apiEmpty }, { status: 400 });
  if (!allow(request)) return Response.json({ error: t.apiLimit }, { status: 429 });

  const instructions = await store.getInstructions(skill.id);
  if (!instructions) return err('not_found', 404);
  const userRequest = `${skill.input_label || 'Request'}:\n${input}\n\nWrite the whole answer in ${ANSWER_LANGUAGE[lang]}, in plain words a first-time reader understands.`;
  try {
    return Response.json(await runSkill(instructions, userRequest, lang, input));
  } catch (e) {
    console.error('market run failed', skill.id, e);
    return Response.json({ error: t.genericError }, { status: 502 });
  }
}
