import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { allow, sameOrigin } from '@/server/rate';
import { buildCard, parseGithub, readRepo } from '@/server/github-skill';

/** Reads a public GitHub skill and returns a card for the visitor to save in their browser. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'failed' }, { status: 403 });
  let url = '', name = '', lang: Locale = DEFAULT_LOCALE;
  try {
    const body = await request.json();
    url = String(body?.url || '').slice(0, 500);
    name = String(body?.name || '').trim().slice(0, 60);
    if (typeof body?.lang === 'string' && hasLocale(body.lang)) lang = body.lang;
  } catch {
    return Response.json({ error: 'failed' }, { status: 400 });
  }
  const src = parseGithub(url);
  if (!src) return Response.json({ error: 'bad_url' }, { status: 400 });
  if (!allow(request, 'import')) return Response.json({ error: 'failed', message: UI[lang].apiLimit }, { status: 429 });

  const files = await readRepo(src);
  if (files === 'not_found' || files === 'too_big') return Response.json({ error: files }, { status: 404 });

  const t = UI[lang];
  const card = await buildCard(src, files, lang, { request: t.yourRequest, requestPh: t.yourRequestPh });
  if (name) card.name = name;
  const repoUrl = `https://github.com/${src.owner}/${src.repo}/tree/${files.ref}${src.dir ? `/${src.dir}` : ''}`;
  return Response.json({ url: repoUrl, card });
}
