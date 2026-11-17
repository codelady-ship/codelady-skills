import 'server-only';
import { CURRENCIES } from '@/lib/market/price';

// Daily USD exchange rates from a free source that needs no key:
//   open.er-api.com (ExchangeRate-API's open endpoint, updated once a day, includes AZN).
// If AZN is ever missing there, the Central Bank of Azerbaijan's daily XML fills it in
// (cbar.az/currencies/DD.MM.YYYY.xml gives AZN per 1 USD).
// Cached in memory for 12 hours per server instance; on failure the last good table is kept,
// and with nothing at all prices simply show in USD.

type Table = { rates: Record<string, number>; updated: string; source: string };
const g = globalThis as unknown as { __marketRates?: { table: Table; until: number } };
const TTL = 12 * 3600e3;

async function erApi(): Promise<Table | null> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store', signal: AbortSignal.timeout(6000) }).catch(() => null);
  if (!res?.ok) return null;
  const d = await res.json().catch(() => null) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string } | null;
  if (d?.result !== 'success' || !d.rates) return null;
  const rates = Object.fromEntries(CURRENCIES.filter((c) => d.rates![c] > 0).map((c) => [c, d.rates![c]]));
  return { rates: { ...rates, USD: 1 }, updated: d.time_last_update_utc || new Date().toUTCString(), source: 'open.er-api.com' };
}

async function cbarAzn(): Promise<number | null> {
  const d = new Date();
  const day = `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
  const res = await fetch(`https://cbar.az/currencies/${day}.xml`, { cache: 'no-store', signal: AbortSignal.timeout(6000) }).catch(() => null);
  if (!res?.ok) return null;
  const xml = await res.text();
  const m = xml.match(/<Valute Code="USD">[\s\S]*?<Value>([\d.]+)<\/Value>/);
  const v = m ? Number(m[1]) : NaN;
  return v > 0 ? v : null;
}

export async function getRates(): Promise<Table> {
  const hit = g.__marketRates;
  if (hit && hit.until > Date.now()) return hit.table;
  let table = await erApi();
  if (table && !table.rates.AZN) {
    const azn = await cbarAzn();
    if (azn) table = { ...table, rates: { ...table.rates, AZN: azn }, source: `${table.source} + cbar.az` };
  }
  if (table) {
    g.__marketRates = { table, until: Date.now() + TTL };
    return table;
  }
  // Keep serving the last good table for a while; try again in 10 minutes.
  const fallback = hit?.table || { rates: { USD: 1 }, updated: '', source: 'none' };
  g.__marketRates = { table: fallback, until: Date.now() + 10 * 60e3 };
  return fallback;
}
