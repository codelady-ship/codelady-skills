'use client';

import type { Locale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';
import { useCurrency, setCurrency } from '@/lib/market/client';
import type { Pricing } from '@/lib/market/types';
import { isCurrency } from '@/lib/market/price';

export const inputCls =
  'w-full min-h-12 rounded-lg border-2 border-line bg-card px-4 py-3 text-[1.05rem] text-ink placeholder:text-ink-2/60 focus:border-teal focus:outline-none';
export const btnPrimary = 'inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-ink px-5 py-2 text-center font-semibold text-paper hover:opacity-90 disabled:opacity-40 sm:w-auto';
export const btnSecondary = 'inline-flex min-h-12 w-full items-center justify-center rounded-lg border-2 border-ink px-5 py-2 text-center font-medium hover:bg-paper-2 disabled:opacity-40 sm:w-auto';
export const btnSmall = 'inline-flex min-h-11 items-center rounded-md border border-line bg-card px-3 text-sm hover:bg-paper-2 disabled:opacity-40';

export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export const fmtDate = (iso: string | null | undefined, lang: Locale) =>
  iso ? new Date(iso).toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

/** "Free" or the price in the visitor's currency, with "/ month" for subscriptions. */
export function PriceTag({ lang, pricing, cents, className = '' }: { lang: Locale; pricing: Pricing; cents: number; className?: string }) {
  const m = MARKET[lang];
  const { format } = useCurrency();
  if (pricing === 'free') return <span className={className}>{m.free}</span>;
  const p = format(cents, lang);
  return (
    <span className={className} title={p.approx ? p.usd : undefined}>
      {p.text}{pricing === 'monthly' ? ` ${m.perMonth}` : ''}
    </span>
  );
}

/** Currency switcher with the "charged in USD" note. The choice is remembered in this browser. */
export function CurrencyPicker({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const { currency, available } = useCurrency();
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
      <label htmlFor="mk-currency">{m.currency}</label>
      <select id="mk-currency" value={currency} onChange={(e) => isCurrency(e.target.value) && setCurrency(e.target.value)}
        className="min-h-11 rounded-md border border-line bg-card px-2 text-base text-ink">
        {available.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      {currency !== 'USD' && <span>≈ · {m.chargedNote}</span>}
    </div>
  );
}

export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' | 'ok' }) {
  const cls = tone === 'error' ? 'border-coral text-ink' : tone === 'ok' ? 'border-teal' : 'border-line';
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border-2 bg-paper-2 px-4 py-3 ${cls}`}>{children}</div>;
}

export function PageTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-8 max-w-[720px]">
      <h1 className="font-serif text-[1.75rem] font-semibold leading-tight sm:text-[2rem]">{title}</h1>
      {lead && <p className="mt-2 text-[1.05rem] leading-relaxed text-ink-2">{lead}</p>}
    </div>
  );
}
