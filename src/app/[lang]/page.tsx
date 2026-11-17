import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SKILLS } from '@/skills/registry';
import { PageShell } from '@/components/PageShell';
import { SkillMark } from '@/components/SkillMark';
import { hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { localizeSkill } from '@/i18n/skills';

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = UI[lang];
  const skills = SKILLS.map((s) => localizeSkill(s, lang));

  return (
    <PageShell lang={lang} mode="home">

        <section className="pb-14">
          <h1 className="font-serif text-[2.3rem] font-semibold leading-[1.1] tracking-tight md:text-[3rem]">{t.homeTitle}</h1>
          <p className="mt-3 max-w-[560px] text-[1.15rem] leading-relaxed text-ink-2">{t.homeLead}</p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${lang}/skills/${s.slug}`}
                  className="group flex h-full min-h-[150px] flex-col rounded-xl border-2 border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-ink"
                >
                  <SkillMark skill={s} size={40} />
                  <span className="mt-4 text-[1.25rem] font-semibold leading-snug">{s.ask}</span>
                  <span className="mt-1.5 text-[0.95rem] leading-snug text-ink-2">{s.tagline}</span>
                  <span className="mt-auto pt-4 text-[1rem] font-medium" style={{ color: s.tone }}>
                    {t.start} <span aria-hidden className="inline-block transition group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <ol className="mt-10 grid gap-3 text-[1rem] sm:grid-cols-3">
            {t.howSteps.map((step, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-paper-2 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm text-paper">{i + 1}</span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <h2 className="mb-2 font-serif text-[1.5rem] font-semibold">{t.moreAbout}</h2>
        <ol className="border-t border-line">
          {skills.map((s, i) => (
            <li key={s.slug} id={s.slug} className="grid gap-6 border-b border-line py-10 md:grid-cols-[1fr_260px] md:gap-10">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-sm text-ink-2">{String(i + 1).padStart(2, '0')}</span>
                  <SkillMark skill={s} size={28} />
                  <span className="text-sm text-ink-2">{t.groups[s.group] || s.group}</span>
                  {s.access === 'pro' && (
                    <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider text-ink-2">
                      {t.pro}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-[1.6rem] font-semibold leading-tight">{s.name}</h2>
                <p className="mt-1.5 text-[1.05rem] text-ink">{s.tagline}</p>
                <p className="mt-3 max-w-[60ch] leading-relaxed text-ink-2">{s.about}</p>
                <Link
                  href={`/${lang}/skills/${s.slug}`}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
                >
                  {t.open} <span aria-hidden>→</span>
                </Link>
              </div>
              <ul className="space-y-2 self-start rounded-lg border border-line bg-card p-4 text-[0.93rem]">
                {s.gives.map((g) => (
                  <li key={g} className="flex gap-2.5">
                    <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.tone }} />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <section className="mt-14 max-w-[640px] text-ink-2">
          <h2 className="font-serif text-xl font-semibold text-ink">{t.careTitle}</h2>
          <p className="mt-2 leading-relaxed">{t.careText}</p>
        </section>
    </PageShell>
  );
}
