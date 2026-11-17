'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LOCALES, type Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { localizeSkill } from '@/i18n/skills';
import { SKILLS } from '@/skills/registry';
import { useMySkills } from '@/lib/my-skills';
import { useLibrary } from '@/lib/use-library';
import { prettySkillName } from '@/lib/library-types';

type Hit = { key: string; href: string; name: string; note: string; tone: string; mark: string; badge: string; text: string; boost: number };

/** Lowercase, no accents, Azerbaijani/Turkish letters folded: "Şəhər" → "seher". */
export function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const tokens = (q: string) => fold(q).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2);

/** Each word found counts; a word found at the start of a word counts double. */
export function score(text: string, words: string[]) {
  let s = 0;
  for (const w of words) {
    const i = text.indexOf(w);
    if (i < 0) continue;
    s += i === 0 || /[^\p{L}\p{N}]/u.test(text[i - 1]) ? 2 : 1;
  }
  return s;
}

/** Search box over our tools (in every language), the visitor's own skills and the Library. */
export function SearchBox({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const router = useRouter();
  const mine = useMySkills();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [wantLibrary, setWantLibrary] = useState(false);
  const library = useLibrary(wantLibrary);
  const [ai, setAi] = useState<{ q: string; words: string[] }>({ q: '', words: [] });
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Our own tools, indexed with their texts in all languages, so any language finds them.
  const builtIn = useMemo<Hit[]>(
    () =>
      SKILLS.map((s) => {
        const here = localizeSkill(s, lang);
        const text = fold(LOCALES.map((l) => {
          const x = localizeSkill(s, l);
          return [x.name, x.ask, x.tagline, x.about, x.gives.join(' ')].join(' ');
        }).join(' '));
        return { key: s.slug, href: `/${lang}/skills/${s.slug}`, name: here.name, note: here.tagline, tone: s.tone, mark: s.mark, badge: t.groups[s.group] || s.group, text, boost: 3 };
      }),
    [lang, t.groups],
  );

  const words = tokens(q);
  const smartWords = ai.q === q ? ai.words.flatMap(tokens) : [];

  // After a short pause, ask the server for English keywords so a search in any language reaches English descriptions.
  useEffect(() => {
    if (q.trim().length < 3) return;
    const timer = setTimeout(async () => {
      const res = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }) }).catch(() => null);
      const data = await res?.json().catch(() => null);
      setAi({ q, words: Array.isArray(data?.keywords) ? data.keywords : [] });
    }, 450);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const hits = useMemo(() => {
    if (!words.length) return [];
    const all: Hit[] = [
      ...builtIn,
      ...mine.map((s) => ({
        key: `my-${s.id}`, href: `/${lang}/my#${s.id}`, name: s.name, note: s.tagline, tone: s.tone, mark: s.mark,
        badge: t.mySkills, text: fold(`${s.name} ${s.tagline} ${s.whatFor}`), boost: 2,
      })),
      ...(library || []).map((s) => ({
        key: s.id, href: `/${lang}/library#${s.id}`, name: prettySkillName(s.name), note: s.description, tone: s.curated ? '#1f6f6c' : '#6b7280',
        mark: s.name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2) || 'Sk', badge: `${t.library} · ${t.categories[s.category] || s.category}`,
        text: fold(`${s.name} ${s.name.replace(/-/g, ' ')} ${s.description} ${s.category} ${t.categories[s.category] || ''}`), boost: s.curated ? 1 : 0,
      })),
    ];
    return all
      .map((h) => {
        const direct = score(h.text, words);
        const smart = score(h.text, smartWords);
        return { h, s: direct * 2 + smart + (direct || smart ? h.boost : 0) };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.h);
  }, [words, smartWords, builtIn, mine, library, lang, t]);

  const thinking = q.trim().length >= 3 && ai.q !== q;

  function go(href: string) {
    setOpen(false);
    setQ('');
    router.push(href);
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <label htmlFor="site-search" className="sr-only">{t.searchLabel}</label>
      <div className="flex h-11 items-center gap-2 rounded-lg border-2 border-line bg-card px-3 focus-within:border-teal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-ink-2" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="site-search"
          type="search"
          role="combobox"
          aria-expanded={open && words.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={q}
          placeholder={t.searchPh}
          onFocus={() => { setOpen(true); setWantLibrary(true); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === 'Enter' && hits[active]) { e.preventDefault(); go(hits[active].href); }
          }}
          className="min-w-0 flex-1 self-stretch bg-transparent text-[1rem] outline-none placeholder:text-ink-2/70"
        />
      </div>

      {open && words.length > 0 && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-[3.25rem] z-40 overflow-hidden rounded-xl border border-line bg-card shadow-lg shadow-ink/10">
          {hits.length ? (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {hits.map((h, i) => (
                <li key={h.key} role="option" aria-selected={i === active}>
                  <Link href={h.href} onClick={() => { setOpen(false); setQ(''); }} onMouseEnter={() => setActive(i)}
                    className={`flex gap-3 px-3 py-2.5 ${i === active ? 'bg-paper-2' : ''}`}>
                    <span aria-hidden className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[6px] font-mono text-[0.75rem] text-white" style={{ background: h.tone }}>{h.mark}</span>
                    <span className="min-w-0">
                      <span className="block font-medium leading-snug">{h.name}</span>
                      <span className="block truncate text-[0.85rem] text-ink-2">{h.note}</span>
                      <span className="block text-[0.75rem] uppercase tracking-wide text-ink-2/80">{h.badge}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-ink-2">{thinking ? t.searchSmart : t.searchNone}</p>
          )}
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-sm">
            <span className="text-ink-2">{thinking && hits.length ? t.searchSmart : ''}</span>
            <Link href={`/${lang}/library#q=${encodeURIComponent(q)}`} onClick={() => setOpen(false)} className="font-medium text-teal underline underline-offset-4">
              {t.searchAll} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
