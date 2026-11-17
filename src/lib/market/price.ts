// Prices: creators set USD, visitors see an approximate amount in their own currency.
// Pure functions (no imports), shared by server and browser and covered by tests/market-price.test.ts.

/** Platform share of every sale, in percent. Overridable with MARKET_FEE_PERCENT on the server. */
export const DEFAULT_FEE_PERCENT = 20;
export const MIN_PRICE_CENTS = 100; // $1
export const MAX_PRICE_CENTS = 50_000; // $500

/** Currencies offered in the picker (all present in open.er-api.com's USD table). */
export const CURRENCIES = [
  'USD', 'AZN', 'EUR', 'TRY', 'RUB', 'GBP', 'UAH', 'KZT', 'UZS', 'GEL', 'PLN', 'BRL', 'CHF', 'CAD', 'AUD',
  'AED', 'SAR', 'INR', 'JPY', 'CNY', 'KRW', 'MXN', 'ARS', 'COP', 'CLP', 'PEN', 'SEK', 'NOK', 'DKK', 'CZK',
  'HUF', 'RON', 'BGN', 'BYN', 'KGS', 'TJS', 'TMT', 'AMD', 'MDL', 'ILS', 'EGP', 'NGN', 'ZAR', 'IDR', 'MYR',
  'SGD', 'THB', 'VND', 'PHP', 'PKR', 'BDT', 'NZD', 'HKD', 'TWD', 'RSD', 'ISK',
] as const;
export type Currency = (typeof CURRENCIES)[number];
export const isCurrency = (c: string): c is Currency => (CURRENCIES as readonly string[]).includes(c);

const EURO = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK'];

/** ISO country → currency. Countries not listed fall back to USD. */
export const COUNTRY_CURRENCY: Record<string, Currency> = {
  ...Object.fromEntries(EURO.map((c) => [c, 'EUR' as Currency])),
  AZ: 'AZN', TR: 'TRY', RU: 'RUB', GB: 'GBP', UA: 'UAH', KZ: 'KZT', UZ: 'UZS', GE: 'GEL', PL: 'PLN', BR: 'BRL',
  CH: 'CHF', LI: 'CHF', CA: 'CAD', AU: 'AUD', AE: 'AED', SA: 'SAR', IN: 'INR', JP: 'JPY', CN: 'CNY', KR: 'KRW',
  MX: 'MXN', AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN', SE: 'SEK', NO: 'NOK', DK: 'DKK', CZ: 'CZK', HU: 'HUF',
  RO: 'RON', BG: 'BGN', BY: 'BYN', KG: 'KGS', TJ: 'TJS', TM: 'TMT', AM: 'AMD', MD: 'MDL', IL: 'ILS', EG: 'EGP',
  NG: 'NGN', ZA: 'ZAR', ID: 'IDR', MY: 'MYR', SG: 'SGD', TH: 'THB', VN: 'VND', PH: 'PHP', PK: 'PKR', BD: 'BDT',
  NZ: 'NZD', HK: 'HKD', TW: 'TWD', RS: 'RSD', IS: 'ISK', US: 'USD',
};

/** Language without a region (e.g. plain "az") → its main country. */
const LANGUAGE_COUNTRY: Record<string, string> = {
  az: 'AZ', tr: 'TR', ru: 'RU', uk: 'UA', kk: 'KZ', uz: 'UZ', ka: 'GE', pl: 'PL', de: 'DE', fr: 'FR', es: 'ES',
  it: 'IT', pt: 'PT', ja: 'JP', ko: 'KR', zh: 'CN', sv: 'SE', nb: 'NO', no: 'NO', da: 'DK', cs: 'CZ', hu: 'HU',
  ro: 'RO', bg: 'BG', be: 'BY', ky: 'KG', tg: 'TJ', tk: 'TM', hy: 'AM', he: 'IL', id: 'ID', ms: 'MY', th: 'TH',
  vi: 'VN', hi: 'IN', bn: 'BD', ur: 'PK', sr: 'RS', is: 'IS', nl: 'NL', fi: 'FI', el: 'GR', et: 'EE', lv: 'LV', lt: 'LT',
};

/** Country from an Accept-Language header: the first tag with a region wins, else the first language's country. */
export function countryFromAcceptLanguage(header: string | null | undefined): string | null {
  const tags = String(header || '')
    .split(',')
    .map((p) => p.trim().split(';')[0].trim())
    .filter(Boolean);
  for (const tag of tags) {
    const region = tag.split('-').slice(1).find((x) => /^[A-Za-z]{2}$/.test(x));
    if (region) return region.toUpperCase();
  }
  for (const tag of tags) {
    const c = LANGUAGE_COUNTRY[tag.split('-')[0].toLowerCase()];
    if (c) return c;
  }
  return null;
}

/** Visitor's currency: Cloudflare's cf-ipcountry first, then Accept-Language, then USD. */
export function detectCurrency(country: string | null | undefined, acceptLanguage?: string | null): Currency {
  const c = String(country || '').toUpperCase();
  if (c && c !== 'XX' && c !== 'T1' && COUNTRY_CURRENCY[c]) return COUNTRY_CURRENCY[c];
  const fromLang = countryFromAcceptLanguage(acceptLanguage);
  return (fromLang && COUNTRY_CURRENCY[fromLang]) || 'USD';
}

/** USD cents → amount in `currency` (a plain number, e.g. 8.51). null when the rate is unknown. */
export function convertCents(usdCents: number, currency: string, rates: Record<string, number>): number | null {
  if (currency === 'USD') return usdCents / 100;
  const r = rates[currency];
  if (!r || !Number.isFinite(r) || r <= 0) return null;
  return (usdCents / 100) * r;
}

export function formatMoney(amount: number, currency: string, locale = 'en') {
  const big = amount >= 1000;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency, currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: big ? 0 : 2, minimumFractionDigits: big ? 0 : Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(big ? 0 : 2)} ${currency}`;
  }
}

/**
 * Price text for a visitor: exact in USD, "≈ …" in any other currency.
 * Falls back to USD when the rate is missing.
 */
export function displayPrice(usdCents: number, currency: string, rates: Record<string, number>, locale = 'en') {
  const amount = convertCents(usdCents, currency, rates);
  const usd = formatMoney(usdCents / 100, 'USD', locale);
  if (amount === null || currency === 'USD') return { text: usd, usd, approx: false, currency: 'USD' };
  return { text: `≈ ${formatMoney(amount, currency, locale)}`, usd, approx: true, currency };
}

/** Splits one sale into the platform fee and the creator's share (whole cents, fee rounded half up). */
export function splitSale(grossCents: number, feePercent = DEFAULT_FEE_PERCENT) {
  const gross = Math.max(0, Math.round(grossCents));
  const pct = Math.min(100, Math.max(0, feePercent));
  const fee = Math.round((gross * pct) / 100);
  return { gross, fee, net: gross - fee };
}

/** "4.99" / "4,99" / "$5" → 499 cents; null when not a valid price within the limits. */
export function parseUsd(input: string | number): number | null {
  const s = String(input).trim().replace(/^\$/, '').replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents >= MIN_PRICE_CENTS && cents <= MAX_PRICE_CENTS ? cents : null;
}
