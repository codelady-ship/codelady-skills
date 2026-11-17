'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Me } from './types';
import { CURRENCIES, displayPrice, isCurrency, type Currency } from './price';

// Browser helpers for the marketplace pages: who is signed in, exchange rates, the chosen currency.

export type MarketConfigPublic = { authMode: 'google' | 'mock' | 'none'; payments: string; feePercent: number };

/** POST/GET JSON to /api/market/*; never throws. */
export async function api<T = Record<string, unknown>>(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  try {
    const res = await fetch(`/api/market/${path}`, body === undefined
      ? { cache: 'no-store' }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'failed' } as T & { error?: string } };
  }
}

// ---- signed-in user (shared by every component on the page) ----
type MeState = { loaded: boolean; user: Me; config: MarketConfigPublic | null };
let me: MeState = { loaded: false, user: null, config: null };
let meLoading: Promise<void> | null = null;
const meListeners = new Set<() => void>();
const SERVER_ME: MeState = { loaded: false, user: null, config: null };

export function reloadMe() {
  meLoading = api<{ user: Me; config: MarketConfigPublic }>('me').then(({ ok, data }) => {
    me = { loaded: true, user: ok ? data.user : null, config: ok ? data.config : null };
    meListeners.forEach((l) => l());
  });
  return meLoading;
}

export function useMe() {
  return useSyncExternalStore(
    (l) => {
      meListeners.add(l);
      if (!meLoading) reloadMe();
      return () => meListeners.delete(l);
    },
    () => me,
    () => SERVER_ME,
  );
}

export async function signOut() {
  await api('auth/signout', {});
  await reloadMe();
}

// ---- currency ----
type Rates = { suggested: Currency; rates: Record<string, number> };
let rates: Rates | null = null;
let ratesLoading: Promise<Rates | null> | null = null;
const CUR_KEY = 'currency';
const curListeners = new Set<() => void>();

function savedCurrency(): string | null {
  try { return localStorage.getItem(CUR_KEY); } catch { return null; }
}

export function setCurrency(c: Currency) {
  try { localStorage.setItem(CUR_KEY, c); } catch {}
  curListeners.forEach((l) => l());
}

/** Rates (fetched once per page load) plus the visitor's currency: saved choice, else detected from the country. */
export function useCurrency() {
  const [r, setR] = useState<Rates | null>(rates);
  useEffect(() => {
    if (rates) return;
    ratesLoading ||= fetch('/api/market/rates').then((x) => (x.ok ? x.json() : null)).catch(() => null);
    let alive = true;
    ratesLoading.then((v) => { if (v) rates = v; if (alive) setR(v); });
    return () => { alive = false; };
  }, []);
  const saved = useSyncExternalStore(
    (l) => { curListeners.add(l); return () => curListeners.delete(l); },
    savedCurrency,
    () => null,
  );
  const currency: Currency = saved && isCurrency(saved) ? saved : r?.suggested || 'USD';
  const available = CURRENCIES.filter((c) => c === 'USD' || (r?.rates[c] ?? 0) > 0);
  return {
    currency,
    available,
    format: (usdCents: number, locale: string) => displayPrice(usdCents, currency, r?.rates || {}, locale),
  };
}
