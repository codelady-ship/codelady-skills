// Marketplace texts in all 14 languages (one file per language, English defines the keys).
import type { Locale } from '../config';
import { en, type MarketDict } from './en';
import { az } from './az';
import { ru } from './ru';
import { tr } from './tr';
import { de } from './de';
import { fr } from './fr';
import { es } from './es';
import { it } from './it';
import { pt } from './pt';
import { pl } from './pl';
import { uk } from './uk';
import { kk } from './kk';
import { uz } from './uz';
import { ka } from './ka';

export const MARKET: Record<Locale, MarketDict> = { az, en, ru, tr, de, fr, es, it, pt, pl, uk, kk, uz, ka };
export type { MarketDict };

/** Error code from the API → words; unknown codes fall back to the generic message. */
export const errorText = (lang: Locale, code: string | undefined) => {
  const e = MARKET[lang].errors;
  return (code && e[code]) || e.failed;
};
