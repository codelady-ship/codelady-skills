'use client';

import { useSyncExternalStore } from 'react';

/** One finished piece of work: kept in this browser only, newest first. */
export type HistoryItem = {
  id: string;
  at: number;
  lang: string;
  /** Where the tool lives, so it can be opened again */
  href: string;
  skillName: string;
  tone: string;
  mark: string;
  /** Short line from what the visitor typed */
  title: string;
  kind: 'answer' | 'voice';
  text: string;
  sources: { title: string; url: string }[];
};

const KEY = 'history';
const MAX_ITEMS = 60;
const MAX_TEXT = 20_000;
const listeners = new Set<() => void>();
let cached: { raw: string | null; list: HistoryItem[] } = { raw: null, list: [] };
const EMPTY: HistoryItem[] = [];

function readRaw() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function snapshot(): HistoryItem[] {
  const raw = readRaw();
  if (raw !== cached.raw) {
    let list: HistoryItem[] = [];
    try { list = raw ? JSON.parse(raw) : []; } catch {}
    cached = { raw, list: Array.isArray(list) ? list : [] };
  }
  return cached.list;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) l(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
}

export function useHistory() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

function write(list: HistoryItem[]) {
  // Browsers allow about 5 MB: when full, drop the oldest items until it fits.
  let items = list.slice(0, MAX_ITEMS);
  while (items.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      break;
    } catch {
      items = items.slice(0, -1);
    }
  }
  listeners.forEach((l) => l());
}

export function addHistory(item: Omit<HistoryItem, 'id' | 'at'>): string {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  write([{ ...item, id, at: Date.now(), text: item.text.slice(0, MAX_TEXT), title: item.title.slice(0, 140) }, ...snapshot()]);
  return id;
}

export function removeHistory(id: string) {
  write(snapshot().filter((h) => h.id !== id));
}

export function clearHistory() {
  write([]);
}

/** First thing the visitor typed, on one line */
export function titleFrom(values: Record<string, string>) {
  const first = Object.values(values).find((v) => v && v.trim().length > 2) || '';
  return first.replace(/\s+/g, ' ').trim();
}
