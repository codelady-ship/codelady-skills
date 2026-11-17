'use client';

import { useEffect, useState } from 'react';
import type { LibrarySkill } from './library-types';

let cache: LibrarySkill[] | null = null;
let pending: Promise<LibrarySkill[]> | null = null;

function load() {
  pending ??= fetch('/api/library')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])
    .then((list: LibrarySkill[]) => (cache = Array.isArray(list) ? list : []));
  return pending;
}

/** The Library list, fetched once per page load and only when `enabled` (e.g. search box focused). */
export function useLibrary(enabled = true) {
  const [list, setList] = useState<LibrarySkill[] | null>(cache);
  useEffect(() => {
    if (!enabled || cache) return;
    let live = true;
    load().then((l) => { if (live) setList(l); });
    return () => { live = false; };
  }, [enabled]);
  return list ?? cache;
}
