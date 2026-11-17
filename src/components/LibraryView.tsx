'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { useLibrary } from '@/lib/use-library';
import { CATEGORIES, prettySkillName, treeUrl, type LibrarySkill } from '@/lib/library-types';
import { AssistantTool } from '@/components/tools/AssistantTool';
import { OwnClaudePanel } from '@/components/OwnClaudePanel';
import { fold, score } from '@/components/SearchBox';
import { useTranslated } from '@/lib/use-translated';
import { RelatedSkills } from '@/components/RelatedSkills';

const subscribeHash = (l: () => void) => {
  window.addEventListener('hashchange', l);
  return () => window.removeEventListener('hashchange', l);
};
const readHash = () => decodeURIComponent(location.hash.slice(1));

const markOf = (s: LibrarySkill) => s.name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2) || 'Sk';
const toneOf = (s: LibrarySkill) => (s.curated ? '#1f6f6c' : '#5b6474');
const pretty = prettySkillName;

/**
 * /[lang]/library: open skills from GitHub.
 *   #q=words  → the list, filtered
 *   #cat=Name → the list, one category
 *   #<id>     → one skill: card, form, answer, and "add it to your own Claude"
 */
export function LibraryView({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const hash = useSyncExternalStore(subscribeHash, readHash, () => '');
  const list = useLibrary();
  const q = hash.startsWith('q=') ? hash.slice(2) : '';
  const cat = hash.startsWith('cat=') ? hash.slice(4) : '';
  const id = hash && !hash.includes('=') ? hash : '';

  const categories = useMemo(() => CATEGORIES.filter((c) => (list || []).some((s) => s.category === c)), [list]);
  const shown = useMemo(() => {
    let out = list || [];
    if (cat) out = out.filter((s) => s.category === cat);
    const words = fold(q).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2);
    if (words.length) {
      out = out
        .map((s) => ({ s, n: score(fold(`${s.name} ${s.name.replace(/-/g, ' ')} ${s.description} ${s.category} ${t.categories[s.category] || ''}`), words) }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .map((x) => x.s);
    }
    return out;
  }, [list, q, cat, t]);
  const tr = useTranslated(lang, id ? [id] : shown.slice(0, 40).map((s) => s.id));

  if (id) {
    const skill = list?.find((s) => s.id === id);
    if (!list) return <p className="text-ink-2">{t.vLoading}</p>;
    if (!skill) return <p className="rounded-lg bg-paper-2 p-5">{t.customNotFound}</p>;
    return <LibrarySkillView lang={lang} skill={skill} translated={tr(skill.id)} />;
  }

  const setHash = (h: string) => { location.hash = h; };

  return (
    <div>
      <h1 className="font-serif text-[2rem] font-semibold leading-tight">{t.library}</h1>
      <p className="mt-2 max-w-[640px] text-[1.05rem] leading-relaxed text-ink-2">{t.libraryLead}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="lib-filter">{t.libraryFilter}</label>
        <input id="lib-filter" type="search" defaultValue={q} key={q} placeholder={t.libraryFilter}
          onChange={(e) => setHash(e.target.value ? `q=${encodeURIComponent(e.target.value)}` : '')}
          className="min-h-11 w-full max-w-sm rounded-lg border-2 border-line bg-card px-3 focus:border-teal focus:outline-none" />
        {list && <span className="text-sm text-ink-2">{t.libraryCount(shown.length)}</span>}
      </div>

      {categories.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
          {['', ...categories].map((c) => (
            <button key={c || 'all'} type="button" onClick={() => setHash(c ? `cat=${encodeURIComponent(c)}` : '')}
              aria-pressed={cat === c}
              className={`min-h-11 shrink-0 rounded-full border px-3 text-sm ${cat === c ? 'border-ink bg-ink text-paper' : 'border-line bg-card hover:bg-paper-2'}`}>
              {c ? t.categories[c] || c : t.allCategories}
            </button>
          ))}
        </div>
      )}

      {!list ? (
        <p className="mt-8 text-ink-2">{t.vLoading}</p>
      ) : shown.length === 0 ? (
        <p className="mt-8 text-ink-2">{t.searchNone}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {shown.slice(0, 300).map((s) => (
            <li key={s.id}>
              <Link href={`/${lang}/library#${s.id}`}
                className="flex h-full flex-col rounded-xl border-2 border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-ink">
                <span className="flex items-center gap-2.5">
                  <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] font-mono text-[0.75rem] text-white" style={{ background: toneOf(s) }}>{markOf(s)}</span>
                  <span className="min-w-0 font-semibold leading-snug">{pretty(s.name)}</span>
                </span>
                <span className="mt-2 line-clamp-3 text-[0.92rem] leading-snug text-ink-2" lang={tr(s.id) ? lang : 'en'}>{tr(s.id) || s.description}</span>
                <span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-[0.75rem] text-ink-2">
                  <span>{t.categories[s.category] || s.category}</span>
                  {s.curated && <span className="font-medium text-teal">★ {t.topPick}</span>}
                  {s.stars ? <span>☆ {s.stars.toLocaleString(lang)}</span> : null}
                  <span>{s.license || '—'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LibrarySkillView({ lang, skill, translated }: { lang: Locale; skill: LibrarySkill; translated?: string }) {
  const t = UI[lang];
  const url = treeUrl(skill);
  return (
    <div className="max-w-[760px]">
      <Link href={`/${lang}/library`} className="inline-flex min-h-11 items-center text-sm text-ink-2 underline underline-offset-4 hover:text-ink">← {t.library}</Link>
      <div className="mb-8 mt-4 flex items-start gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] font-mono text-[0.85rem] text-white" style={{ background: toneOf(skill) }}>{markOf(skill)}</span>
        <div className="min-w-0">
          <h1 className="font-serif text-[1.9rem] font-semibold leading-tight">{pretty(skill.name)}</h1>
          <p className="mt-1.5 text-[1.02rem] leading-relaxed text-ink-2" lang={translated ? lang : 'en'}>{translated || skill.description}</p>
          {translated && <p className="mt-1 text-xs text-ink-2" title={skill.description}>{t.translatedNote}</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-ink-2">
            <span>{t.categories[skill.category] || skill.category}</span>
            {skill.curated && <span className="font-medium text-teal">★ {t.topPick}</span>}
            {skill.stars ? <span>☆ {skill.stars.toLocaleString(lang)}</span> : null}
            <span>{t.licenseLabel}: {skill.license || '—'}</span>
          </p>
        </div>
      </div>

      {skill.disclaimer && <p className="mb-6 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3">{t.financeNote}</p>}

      {skill.runnable ? (
        <>
          <AssistantTool
            key={skill.id}
            lang={lang}
            endpoint="/api/run-custom"
            href={`/${lang}/library#${skill.id}`}
            extraBody={{ url, labels: { request: t.yourRequest } }}
            skill={{
              slug: `lib-${skill.id}`, name: pretty(skill.name), tagline: skill.description, ask: skill.name, about: skill.description,
              gives: [], group: 'İş', kind: 'assistant', access: 'free', tone: toneOf(skill), mark: markOf(skill),
              fields: [{ name: 'request', label: t.yourRequest, type: 'textarea', rows: 6, required: true, placeholder: t.yourRequestPh }],
              submitLabel: t.runBtn,
            }}
          />
          <OwnClaudePanel lang={lang} source={{ repo: skill.repo, ref: skill.ref, dir: skill.dir || undefined, folder: skill.dir ? skill.dir.split('/').pop()! : skill.repo.split('/')[1] }} />
        </>
      ) : (
        <div className="rounded-lg bg-paper-2 p-5">
          <p>{t.notRunnable}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block break-all text-teal underline underline-offset-4">{url.replace('https://', '')}</a>
        </div>
      )}

      <RelatedSkills lang={lang} category={skill.category} text={`${skill.name.replace(/-/g, ' ')} ${skill.description}`} skipId={skill.id} />
    </div>
  );
}
