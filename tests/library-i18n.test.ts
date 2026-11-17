import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIBRARY_I18N } from '../src/skills/library-i18n.ts';
import { BUILTIN_PICKS } from '../src/lib/related.ts';

const LOCALES = ['az', 'ru', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'uk', 'kk', 'uz', 'ka'];
const curated: { id: string }[] = JSON.parse(readFileSync(new URL('../src/skills/curated.json', import.meta.url), 'utf8')).skills;

test('every skill suggested next to a built-in tool has its description in all site languages', () => {
  for (const [tool, ends] of Object.entries(BUILTIN_PICKS)) {
    for (const end of ends) {
      const skill = curated.find((s) => s.id === end || s.id.endsWith(`--${end}`) || s.id.endsWith(end));
      assert.ok(skill, `${tool}: ${end} is not in curated.json`);
      for (const l of LOCALES) assert.ok(LIBRARY_I18N[skill.id]?.[l]?.trim(), `${skill.id} has no ${l} text`);
    }
  }
});

test('translations only exist for real Library skills', () => {
  for (const id of Object.keys(LIBRARY_I18N)) assert.ok(curated.some((s) => s.id === id), `${id} is not in curated.json`);
});
