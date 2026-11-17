'use client';

import { useSyncExternalStore } from 'react';
import type { Field } from '@/skills/types';

/** A skill the visitor added from GitHub. Lives only in their browser (localStorage). */
export type MySkill = {
  id: string;
  url: string;
  name: string;
  tagline: string;
  whatFor: string;
  needs: string[];
  gets: string[];
  fields: Field[];
  submitLabel?: string;
  tone: string;
  mark: string;
  addedAt: number;
};

const KEY = 'my-skills';
const TONES = ['#9A3412', '#166534', '#1E40AF', '#86198F', '#0F766E', '#B45309', '#4338CA', '#BE123C'];
const listeners = new Set<() => void>();
let cached: { raw: string | null; list: MySkill[] } = { raw: null, list: [] };

function readRaw() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function snapshot(): MySkill[] {
  const raw = readRaw();
  if (raw !== cached.raw) {
    let list: MySkill[] = [];
    try { list = raw ? JSON.parse(raw) : []; } catch {}
    cached = { raw, list: Array.isArray(list) ? list : [] };
  }
  return cached.list;
}

const EMPTY: MySkill[] = [];
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) l(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
}

export function useMySkills() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

function write(list: MySkill[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  listeners.forEach((l) => l());
}

export function markFor(name: string) {
  const letters = name.replace(/[^\p{L}\p{N}]/gu, '');
  return (letters.slice(0, 1).toUpperCase() + letters.slice(1, 2).toLowerCase()) || 'Sk';
}

export function addSkill(card: Omit<MySkill, 'id' | 'tone' | 'mark' | 'addedAt'>): MySkill {
  const list = snapshot();
  const existing = list.find((s) => s.url === card.url);
  const id = existing?.id || Math.random().toString(36).slice(2, 10);
  const skill: MySkill = {
    ...card,
    id,
    mark: markFor(card.name),
    tone: existing?.tone || TONES[list.length % TONES.length],
    addedAt: Date.now(),
  };
  write([...list.filter((s) => s.id !== id), skill]);
  return skill;
}

export function removeSkill(id: string) {
  write(snapshot().filter((s) => s.id !== id));
}
