'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { LIBRARY_I18N } from '@/skills/library-i18n';

// Translated Library descriptions, per language, kept for the page's lifetime.
const done = new Map<string, string>();
const asked = new Set<string>();

/** Map id → description in `lang` for the given ids (missing ones stay English). */
export function useTranslated(lang: Locale, ids: string[]) {
  const [, bump] = useState(0);
  const key = ids.join('|');
  useEffect(() => {
    if (lang === 'en') return;
    const need = key.split('|').filter((id) => id && !LIBRARY_I18N[id]?.[lang] && !asked.has(`${lang}:${id}`)).slice(0, 40);
    if (!need.length) return;
    need.forEach((id) => asked.add(`${lang}:${id}`));
    let live = true;
    fetch('/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lang, ids: need }) })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((got: Record<string, string>) => {
        for (const [id, text] of Object.entries(got || {})) done.set(`${lang}:${id}`, text);
        if (live) bump((n) => n + 1);
      });
    return () => { live = false; };
  }, [lang, key]);
  // Hand-written translations first (no network, no AI key), then what /api/translate returned
  return (id: string) => (lang === 'en' ? undefined : LIBRARY_I18N[id]?.[lang] || done.get(`${lang}:${id}`));
}
