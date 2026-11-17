import { NextResponse, type NextRequest } from 'next/server';
import { COUNTRY_LOCALE, DEFAULT_LOCALE, LOCALES, hasLocale, type Locale } from '@/i18n/config';

/** Saved choice first, then the visitor's country, then the browser's languages, then Azerbaijani. */
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get('lang')?.value;
  if (saved && hasLocale(saved)) return saved;
  // Cloudflare sends the country as cf-ipcountry (Vercel: x-vercel-ip-country).
  const country = (request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  if (COUNTRY_LOCALE[country]) return COUNTRY_LOCALE[country];
  const header = request.headers.get('accept-language') || '';
  const wanted = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { code: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .filter((x) => x.code && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  for (const { code } of wanted) if (hasLocale(code)) return code;
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  request.nextUrl.pathname = `/${pickLocale(request)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Pages only: skip the API, Next internals, the voice scripts and any file with an extension.
  matcher: ['/((?!api/|_next/|voice/|.*\\..*).*)'],
};
