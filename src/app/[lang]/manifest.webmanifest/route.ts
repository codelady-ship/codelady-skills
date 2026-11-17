import { LOCALES, hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { withBase } from '@/lib/base';

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * Web app manifest for one language: the installed app opens in that language.
 * One `id` for all languages, so the app counts as installed whichever one was used.
 */
export async function GET(_req: Request, ctx: RouteContext<'/[lang]/manifest.webmanifest'>) {
  const { lang } = await ctx.params;
  if (!hasLocale(lang)) return new Response('Not found', { status: 404 });
  const manifest = {
    id: '/',
    name: 'Codelady Skills',
    short_name: 'Codelady',
    description: UI[lang].metaDescription,
    lang,
    dir: 'ltr',
    start_url: withBase(`/${lang}`),
    scope: withBase('/'),
    display: 'standalone',
    background_color: '#f5f0e6',
    theme_color: '#f5f0e6',
    categories: ['education', 'productivity'],
    icons: [
      { src: withBase('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withBase('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: withBase('/icons/maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
