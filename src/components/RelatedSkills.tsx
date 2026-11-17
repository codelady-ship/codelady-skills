'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { localizeSkill } from '@/i18n/skills';
import { SKILLS } from '@/skills/registry';
import { useLibrary } from '@/lib/use-library';
import { useTranslated } from '@/lib/use-translated';
import { BUILTIN_CATEGORY, BUILTIN_NEAR, builtinPicks, pickRelated } from '@/lib/related';
import { prettySkillName } from '@/lib/library-types';

const pretty = prettySkillName;

export function RelatedSkills({ lang, category, text, skipId, builtinSlug }: {
  lang: Locale; category: string; text: string; skipId?: string; builtinSlug?: string;
}) {
  const t = UI[lang];
  const list = useLibrary();
  const picks = useMemo(() => (!list ? [] : builtinSlug ? builtinPicks(list, builtinSlug) : pickRelated(list, category, text, skipId)), [list, category, text, skipId, builtinSlug]);
  const tr = useTranslated(lang, picks.map((s) => s.id));
  const tools = (builtinSlug ? BUILTIN_NEAR[builtinSlug] || [] : SKILLS.filter((s) => BUILTIN_CATEGORY[s.slug] === category).map((s) => s.slug))
    .map((slug) => SKILLS.find((s) => s.slug === slug))
    .filter((s) => !!s)
    .map((s) => localizeSkill(s, lang));

  if (!tools.length && !picks.length) return null;
  return (
    <section className="mt-12 max-w-[900px] border-t border-line pt-8" aria-labelledby="related-title">
      <h2 id="related-title" className="font-serif text-[1.4rem] font-semibold">{t.relatedTitle}</h2>
      <p className="mt-1 text-ink-2">{t.relatedLead}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((s) => (
          <li key={s.slug}>
            <Link href={`/${lang}/skills/${s.slug}`} className="flex h-full flex-col rounded-xl border-2 border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-ink">
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] font-mono text-[0.75rem] text-white" style={{ background: s.tone }}>{s.mark}</span>
                <span className="font-semibold leading-snug">{s.name}</span>
              </span>
              <span className="mt-2 line-clamp-2 text-[0.92rem] leading-snug text-ink-2">{s.tagline}</span>
            </Link>
          </li>
        ))}
        {picks.map((s) => (
          <li key={s.id}>
            <Link href={`/${lang}/library#${s.id}`} className="flex h-full flex-col rounded-xl border-2 border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-ink">
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] font-mono text-[0.75rem] text-white" style={{ background: s.curated ? '#1f6f6c' : '#5b6474' }}>
                  {s.name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2) || 'Sk'}
                </span>
                <span className="min-w-0 font-semibold leading-snug">{pretty(s.name)}</span>
              </span>
              <span className="mt-2 line-clamp-2 text-[0.92rem] leading-snug text-ink-2" lang={tr(s.id) ? lang : 'en'}>{tr(s.id) || s.description}</span>
              <span className="mt-auto flex flex-wrap gap-x-3 pt-2 text-[0.75rem] text-ink-2">
                <span>{t.categories[s.category] || s.category}</span>
                {s.curated && <span className="font-medium text-teal">★ {t.topPick}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
