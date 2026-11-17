import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { AddSkill } from '@/components/custom/AddSkill';
import { hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

export async function generateMetadata({ params }: PageProps<'/[lang]/add'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: UI[lang].addTitle, robots: { index: false } } : {};
}

export default async function AddPage({ params }: PageProps<'/[lang]/add'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = UI[lang];
  return (
    <PageShell lang={lang} mode="other">
        <div className="mb-8 max-w-[720px]">
          <h1 className="font-serif text-[2rem] font-semibold leading-tight">{t.addTitle}</h1>
          <p className="mt-2 text-[1.05rem] leading-relaxed text-ink-2">{t.addLead}</p>
        </div>
        <AddSkill lang={lang} />
    </PageShell>
  );
}
