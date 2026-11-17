import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { LibraryView } from '@/components/LibraryView';
import { hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

export async function generateMetadata({ params }: PageProps<'/[lang]/library'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: UI[lang].library, description: UI[lang].libraryLead } : {};
}

export default async function LibraryPage({ params }: PageProps<'/[lang]/library'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <PageShell lang={lang} mode="other">
      <LibraryView lang={lang} />
    </PageShell>
  );
}
