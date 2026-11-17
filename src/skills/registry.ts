// To add a skill:
//   1. create src/skills/<name>.ts (copy social-post.ts as a starting point)
//   2. add its SKILL.md path to scripts/sync-skills.mjs (key = promptKey below)
//   3. add one line to SKILLS here
import type { Skill } from './types';
import { scamChecker } from './scam-checker';
import { studyAbroad } from './study-abroad';
import { travel } from './travel';
import { job } from './job';
import { voiceover } from './voiceover';
import { socialPost } from './social-post';

type Entry = { skill: Skill; promptKey: string };

const ENTRIES: Entry[] = [
  { skill: voiceover, promptKey: 'voiceover' },
  { skill: scamChecker, promptKey: 'scam-checker' },
  { skill: studyAbroad, promptKey: 'study-abroad' },
  { skill: travel, promptKey: 'travel' },
  { skill: job, promptKey: 'job' },
  { skill: socialPost, promptKey: 'social-post' },
];

export const SKILLS: Skill[] = ENTRIES.map((e) => e.skill);
export const GROUPS = ['Səs', 'Xaricdə təhsil', 'İş', 'Marketinq'] as const;

export const getSkill = (slug: string) => SKILLS.find((s) => s.slug === slug);
export const promptKeyFor = (slug: string) => ENTRIES.find((e) => e.skill.slug === slug)?.promptKey;
