import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SKILLS, getSkill } from '@/skills/registry';
import { PageShell } from '@/components/PageShell';
import { SkillMark } from '@/components/SkillMark';
import { AssistantTool } from '@/components/tools/AssistantTool';
import { VoiceTool } from '@/components/tools/VoiceTool';
import { OwnClaudePanel } from '@/components/OwnClaudePanel';
import { RelatedSkills } from '@/components/RelatedSkills';
import { BuiltinGate } from '@/components/market/BuiltinGate';
import { BUILTIN_CATEGORY } from '@/lib/related';
import { LOCALES, hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { localizeSkill } from '@/i18n/skills';
import { IS_DEMO } from '@/lib/base';
import { SITE_URL, clip, jsonLd, pageUrl, seoMeta } from '@/lib/site';

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => SKILLS.map((s) => ({ lang, slug: s.slug })));
}

export async function generateMetadata({ params }: PageProps<'/[lang]/skills/[slug]'>): Promise<Metadata> {
  const { lang, slug } = await params;
  const s = getSkill(slug);
  if (!s || !hasLocale(lang)) return {};
  const l = localizeSkill(s, lang);
  return seoMeta({ lang, path: `/skills/${slug}`, title: l.name, description: clip(`${l.tagline} ${l.about}`) });
}

export default async function SkillPage({ params }: PageProps<'/[lang]/skills/[slug]'>) {
  const { lang, slug } = await params;
  const found = getSkill(slug);
  if (!found || !hasLocale(lang)) notFound();
  const skill = localizeSkill(found, lang);
  const en = localizeSkill(found, 'en'); // matching runs on the English text, like the Library

  // Functions can't cross into client components: send plain data only.
  const { buildRequest: _b, ...plain } = skill;
  void _b;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: skill.name,
    description: clip(`${skill.tagline} ${skill.about}`, 300),
    url: pageUrl(lang, `/skills/${skill.slug}`),
    inLanguage: lang,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    featureList: skill.gives,
    isPartOf: { '@type': 'WebSite', name: 'Codelady Skills', url: SITE_URL },
    author: { '@type': 'Person', name: 'Antiqa Jalilova' },
  };

  return (
    <PageShell lang={lang} mode="tool" active={skill.slug}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
        <div className="mb-8 max-w-[720px]">
          <div className="mb-3 flex items-center gap-3">
            <SkillMark skill={skill} size={30} />
            <span className="text-sm text-ink-2">{UI[lang].groups[skill.group] || skill.group}</span>
          </div>
          <h1 className="font-serif text-[2rem] font-semibold leading-tight">{skill.name}</h1>
          <p className="mt-2 text-[1.05rem] text-ink-2">{skill.tagline}</p>
        </div>

        {skill.kind === 'voice' ? <VoiceTool skill={plain} lang={lang} /> : (
          <BuiltinGate lang={lang} slug={skill.slug}><AssistantTool skill={plain} lang={lang} /></BuiltinGate>
        )}
        {/* The demo doesn't link the owner's own skill repos (they are private). */}
        <OwnClaudePanel lang={lang} agensiUrl={skill.agensiUrl}
          source={IS_DEMO && skill.install?.repo.startsWith('codelady-ship/') ? undefined : skill.install} />
        <RelatedSkills lang={lang} builtinSlug={skill.slug} category={BUILTIN_CATEGORY[skill.slug] || 'Other'}
          text={[en.name, en.tagline, en.about, ...en.gives].join(' ')} />
    </PageShell>
  );
}
