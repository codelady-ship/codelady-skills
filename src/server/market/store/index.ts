import 'server-only';
import { marketConfig } from '../config';
import { memoryStore } from './memory';
import { supabaseStore } from './supabase';
import type { MarketStore } from './types';

/** The database for this request: Supabase when configured, memory in mock mode, otherwise null. */
export function getStore(): MarketStore | null {
  const c = marketConfig();
  if (c.supabase) return supabaseStore(c.supabase);
  if (c.mock) return memoryStore();
  return null;
}

export type { MarketStore } from './types';
