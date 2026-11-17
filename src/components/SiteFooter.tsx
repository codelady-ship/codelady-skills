import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

export function SiteFooter({ lang }: { lang: Locale }) {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-8 text-sm text-ink-2 md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          {lang === 'az' ? 'Antiqa Cəlilova, Bakı.' : 'Antiqa Jalilova, Baku.'} {UI[lang].footerContact}{' '}
          <a className="underline underline-offset-4 hover:text-ink" href="https://www.instagram.com/codelady.abroad">
            @codelady.abroad
          </a>
        </p>
        <p className="flex gap-2 md:gap-4">
          <a className="inline-flex min-h-11 items-center px-1 hover:text-ink" href="https://github.com/codelady-ship">GitHub</a>
          <a className="inline-flex min-h-11 items-center px-1 hover:text-ink" href="https://www.linkedin.com/in/entiqe-celilova">LinkedIn</a>
        </p>
      </div>
    </footer>
  );
}
