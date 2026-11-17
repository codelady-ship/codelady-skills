import type { Locale } from '@/i18n/config';
import { SkillSidebar } from './SkillSidebar';
import { SearchBox } from './SearchBox';
import { HistoryButton, HistoryPanel } from './HistoryPanel';

/**
 * Every page: tools on the left, search on top, past work on the right
 * (a button with a drawer on smaller screens).
 */
export function PageShell({ lang, mode, active, children }: {
  lang: Locale;
  mode: 'home' | 'tool' | 'other';
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col px-4 pt-8 md:px-8 lg:flex-row lg:gap-12 xl:max-w-[1500px] xl:gap-10">
      <SkillSidebar lang={lang} mode={mode} active={active} />
      <main id="main" className="min-w-0 flex-1">
        <div className="mb-8 flex items-center gap-3">
          <SearchBox lang={lang} />
          <HistoryButton lang={lang} />
        </div>
        {children}
      </main>
      <HistoryPanel lang={lang} />
    </div>
  );
}
