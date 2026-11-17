import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { PublishForm } from '@/components/market/PublishForm';
import { PageTitle } from '@/components/market/ui';
import { hasLocale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';

export async function generateMetadata({ params }: PageProps<'/[lang]/publish'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: MARKET[lang].publishTitle, robots: { index: false } } : {};
}

export default async function Page({ params }: PageProps<'/[lang]/publish'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <PageTitle title={MARKET[lang].publishTitle} lead={MARKET[lang].publishLead} />
      <PublishForm lang={lang} />
    </PageShell>
  );
}
