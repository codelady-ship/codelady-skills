import type { LocalePack } from './types';
import { pack as de } from './de';
import { pack as fr } from './fr';
import { pack as es } from './es';
import { pack as it } from './it';
import { pack as pt } from './pt';
import { pack as pl } from './pl';
import { pack as uk } from './uk';
import { pack as kk } from './kk';
import { pack as uz } from './uz';
import { pack as ka } from './ka';

export const EXTRA: Record<string, LocalePack> = { de, fr, es, it, pt, pl, uk, kk, uz, ka };
