import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { Purchases } from '@/components/market/Purchases';
import { PageTitle } from '@/components/market/ui';
import { hasLocale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';

export async function generateMetadata({ params }: PageProps<'/[lang]/purchases'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: MARKET[lang].purchasesTitle, robots: { index: false } } : {};
}

export default async function Page({ params }: PageProps<'/[lang]/purchases'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <PageTitle title={MARKET[lang].purchasesTitle} />
      <Purchases lang={lang} />
    </PageShell>
  );
}
