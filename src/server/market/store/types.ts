import type { Grant, Payout, Profile, Purchase, Sale, SkillRow, SkillStatus, Subscription, Trial } from '@/lib/market/types';

export type NewSkill = Omit<SkillRow, 'id' | 'created_at' | 'updated_at'>;
export type SkillPatch = Partial<Pick<SkillRow, 'name' | 'tagline' | 'description' | 'input_label' | 'pricing' | 'price_cents' | 'trial_days' | 'status' | 'creator_name'>>;

export type Entitlements = { purchases: Purchase[]; subscriptions: Subscription[]; trials: Trial[]; grants: Grant[] };

/**
 * Database interface. Two implementations: memory.ts (mock mode, local tests)
 * and supabase.ts (PostgREST with the service-role key, server only).
 * Permission checks happen in the callers, never here.
 */
export interface MarketStore {
  kind: 'memory' | 'supabase';

  ensureProfile(u: { id: string; email: string }): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  findProfileByEmail(email: string): Promise<Profile | null>;
  listProfiles(limit?: number): Promise<Profile[]>;

  listSkills(f?: { status?: SkillStatus; creatorId?: string; includeBuiltin?: boolean }): Promise<SkillRow[]>;
  getSkill(id: string): Promise<SkillRow | null>;
  getBuiltinSkill(slug: string): Promise<SkillRow | null>;
  createSkill(row: NewSkill, instructions: string | null): Promise<SkillRow>;
  updateSkill(id: string, patch: SkillPatch): Promise<SkillRow | null>;
  getInstructions(skillId: string): Promise<string | null>;

  /** Everything that could give `userId` access to `skillId` (grants include all-skill grants). */
  entitlements(userId: string, skillId: string): Promise<Entitlements>;
  /** All of one user's rows, for "My purchases". */
  userEntitlements(userId: string): Promise<Entitlements>;
  listAll(): Promise<Entitlements>;

  createTrial(row: Omit<Trial, 'id'>): Promise<Trial | null>; // null = already had one
  upsertPurchase(row: Omit<Purchase, 'id' | 'created_at'>): Promise<Purchase>;
  setPurchaseStatus(provider: string, orderId: string, status: Purchase['status']): Promise<Purchase | null>;
  /** Status from a provider event. Never touches price_ok (a new row starts with price_ok false). */
  upsertSubscription(row: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'price_ok'>): Promise<Subscription>;
  /**
   * An invoice paid at least the signed price: set price_ok. Creates the row (status 'incomplete',
   * no access until a status event arrives) when the invoice comes before subscription_created.
   */
  markSubscriptionPaid(row: Pick<Subscription, 'user_id' | 'skill_id' | 'provider' | 'provider_sub_id'>): Promise<void>;
  findSubscription(provider: string, providerSubId: string): Promise<Subscription | null>;

  addGrant(row: Omit<Grant, 'id' | 'created_at' | 'revoked_at'>): Promise<Grant>;
  revokeGrant(id: string): Promise<Grant | null>;

  /** false when this provider_ref was already recorded */
  addSale(row: Omit<Sale, 'id' | 'created_at' | 'refunded'>): Promise<boolean>;
  markSaleRefunded(provider: string, providerRef: string): Promise<void>;
  listSales(f?: { creatorId?: string; limit?: number }): Promise<Sale[]>;

  addPayout(row: Omit<Payout, 'id' | 'created_at'>): Promise<Payout>;
  listPayouts(f?: { creatorId?: string }): Promise<Payout[]>;

  /** true the first time an event id is seen (webhook retries are ignored) */
  recordEvent(provider: string, eventId: string): Promise<boolean>;
  /** Removes a recorded event id again (its writes failed), so the provider's retry is applied. */
  forgetEvent(provider: string, eventId: string): Promise<void>;
}
