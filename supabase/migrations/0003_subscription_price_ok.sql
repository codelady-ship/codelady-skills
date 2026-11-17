-- A subscription gives access only after an invoice paid at least the price signed into its checkout.
-- Status webhooks (subscription_created/updated/...) never set this column; only a paid invoice does
-- (src/server/market/payments.ts). Safe to run again.
alter table public.subscriptions add column if not exists price_ok boolean not null default false;
