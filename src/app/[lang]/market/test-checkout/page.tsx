import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { TestCheckout } from '@/components/market/TestCheckout';
import { hasLocale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';

export async function generateMetadata({ params }: PageProps<'/[lang]/market/test-checkout'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: MARKET[lang].testCheckoutTitle, robots: { index: false } } : {};
}

export default async function Page({ params }: PageProps<'/[lang]/market/test-checkout'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <TestCheckout lang={lang} />
    </PageShell>
  );
}
