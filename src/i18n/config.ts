// Add a language: add its code here, then a file in src/i18n/locales/<code>.ts
// (copy en strings from ui.ts and skill texts from skills.ts) and import it in locales/index.ts.
export const LOCALES = ['az', 'en', 'ru', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'uk', 'kk', 'uz', 'ka'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'az';

export const LOCALE_LABEL: Record<Locale, string> = {
  az: 'AZ', en: 'EN', ru: 'RU', tr: 'TR', de: 'DE', fr: 'FR', es: 'ES', it: 'IT', pt: 'PT', pl: 'PL', uk: 'UK', kk: 'KK', uz: 'UZ', ka: 'KA',
};
/** Each language's own name for itself, shown in the language list */
export const LOCALE_NAME: Record<Locale, string> = {
  az: 'Azərbaycanca', en: 'English', ru: 'Русский', tr: 'Türkçe', de: 'Deutsch', fr: 'Français', es: 'Español',
  it: 'Italiano', pt: 'Português', pl: 'Polski', uk: 'Українська', kk: 'Қазақша', uz: 'Oʻzbekcha', ka: 'ქართული',
};
/** Language name the answer engine is asked to use */
export const ANSWER_LANGUAGE: Record<Locale, string> = {
  az: 'Azerbaijani', en: 'English', ru: 'Russian', tr: 'Turkish', de: 'German', fr: 'French', es: 'Spanish',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', uk: 'Ukrainian', kk: 'Kazakh', uz: 'Uzbek (Latin script)', ka: 'Georgian',
};

/** Visitor's country (ISO code from the host, e.g. Cloudflare's cf-ipcountry) → site language */
export const COUNTRY_LOCALE: Record<string, Locale> = {
  AZ: 'az', TR: 'tr', CY: 'tr', RU: 'ru', BY: 'ru', KG: 'ru', MD: 'ru', AM: 'ru', TJ: 'ru', TM: 'ru',
  UA: 'uk', KZ: 'kk', UZ: 'uz', GE: 'ka',
  DE: 'de', AT: 'de', CH: 'de', LI: 'de', FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', UY: 'es', BO: 'es', PY: 'es',
  IT: 'it', SM: 'it', PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', PL: 'pl',
};

export const hasLocale = (s: string): s is Locale => (LOCALES as readonly string[]).includes(s);
