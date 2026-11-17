import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { MarketView } from '@/components/market/MarketView';
import { hasLocale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';
import { seoMeta } from '@/lib/site';

export async function generateMetadata({ params }: PageProps<'/[lang]/market'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? seoMeta({ lang, path: '/market', title: MARKET[lang].marketTitle, description: MARKET[lang].marketLead }) : {};
}

export default async function Page({ params }: PageProps<'/[lang]/market'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <MarketView lang={lang} />
    </PageShell>
  );
}
