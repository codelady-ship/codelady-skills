import { canonicalCategory, type LibrarySkill } from './library-types';

// curated.json: the best open skills on GitHub by category (hand-picked, see docs/research-free-skills-*.md)
// catalog.json: every skill in the owner's own public GitHub repos and forks (scripts/build-catalog.mjs)
type Raw = Omit<LibrarySkill, 'curated'> & { upstream?: string | null };
type Source = { skills?: Raw[] };

/** Merges the two lists, dropping duplicates and forks of the same skill. Shared by the API and the static demo. */
export function buildLibrary(curated: Source, catalog: Source): LibrarySkill[] {
  const seen = new Set<string>();
  const out: LibrarySkill[] = [];
  const add = (list: Raw[], isCurated: boolean) => {
    for (const s of list) {
      const key = `${s.name}|${s.description}`.toLowerCase();
      // Forks of the same repo (even at different commits) count once
      const origin = `${s.upstream || s.repo}|${s.dir || ''}`.toLowerCase();
      if (!s?.id || seen.has(s.id) || seen.has(key) || seen.has(origin)) continue;
      seen.add(s.id); seen.add(key); seen.add(origin);
      out.push({
        id: s.id, name: s.name, description: s.description, category: canonicalCategory(s.category),
        repo: s.repo, ref: s.ref, dir: s.dir || '', license: s.license ?? null, runnable: !!s.runnable,
        stars: s.stars, why: s.why, disclaimer: s.disclaimer, curated: isCurated || undefined,
      });
    }
  };
  add(curated.skills || [], true);
  add(catalog.skills || [], false);
  return out;
}
