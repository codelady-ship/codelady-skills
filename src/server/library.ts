import 'server-only';
import type { LibrarySkill } from '@/lib/library-types';
import { buildLibrary } from '@/lib/library-build';
import curated from '@/skills/curated.json';
import catalog from '@/skills/catalog.json';

export const LIBRARY: LibrarySkill[] = buildLibrary(curated as never, catalog as never);
