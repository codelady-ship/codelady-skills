// Which skills to suggest next to a skill. Plain data, shared by server pages and client components.
import type { LibrarySkill } from '@/lib/library-types';

/**
 * "You may also need these": skills that people doing the same kind of work tend to use.
 * Same category first, then neighbouring ones (a videographer also gets design and social media).
 */
const NEAR: Record<string, string[]> = {
  'Video & audio': ['Design & images', 'Social media management', 'Marketing & social', 'Writing & content'],
  'Design & images': ['Website building', 'Video & audio', 'Interior & architecture', 'Marketing & social'],
  'Website building': ['Design & images', 'Coding & dev', 'Marketing & social', 'Writing & content'],
  'Interior & architecture': ['Design & images', 'Productivity & docs', 'Legal & business'],
  'Marketing & social': ['Social media management', 'Writing & content', 'Design & images', 'Video & audio'],
  'Social media management': ['Marketing & social', 'Video & audio', 'Writing & content', 'Design & images'],
  'Writing & content': ['Marketing & social', 'Research', 'Career & jobs', 'Social media management'],
  'Career & jobs': ['Writing & content', 'Education & study', 'Legal & business'],
  'Education & study': ['Research', 'Writing & content', 'Career & jobs'],
  'Coding & dev': ['Website building', 'Data & spreadsheets', 'Productivity & docs'],
  'Data & spreadsheets': ['Finance & trading', 'Research', 'Productivity & docs'],
  'Productivity & docs': ['Data & spreadsheets', 'Writing & content', 'Research'],
  'Finance & trading': ['Data & spreadsheets', 'Legal & business', 'Research'],
  Research: ['Education & study', 'Writing & content', 'Data & spreadsheets'],
  'Legal & business': ['Finance & trading', 'Career & jobs', 'Productivity & docs'],
  Other: ['Productivity & docs'],
};

/** Built-in tools: their Library category and the other built-in tools that go with them */
export const BUILTIN_CATEGORY: Record<string, string> = {
  seslendirme: 'Video & audio',
  'sosial-post': 'Social media management',
  'is-muracieti': 'Career & jobs',
  'xaricde-tehsil': 'Education & study',
  'viza-ve-yol': 'Education & study',
  'saxta-teklif-yoxlama': 'Education & study',
};
export const BUILTIN_NEAR: Record<string, string[]> = {
  seslendirme: ['sosial-post'],
  'sosial-post': ['seslendirme'],
  'is-muracieti': ['xaricde-tehsil', 'saxta-teklif-yoxlama'],
  'xaricde-tehsil': ['viza-ve-yol', 'saxta-teklif-yoxlama', 'is-muracieti'],
  'viza-ve-yol': ['xaricde-tehsil', 'saxta-teklif-yoxlama'],
  'saxta-teklif-yoxlama': ['xaricde-tehsil', 'viza-ve-yol', 'is-muracieti'],
};

const STOP = new Set('when user wants with that this from your what into about also used uses make help helps skill skills claude agent tool tools write like more each them they their have will should which using code'.split(' '));
const words = (s: string) =>
  new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)).map((w) => w.slice(0, 6)));

export function pickRelated(list: LibrarySkill[], category: string, text: string, skipId?: string, max = 6) {
  const mine = words(text);
  const near = NEAR[category] || [];
  const scored = list
    .filter((s) => s.id !== skipId)
    .map((s) => {
      const same = s.category === category;
      const nearBy = near.includes(s.category);
      if (!same && !nearBy) return null;
      let overlap = 0;
      for (const w of words(`${s.name.replace(/-/g, ' ')} ${s.description}`)) if (mine.has(w)) overlap++;
      // Shared words matter most; a same-category skill about something else (e.g. teacher tools
      // next to a student tool) should not beat a neighbour that fits
      if (same ? !overlap && !s.curated : overlap < 2) return null;
      const n = (same ? 2 : 1) + Math.min(overlap, 4) * 1.5 + (s.curated ? 1 : 0) + (s.runnable ? 0.5 : 0);
      return { s, n };
    })
    .filter((x): x is { s: LibrarySkill; n: number } => !!x)
    .sort((a, b) => b.n - a.n);

  // At most half from the same category, so neighbouring fields show up too; one per name
  const out: LibrarySkill[] = [];
  const names = new Set<string>();
  const perCat: Record<string, number> = {};
  const cap = (c: string) => (c === category ? Math.ceil(max / 2) : 2);
  for (const { s } of scored) {
    const nm = s.name.toLowerCase();
    if (names.has(nm) || (perCat[s.category] || 0) >= cap(s.category)) continue;
    names.add(nm);
    perCat[s.category] = (perCat[s.category] || 0) + 1;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Hand-picked Library skills for the built-in tools (end of the Library id). Checked by hand: they fit students and creators. */
export const BUILTIN_PICKS: Record<string, string[]> = {
  seslendirme: ['skills-ig-reel', 'skills-tt-hook-scripter', 'skills-yt-script', 'marketingskills--skills-video', 'skills-ig-caption-writer', 'humanizer--root'],
  'sosial-post': ['marketingskills--skills-social', 'skills-ig-content-planner', 'skills-ig-caption-writer', 'skills-ig-hashtag-strategist', 'skills-ig-reel', 'skills-linkedin-post-writer'],
  'is-muracieti': ['skills-resume-tailor', 'skills-cover-letter-generator', 'skills-interview-prep-generator', 'skills-resume-bullet-writer', 'skills-linkedin-post-writer', 'skills-plain-writing'],
  'xaricde-tehsil': ['skills-research-en-research', 'skills-cover-letter-generator', 'skills-interview-prep-generator', 'research-paper-writing', 'skills-plain-writing', 'humanizer--root'],
  'viza-ve-yol': ['skills-interview-prep-generator', 'skills-research-en-research', 'skills-plain-writing', 'skills-copy-editing'],
  'saxta-teklif-yoxlama': ['legal-skills-review-contract', 'legal-skills-legal-risk-assessment', 'skills-scientific-critical-thinking', 'skills-marketing-claims-review', 'skills-plain-writing'],
};

export function builtinPicks(list: LibrarySkill[], slug: string) {
  return (BUILTIN_PICKS[slug] || [])
    .map((end) => list.find((s) => s.curated && (s.id === end || s.id.endsWith(`--${end}`) || s.id.endsWith(end))))
    .filter((s): s is LibrarySkill => !!s);
}
