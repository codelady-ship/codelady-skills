import 'server-only';
import { TRIAL_CHOICES } from '@/lib/market/types';

export { parseUsd } from '@/lib/market/price';
export const TRIAL_CHOICES_SET = new Set<number>(TRIAL_CHOICES);
export const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
