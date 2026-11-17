import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

type CardSkill = { name: string; tagline: string; whatFor: string; needs: string[]; gets: string[]; tone: string; mark: string; url: string };

/** A visitor-added skill in the site's own look: what it is for, what you need, what you get. */
export function SkillCard({ skill, lang }: { skill: CardSkill; lang: Locale }) {
  const t = UI[lang];
  const sections: [string, string[]][] = [
    [t.needs, skill.needs],
    [t.gets, skill.gets],
  ];
  return (
    <article className="rounded-xl border-2 border-line bg-card p-5 md:p-7">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] font-mono text-[0.95rem] font-medium text-white"
          style={{ background: skill.tone }}>
          {skill.mark}
        </span>
        <div className="min-w-0">
          <h3 className="font-serif text-[1.5rem] font-semibold leading-tight">{skill.name}</h3>
          {skill.tagline && <p className="text-[1rem] text-ink-2">{skill.tagline}</p>}
        </div>
      </div>

      {skill.whatFor && (
        <div className="mt-5">
          <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-2">{t.whatFor}</h4>
          <p className="leading-relaxed">{skill.whatFor}</p>
        </div>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {sections.map(([title, items]) =>
          items.length ? (
            <div key={title}>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-2">{title}</h4>
              <ul className="space-y-1.5 text-[0.98rem]">
                {items.map((g) => (
                  <li key={g} className="flex gap-2.5">
                    <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: skill.tone }} />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </div>

      <p className="mt-5 text-sm text-ink-2">
        {t.sourceLink}:{' '}
        <a href={skill.url} target="_blank" rel="noopener noreferrer" className="break-all text-teal underline underline-offset-4">
          {skill.url.replace('https://', '')}
        </a>
      </p>
    </article>
  );
}
