import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { HistoryView } from '@/components/HistoryView';
import { hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

export async function generateMetadata({ params }: PageProps<'/[lang]/history'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: UI[lang].historyTitle, robots: { index: false } } : {};
}

/** One saved result, chosen by the #id in the address and read from the visitor's browser. */
export default async function HistoryPage({ params }: PageProps<'/[lang]/history'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <HistoryView lang={lang} />
    </PageShell>
  );
}
