import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { SignIn } from '@/components/market/SignIn';
import { PageTitle } from '@/components/market/ui';
import { hasLocale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';

export async function generateMetadata({ params }: PageProps<'/[lang]/signin'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: MARKET[lang].signInTitle, robots: { index: false } } : {};
}

export default async function Page({ params }: PageProps<'/[lang]/signin'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <PageTitle title={MARKET[lang].signInTitle} lead={MARKET[lang].signInLead} />
      <SignIn lang={lang} />
    </PageShell>
  );
}
