-- Marketplace: creators publish skills (free, one-time or monthly), visitors buy them,
-- the admin approves skills, grants free access and records payouts.
--
-- Run once in Supabase → SQL Editor (or `supabase db push`). Safe to run again.
-- Works on a fresh project and on the voice app's project (voice-site 0001_init.sql):
-- `profiles` is shared, the other tables are new.
--
-- The site's server talks to these tables with the service-role key, which bypasses RLS,
-- and checks every permission itself. The RLS policies below are a second wall: with only
-- the public anon key (or a signed-in user's token) nobody can read another person's
-- purchases or any skill's hidden instructions, and nobody can write anything.

create extension if not exists pgcrypto;

-- Profiles (one per Supabase Auth user) -----------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists display_name text;
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- Skills -------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  -- set when the row prices one of the owner's built-in skills (src/skills/registry.ts)
  builtin_slug text unique,
  -- null = the site owner
  creator_id uuid references public.profiles (id) on delete set null,
  creator_name text,
  name text not null check (char_length(name) between 2 and 80),
  tagline text not null default '' check (char_length(tagline) <= 160),
  description text not null default '' check (char_length(description) <= 2000),
  input_label text not null default '' check (char_length(input_label) <= 120),
  pricing text not null default 'free' check (pricing in ('free', 'one_time', 'monthly')),
  price_cents integer not null default 0 check (price_cents >= 0 and price_cents <= 50000),
  trial_days integer not null default 0 check (trial_days in (0, 3, 7, 14)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pricing = 'free' or price_cents >= 100),
  check (pricing <> 'free' or (price_cents = 0 and trial_days = 0))
);
create index if not exists skills_creator_idx on public.skills (creator_id);
create index if not exists skills_status_idx on public.skills (status);

-- The skill's instructions (its SKILL.md). Kept apart so no public policy can ever expose them.
create table if not exists public.skill_sources (
  skill_id uuid primary key references public.skills (id) on delete cascade,
  instructions text not null check (char_length(instructions) <= 60000),
  updated_at timestamptz not null default now()
);

-- One-time purchases --------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  provider text not null,
  order_id text not null,
  amount_cents integer not null default 0,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now(),
  unique (provider, order_id)
);
create index if not exists purchases_user_idx on public.purchases (user_id, skill_id);

-- Monthly subscriptions (state mirrored from Lemon Squeezy webhooks) -------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  provider text not null,
  provider_sub_id text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_sub_id)
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id, skill_id);

-- Free trials (no card): one per person per skill ---------------------------
create table if not exists public.trials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  unique (user_id, skill_id)
);

-- Free access given by the admin (skill_id null = every skill) -------------
create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid references public.skills (id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists access_grants_user_idx on public.access_grants (user_id);

-- Manual payouts to creators -----------------------------------------------
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- Sales: one row per payment, with the platform fee recorded at the time ---
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  creator_id uuid references public.profiles (id) on delete set null,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('one_time', 'subscription')),
  provider text not null,
  provider_ref text not null,
  gross_cents integer not null,   -- before tax, USD
  fee_cents integer not null,     -- platform share (20% by default)
  net_cents integer not null,     -- creator share
  refunded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider, provider_ref)
);
create index if not exists sales_creator_idx on public.sales (creator_id, created_at desc);

-- Webhook deliveries already handled (Lemon Squeezy retries) ---------------
create table if not exists public.market_events (
  provider text not null,
  event_id text not null,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);

-- Row Level Security --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.skill_sources enable row level security;
alter table public.purchases enable row level security;
alter table public.subscriptions enable row level security;
alter table public.trials enable row level security;
alter table public.access_grants enable row level security;
alter table public.payouts enable row level security;
alter table public.sales enable row level security;
alter table public.market_events enable row level security;

-- Read-only policies. There are no insert/update/delete policies at all:
-- every write goes through the site's server (service role) after its own checks.
-- skill_sources and market_events have no policies: nobody but the server can read them.
do $$
begin
  drop policy if exists market_profiles_own on public.profiles;
  create policy market_profiles_own on public.profiles for select to authenticated using (id = auth.uid());

  drop policy if exists market_skills_public on public.skills;
  create policy market_skills_public on public.skills for select to anon, authenticated using (status = 'approved');
  drop policy if exists market_skills_creator on public.skills;
  create policy market_skills_creator on public.skills for select to authenticated using (creator_id = auth.uid());

  drop policy if exists market_purchases_own on public.purchases;
  create policy market_purchases_own on public.purchases for select to authenticated using (user_id = auth.uid());
  drop policy if exists market_subscriptions_own on public.subscriptions;
  create policy market_subscriptions_own on public.subscriptions for select to authenticated using (user_id = auth.uid());
  drop policy if exists market_trials_own on public.trials;
  create policy market_trials_own on public.trials for select to authenticated using (user_id = auth.uid());
  drop policy if exists market_grants_own on public.access_grants;
  create policy market_grants_own on public.access_grants for select to authenticated using (user_id = auth.uid());

  drop policy if exists market_sales_creator on public.sales;
  create policy market_sales_creator on public.sales for select to authenticated using (creator_id = auth.uid());
  drop policy if exists market_payouts_creator on public.payouts;
  create policy market_payouts_creator on public.payouts for select to authenticated using (creator_id = auth.uid());
end $$;

-- Keep updated_at fresh ------------------------------------------------------
create or replace function public.market_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists skills_touch on public.skills;
create trigger skills_touch before update on public.skills for each row execute function public.market_touch();
drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch before update on public.subscriptions for each row execute function public.market_touch();
