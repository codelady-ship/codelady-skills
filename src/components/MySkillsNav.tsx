'use client';

import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { useMySkills } from '@/lib/my-skills';

function Mark({ tone, mark, size }: { tone: string; mark: string; size: number }) {
  return (
    <span aria-hidden className="inline-grid shrink-0 place-items-center rounded-[6px] font-mono font-medium text-white"
      style={{ width: size, height: size, background: tone, fontSize: size * 0.38 }}>
      {mark}
    </span>
  );
}

/** The visitor's own skills plus the "add your own" link: a sidebar group or phone chips. */
export function MySkillsNav({ lang, variant }: { lang: Locale; variant: 'side' | 'chips' }) {
  const t = UI[lang];
  const mine = useMySkills();

  if (variant === 'chips') {
    return (
      <>
        {mine.map((s) => (
          <Link key={s.id} href={`/${lang}/my#${s.id}`}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-card px-3 text-sm">
            <Mark tone={s.tone} mark={s.mark} size={18} />
            {s.name}
          </Link>
        ))}
        <Link href={`/${lang}/library`} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-sm">
          ≡ {t.library}
        </Link>
        <Link href={`/${lang}/add`}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-ink-2 px-3 text-sm">
          <span aria-hidden>+</span> {t.addSkill}
        </Link>
      </>
    );
  }

  return (
    <div className="mb-5">
      <Link href={`/${lang}/library`}
        className="mb-4 flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.95rem] hover:bg-paper-2">
        <span aria-hidden className="grid h-[22px] w-[22px] place-items-center rounded-[6px] bg-teal font-mono text-[0.75rem] text-white">≡</span>
        {t.library}
      </Link>
      {mine.length > 0 && (
        <>
          <p className="mb-1.5 text-[0.8rem] text-ink-2">{t.mySkills}</p>
          <ul className="mb-1 space-y-0.5">
            {mine.map((s) => (
              <li key={s.id}>
                <Link href={`/${lang}/my#${s.id}`} className="flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.95rem] hover:bg-paper-2">
                  <Mark tone={s.tone} mark={s.mark} size={22} />
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link href={`/${lang}/add`}
        className="mt-1 flex min-h-11 items-center gap-2.5 rounded-md border border-dashed border-line px-2 py-2 text-[0.95rem] text-ink-2 hover:border-ink-2 hover:text-ink">
        <span aria-hidden className="grid h-[22px] w-[22px] place-items-center rounded-[6px] border border-current text-sm leading-none">+</span>
        {t.addSkill}
      </Link>
    </div>
  );
}
