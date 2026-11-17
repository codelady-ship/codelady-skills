import { ANSWER_LANGUAGE, hasLocale } from '@/i18n/config';
import { LIBRARY } from '@/server/library';
import { LIBRARY_I18N } from '@/skills/library-i18n';
import { anyProvider, runJson } from '@/server/llm';
import { allow, sameOrigin } from '@/server/rate';

// Library descriptions in the page language. Only texts that are in the Library are
// translated (looked up by id), so this can't be used as a free general translator.
// Results are kept in memory; without any AI key the answer is {} and the page stays English.
const cache = new Map<string, string>();
const BY_ID = new Map(LIBRARY.map((s) => [s.id, s.description]));
const MAX = 40;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({}, { status: 403 });
  let lang = '', ids: string[] = [];
  try {
    const body = await request.json();
    lang = String(body?.lang || '');
    ids = Array.isArray(body?.ids) ? body.ids.map(String).filter((id: string) => BY_ID.get(id)).slice(0, MAX) : [];
  } catch {
    return Response.json({}, { status: 400 });
  }
  if (!hasLocale(lang) || lang === 'en' || !ids.length) return Response.json({});

  const out: Record<string, string> = {};
  const todo: string[] = [];
  for (const id of ids) {
    const hit = LIBRARY_I18N[id]?.[lang] || cache.get(`${lang}:${id}`);
    if (hit) out[id] = hit; else todo.push(id);
  }
  if (todo.length && (await anyProvider()) && allow(request, 'translate')) {
    const src = Object.fromEntries(todo.map((id) => [id, BY_ID.get(id)!.slice(0, 400)]));
    const got = await runJson<Record<string, string>>(
      `Translate the values of this JSON object from English into ${ANSWER_LANGUAGE[lang]}. ` +
        'Keep the keys. Keep product names, code words and links unchanged. Plain, natural words. ' +
        'Reply with one JSON object only, no comments.',
      JSON.stringify(src),
    ).catch(() => null);
    for (const id of todo) {
      const v = got?.[id];
      if (typeof v === 'string' && v.trim()) {
        const text = v.trim().slice(0, 600);
        cache.set(`${lang}:${id}`, text);
        out[id] = text;
      }
    }
  }
  return Response.json(out);
}
