// Marketplace data shapes, shared by server and browser.
// Field names match the Supabase columns (supabase/migrations/0002_marketplace.sql).
// Pure types only: no imports, so Node's test runner can load files that use them.

export type Pricing = 'free' | 'one_time' | 'monthly';
export type SkillStatus = 'pending' | 'approved' | 'hidden';
export const TRIAL_CHOICES = [0, 3, 7, 14] as const;

export type SkillRow = {
  id: string;
  /** Set when this row prices one of the owner's built-in skills (src/skills/registry.ts) */
  builtin_slug: string | null;
  /** null = the site owner (built-in skills) */
  creator_id: string | null;
  creator_name: string | null;
  name: string;
  tagline: string;
  description: string;
  /** Label of the one input box shown to people who run the skill */
  input_label: string;
  pricing: Pricing;
  /** USD cents; 0 for free skills */
  price_cents: number;
  /** Free days before paying (paid skills only): 0, 3, 7 or 14 */
  trial_days: number;
  status: SkillStatus;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = { id: string; email: string; display_name: string | null; created_at: string };

export type Purchase = {
  id: string; user_id: string; skill_id: string; provider: string; order_id: string;
  amount_cents: number; status: 'paid' | 'refunded'; created_at: string;
};

export type Subscription = {
  id: string; user_id: string; skill_id: string; provider: string; provider_sub_id: string;
  /** Lemon Squeezy status: active, on_trial, past_due, cancelled, expired, unpaid, paused */
  status: string;
  current_period_end: string | null;
  /** true once an invoice paid at least the signed price; only then can the subscription give access */
  price_ok: boolean;
  created_at: string; updated_at: string;
};

export type Trial = { id: string; user_id: string; skill_id: string; started_at: string; ends_at: string };

export type Grant = {
  id: string; user_id: string;
  /** null = every skill */
  skill_id: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
};

export type Sale = {
  id: string; skill_id: string; creator_id: string | null; buyer_id: string;
  kind: 'one_time' | 'subscription';
  provider: string; provider_ref: string;
  gross_cents: number; fee_cents: number; net_cents: number;
  refunded: boolean;
  created_at: string;
};

export type Payout = { id: string; creator_id: string; amount_cents: number; note: string | null; created_by: string; created_at: string };

/** What the browser is told about one skill and the visitor's access to it. */
export type AccessInfo = {
  allowed: boolean;
  via?: AccessVia;
  until?: string | null;
  reason?: DenyReason;
  trialAvailable?: boolean;
};
export type AccessVia = 'free' | 'creator' | 'admin' | 'purchase' | 'subscription' | 'trial' | 'grant';
export type DenyReason = 'not_listed' | 'login' | 'payment';

export type Me = { id: string; email: string; isAdmin: boolean } | null;
