import Link from 'next/link';
import { GROUPS, SKILLS } from '@/skills/registry';
import { localizeSkill } from '@/i18n/skills';
import { UI } from '@/i18n/ui';
import type { Locale } from '@/i18n/config';
import { SkillMark } from './SkillMark';
import { Brand } from './Brand';
import { SiteControls } from './SiteControls';
import { MySkillsNav } from './MySkillsNav';
import { AccountNav } from './market/AccountNav';
import { MobileMenu } from './MobileMenu';

type Props = { lang: Locale; active?: string; mode: 'home' | 'tool' | 'other' };

/** Tools by group, then the visitor's own skills and the marketplace links. */
function NavLinks({ lang, active, mode }: Props) {
  const t = UI[lang];
  const skills = SKILLS.map((s) => localizeSkill(s, lang));
  const href = (slug: string) => (mode === 'home' ? `#${slug}` : `/${lang}/skills/${slug}`);
  return (
    <>
      <p className="mb-3 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-2">{t.skillsHeading}</p>
      {GROUPS.map((g) => {
        const list = skills.filter((s) => s.group === g);
        if (!list.length) return null;
        return (
          <div key={g} className="mb-5">
            <p className="mb-1.5 text-[0.8rem] text-ink-2">{t.groups[g] || g}</p>
            <ul className="space-y-0.5">
              {list.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={href(s.slug)}
                    aria-current={active === s.slug ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.95rem] hover:bg-paper-2 ${
                      active === s.slug ? 'bg-paper-2 font-medium' : ''
                    }`}
                  >
                    <SkillMark skill={s} size={22} />
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <MySkillsNav lang={lang} variant="side" />
      <AccountNav lang={lang} variant="side" />
    </>
  );
}

/** Left column on desktop; on phones and tablets a top bar with a menu drawer plus a strip of tool chips. */
export function SkillSidebar({ lang, active, mode }: Props) {
  const t = UI[lang];
  const skills = SKILLS.map((s) => localizeSkill(s, lang));
  const href = (slug: string) => (mode === 'home' ? `#${slug}` : `/${lang}/skills/${slug}`);
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-8 -ml-1 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain pb-4 pl-1 pr-1">
          <Brand lang={lang} className="mb-5" />
          <SiteControls lang={lang} className="mb-8" />
          <NavLinks lang={lang} active={active} mode={mode} />
        </div>
      </aside>

      <div className="mb-5 flex items-center justify-between gap-2 lg:hidden">
        <Brand lang={lang} />
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SiteControls lang={lang} />
          <MobileMenu label={t.menu} closeLabel={t.close}>
            <NavLinks lang={lang} active={active} mode={mode} />
          </MobileMenu>
        </div>
      </div>
      <nav aria-label={t.skillsHeading} className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:-mx-8 md:px-8 lg:hidden">
        {skills.map((s) => (
          <Link
            key={s.slug}
            href={href(s.slug)}
            aria-current={active === s.slug ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm ${
              active === s.slug ? 'border-ink bg-ink text-paper' : 'border-line bg-card'
            }`}
          >
            <SkillMark skill={s} size={18} />
            {s.name}
          </Link>
        ))}
        <MySkillsNav lang={lang} variant="chips" />
        <AccountNav lang={lang} variant="chips" />
      </nav>
    </>
  );
}
