// Translation check: run with  npm run check-i18n  (Node 23.6+, no extra package)
// Lists, per language, UI keys that are missing or still identical to English,
// skill texts that are missing, and option lists whose length doesn't match.
import { UI } from '../src/i18n/ui';
import { EXTRA } from '../src/i18n/locales';
import { LOCALES } from '../src/i18n/config';
import { SKILLS } from '../src/skills/registry';
import { MARKET } from '../src/i18n/market';

const en = UI.en as Record<string, unknown>;
// Words that are the same in many languages and need no translation
const SAME_OK = new Set(['ownTabCode', 'ownWindows', 'ownMac', 'pro', 'vSpeed']);
// Values that really are the same word in several languages
const SAME_VALUE_OK = new Set(['Marketing', 'Licence', 'Source', 'Menu']);
let problems = 0;

function flat(o: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof o === 'function') out[prefix] = String((o as (...a: unknown[]) => unknown)(7, 3));
  else if (Array.isArray(o)) o.forEach((v, i) => Object.assign(out, flat(v, `${prefix}[${i}]`)));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) Object.assign(out, flat(v, prefix ? `${prefix}.${k}` : k));
  else out[prefix] = String(o);
  return out;
}

const enFlat = flat(en);
for (const l of LOCALES) {
  if (l === 'en') continue;
  const own = l === 'az' || l === 'ru' || l === 'tr' ? (UI[l] as Record<string, unknown>) : (EXTRA[l]?.ui as Record<string, unknown>) || {};
  const f = flat(own);
  const missing = Object.keys(enFlat).filter((k) => !(k in f));
  const same = Object.keys(enFlat).filter((k) => k in f && f[k] === enFlat[k] && enFlat[k].length > 3 && !SAME_VALUE_OK.has(f[k]) && !SAME_OK.has(k.split(/[.[]/)[0]));
  if (missing.length || same.length) {
    problems += missing.length + same.length;
    console.log(`\n[${l}] UI`);
    if (missing.length) console.log('  missing:', missing.join(', '));
    if (same.length) console.log('  same as English:', same.join(', '));
  }
  if (l === 'az') continue;
  const texts = l === 'ru' || l === 'tr' ? null : EXTRA[l]?.skills;
  for (const s of SKILLS) {
    if (texts && !texts[s.slug]) { problems++; console.log(`  [${l}] skill text missing: ${s.slug}`); continue; }
    const st = texts?.[s.slug];
    for (const fld of s.fields || []) {
      const ft = st?.fields?.[fld.name];
      if (st && fld.options && fld.name !== 'platform' && ft?.optionLabels?.length !== fld.options.length) {
        problems++;
        console.log(`  [${l}] ${s.slug}.${fld.name}: optionLabels ${ft?.optionLabels?.length ?? 0}/${fld.options.length}`);
      }
      if (st && !ft?.label) { problems++; console.log(`  [${l}] ${s.slug}.${fld.name}: label missing`); }
    }
  }
  const presets = EXTRA[l]?.presets;
  if (presets && Object.keys(presets).length < 10) { problems++; console.log(`  [${l}] presets: ${Object.keys(presets).length}/10`); }
}
// Marketplace texts (src/i18n/market): every key present, nothing left in English.
const SAME_MARKET_OK = new Set(['google']);
const mEn = flat(MARKET.en);
for (const l of LOCALES) {
  if (l === 'en') continue;
  const f = flat(MARKET[l]);
  const missing = Object.keys(mEn).filter((k) => !(k in f));
  const same = Object.keys(mEn).filter((k) => k in f && f[k] === mEn[k] && mEn[k].length > 3 && !SAME_MARKET_OK.has(k));
  if (missing.length || same.length) {
    problems += missing.length + same.length;
    console.log(`\n[${l}] marketplace`);
    if (missing.length) console.log('  missing:', missing.join(', '));
    if (same.length) console.log('  same as English:', same.join(', '));
  }
}
console.log(problems ? `\n${problems} problems` : 'All languages complete.');
process.exit(problems ? 1 : 0);
