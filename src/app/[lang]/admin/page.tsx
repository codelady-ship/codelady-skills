import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { AdminView } from '@/components/market/AdminView';
import { hasLocale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';

export async function generateMetadata({ params }: PageProps<'/[lang]/admin'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: MARKET[lang].adminTitle, robots: { index: false } } : {};
}

export default async function Page({ params }: PageProps<'/[lang]/admin'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <AdminView lang={lang} />
    </PageShell>
  );
}
