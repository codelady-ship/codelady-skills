import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { MySkillView } from '@/components/custom/MySkillView';
import { hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

export async function generateMetadata({ params }: PageProps<'/[lang]/my'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: UI[lang].mySkills, robots: { index: false } } : {};
}

/** The skill itself is chosen by the #id in the address and read from the visitor's browser. */
export default async function MyPage({ params }: PageProps<'/[lang]/my'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
        <MySkillView lang={lang} />
    </PageShell>
  );
}
