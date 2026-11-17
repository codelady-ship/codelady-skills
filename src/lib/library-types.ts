/** One open skill from GitHub, shown in the Library and in search. */
export type LibrarySkill = {
  id: string;
  name: string;
  description: string;
  category: string;
  repo: string;
  ref: string;
  dir: string;
  license: string | null;
  runnable: boolean;
  stars?: number;
  why?: string;
  disclaimer?: boolean;
  /** Hand-picked as one of the best in its category */
  curated?: boolean;
};

export const treeUrl = (s: Pick<LibrarySkill, 'repo' | 'ref' | 'dir'>) =>
  `https://github.com/${s.repo}/tree/${s.ref}${s.dir ? `/${s.dir}` : ''}`;

/** The categories every Library skill is sorted into. UI[lang].categories translates them. */
export const CATEGORIES = [
  'Design & images', 'Website building', 'Interior & architecture', 'Marketing & social', 'Social media management',
  'Writing & content', 'Career & jobs', 'Education & study', 'Coding & dev', 'Data & spreadsheets', 'Video & audio',
  'Productivity & docs', 'Finance & trading', 'Research', 'Legal & business', 'Other',
] as const;

// Short or older names (catalog script, research notes) → the canonical name
const ALIAS: Record<string, string> = {
  design: 'Design & images', images: 'Design & images', image: 'Design & images',
  website: 'Website building', web: 'Website building', frontend: 'Website building',
  interior: 'Interior & architecture', architecture: 'Interior & architecture',
  marketing: 'Marketing & social', seo: 'Marketing & social',
  social: 'Social media management', instagram: 'Social media management',
  writing: 'Writing & content', content: 'Writing & content',
  career: 'Career & jobs', jobs: 'Career & jobs',
  education: 'Education & study', study: 'Education & study',
  coding: 'Coding & dev', dev: 'Coding & dev', development: 'Coding & dev', programming: 'Coding & dev',
  data: 'Data & spreadsheets', spreadsheets: 'Data & spreadsheets',
  video: 'Video & audio', audio: 'Video & audio',
  productivity: 'Productivity & docs', docs: 'Productivity & docs', documents: 'Productivity & docs',
  finance: 'Finance & trading', trading: 'Finance & trading',
  research: 'Research', legal: 'Legal & business', business: 'Legal & business',
};

export function canonicalCategory(c: string | null | undefined): string {
  if (!c) return 'Other';
  if ((CATEGORIES as readonly string[]).includes(c)) return c;
  const lower = c.toLowerCase();
  const exact = CATEGORIES.find((x) => x.toLowerCase() === lower);
  if (exact) return exact;
  const word = lower.split(/[^a-z]+/).find((w) => ALIAS[w]);
  return word ? ALIAS[word] : 'Other';
}

const UPPER = new Set(['ig', 'tt', 'yt', 'fb', 'li', 'ui', 'ux', 'seo', 'ai', 'sql', 'cv', 'pdf', 'api', 'csv', 'cfo', 'nda', 'swot', 'cfu', 'k12', 'rfp', 'adhd', 'tts']);
/** "ig-reel" → "IG Reel"; names that already have spaces stay as written */
export function prettySkillName(name: string) {
  if (/\s/.test(name)) return name;
  return name.split(/[-_]+/).filter(Boolean)
    .map((w) => (UPPER.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}
