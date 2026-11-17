import type { Dict } from '../ui';
import type { SkillText } from '../skills';

/** One extra language. Missing UI strings fall back to English. */
export type LocalePack = {
  ui: Partial<Dict>;
  /** Skill texts by slug, same shape as in skills.ts */
  skills: Record<string, SkillText>;
  /** Voice style names: preset id → [name, description] */
  presets: Record<string, [string, string]>;
};
