import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { Earnings } from '@/components/market/Earnings';
import { hasLocale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';

export async function generateMetadata({ params }: PageProps<'/[lang]/earnings'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: MARKET[lang].earningsTitle, robots: { index: false } } : {};
}

export default async function Page({ params }: PageProps<'/[lang]/earnings'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <Earnings lang={lang} />
    </PageShell>
  );
}
