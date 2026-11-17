'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { useMySkills } from '@/lib/my-skills';
import { AssistantTool } from '@/components/tools/AssistantTool';
import { SkillCard } from './SkillCard';
import { OwnClaudePanel, type InstallSource } from '@/components/OwnClaudePanel';

/** github.com/owner/repo[/tree/ref/dir] → install source (ref defaults to main) */
function sourceOf(url: string): InstallSource | undefined {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?$/);
  if (!m) return undefined;
  const [, owner, repo, ref = 'main', dir] = m;
  return { repo: `${owner}/${repo}`, ref, dir, folder: dir ? dir.split('/').pop()! : repo };
}

const subscribeHash = (l: () => void) => {
  window.addEventListener('hashchange', l);
  return () => window.removeEventListener('hashchange', l);
};

/** /[lang]/my#<id>: one of the visitor's own skills, with the same form and answer panel as ours. */
export function MySkillView({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const id = useSyncExternalStore(subscribeHash, () => location.hash.slice(1), () => '');
  const mine = useMySkills();
  const skill = mine.find((s) => s.id === id);

  if (!id) return null;
  if (!skill) {
    return (
      <div className="max-w-[640px] rounded-lg bg-paper-2 p-5">
        <p>{t.customNotFound}</p>
        <Link href={`/${lang}/add`} className="mt-4 inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-medium text-paper">
          {t.addSkill} →
        </Link>
      </div>
    );
  }

  const labels = Object.fromEntries(skill.fields.map((f) => [f.name, f.label]));
  return (
    <>
      <h1 className="sr-only">{skill.name}</h1>
      <div className="mb-8 max-w-[760px]">
        <SkillCard lang={lang} skill={skill} />
      </div>
      <AssistantTool
        key={skill.id}
        lang={lang}
        endpoint="/api/run-custom"
        href={`/${lang}/my#${skill.id}`}
        extraBody={{ url: skill.url, labels }}
        skill={{
          slug: `my-${skill.id}`,
          name: skill.name,
          tagline: skill.tagline,
          ask: skill.name,
          about: skill.whatFor,
          gives: skill.gets,
          group: 'İş',
          kind: 'assistant',
          access: 'free',
          tone: skill.tone,
          mark: skill.mark,
          fields: skill.fields,
          submitLabel: skill.submitLabel || t.runBtn,
        }}
      />
      <OwnClaudePanel lang={lang} source={sourceOf(skill.url)} />
    </>
  );
}
