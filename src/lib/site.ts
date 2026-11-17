import type { Metadata } from 'next';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { BASE_PATH, IS_DEMO } from './base';

/** Public origin; the GitHub Pages demo unless NEXT_PUBLIC_SITE_URL says otherwise. */
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || 'https://codelady-ship.github.io').replace(/\/+$/, '');
/** Origin plus the base path: absolute URLs must carry /codelady-skills on GitHub Pages. */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

// The static export uses trailingSlash, so /en redirects to /en/: link the final URL.
const END = IS_DEMO ? '/' : '';

/** Absolute URL of a page in one language: pageUrl('en', '/library'). */
export const pageUrl = (lang: string, path = '') => `${SITE_URL}/${lang}${path}${END}`;

/** hreflang map: every language plus x-default (Azerbaijani, the default language). */
export const languageAlternates = (path = '') => ({
  ...Object.fromEntries(LOCALES.map((l) => [l, pageUrl(l, path)])),
  'x-default': pageUrl(DEFAULT_LOCALE, path),
});

export const OG_IMAGE = { url: `${SITE_URL}/og.png`, width: 1200, height: 630, type: 'image/png', alt: 'Codelady Skills' };

const OG_LOCALE: Record<Locale, string> = {
  az: 'az_AZ', en: 'en_US', ru: 'ru_RU', tr: 'tr_TR', de: 'de_DE', fr: 'fr_FR', es: 'es_ES',
  it: 'it_IT', pt: 'pt_BR', pl: 'pl_PL', uk: 'uk_UA', kk: 'kk_KZ', uz: 'uz_UZ', ka: 'ka_GE',
};

/** Canonical, hreflang, Open Graph and Twitter card for an indexable page. */
export function seoMeta({ lang, path = '', title, description, absolute = false }: {
  lang: Locale;
  path?: string;
  title: string;
  description: string;
  /** Home page: the title already names the site, skip the template. */
  absolute?: boolean;
}): Metadata {
  const url = pageUrl(lang, path);
  const full = absolute ? title : `${title} · Codelady Skills`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: 'website',
      siteName: 'Codelady Skills',
      url,
      title: full,
      description,
      locale: OG_LOCALE[lang],
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: full, description, images: [OG_IMAGE.url] },
  };
}

/** Shortens text to at most `max` characters at a word boundary. */
export function clip(text: string, max = 160) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`;
}

/** JSON for <script type="application/ld+json">; "<" escaped so the data cannot end the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
