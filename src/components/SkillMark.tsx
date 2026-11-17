import type { Skill } from '@/skills/types';

export function SkillMark({ skill, size = 32 }: { skill: Skill; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-[6px] font-mono font-medium text-white"
      style={{ width: size, height: size, background: skill.tone, fontSize: size * 0.38 }}
    >
      {skill.mark}
    </span>
  );
}
