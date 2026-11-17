# Marketplace: setup and how it works

Creators sign in with Google and publish skills as **free**, **one-time** or **monthly**, with an
optional free trial of 0, 3, 7 or 14 days. New skills wait as *pending* until the admin approves
them. Buyers pay through Lemon Squeezy in USD and see an approximate price in their own currency.
The site keeps 20% of each sale, and the owner sends creators their share by hand.

## Try it locally (mock mode, no keys)

Mock mode is on whenever Supabase is not configured and `MOCK_AUTH` is not `0`.

```bash
npm run dev            # or: npx next dev -p 3211
```

1. Open `/en/signin` and choose **Test buyer**.
2. Open `/en/market`, click **Interview coach** ($5 one-time, 7-day trial), then **Start 7-day free trial**. The form appears. Click **Buy** on another skill to reach the test checkout, then **Pay (test)**.
3. Open `/en/purchases` to see the trial, purchase or subscription.
4. Sign out from the sidebar, sign in as **Test creator**, then open `/en/publish`, publish a paid skill and check `/en/earnings`.
5. Sign in as **Test admin** (`admin@mock.test`) and open `/en/admin` to approve the skill, set prices (including on built-in skills), grant or revoke free access, view sales and record payouts.

Data is kept in memory and resets when the dev server restarts. The mock checkout sends **signed** test webhooks through the same handler as real ones.

Tests: `npm test` (access rules, price conversion, fee split, webhook checks, AI time limit). Translations: `npm run check-i18n`. Both run the TypeScript files directly with Node 23.6 or newer (no extra package; `tests/helpers/hooks.mjs` maps `@/` and `server-only`).

## Owner setup (real accounts)

### 1. Supabase (login + database)
1. Create a project at supabase.com. You can reuse the voice app's project, since `profiles` is shared.
2. In **SQL Editor**, run `supabase/migrations/0002_marketplace.sql`, then `0003_subscription_price_ok.sql`. Both are safe to run again.
3. Under **Project Settings → API**, copy the URL, the anon key and the service-role key.

### 2. Google sign-in
1. In Google Cloud Console, go to **APIs & Services → OAuth consent screen** and set it up (External).
2. Go to **Credentials → Create credentials → OAuth client ID**, choose *Web application*, and add this authorised redirect URI:
   `https://<your-project>.supabase.co/auth/v1/callback`
3. In Supabase, go to **Authentication → Providers → Google**, turn it on, and paste the client ID and secret.
4. Still in Supabase, open **Authentication → URL Configuration**. Set **Site URL** to `https://<your-domain>` and add these **Redirect URLs**:
   `https://<your-domain>/api/market/auth/callback**` and `http://localhost:3000/api/market/auth/callback**`
   The `**` wildcard lets the callback keep its query string (e.g. the page to return to); Supabase rejects redirect URLs that don't match.

We never see or store passwords. The site keeps Supabase's tokens in httpOnly cookies.

### 3. Lemon Squeezy (payments)
**Check this first:** when you sign up, confirm that Lemon Squeezy can **pay out to a seller based in Azerbaijan** (supported countries and payout methods). If it can't, use **Paddle** instead. The payment code sits behind a small interface (`src/server/market/pay/types.ts`), so a `paddle.ts` file can replace it.

1. Create a store. Keep **Test mode** on until everything works.
2. Create two products:
   - **Skill (one-time)**, a single payment. Copy its *variant id*.
   - **Skill (monthly)**, a subscription billed monthly. Copy its *variant id*. Free trials are handled by the site, so leave the trial off here.

   Checkouts made by the site replace the name and price with the skill's own (`custom_price`). The product's own price still applies to anyone who opens the product's **public buy link** directly, and that link accepts extra `checkout[custom][...]` fields from anyone. So the site does not trust those fields on their own:
   - every checkout it creates carries the skill price, its kind (`one_time` or `monthly`) and a signature (`sig`, an HMAC-SHA256 of user id, skill id, price and kind with `LEMONSQUEEZY_WEBHOOK_SECRET`). A paying event without a valid signature is rejected;
   - the amount actually paid before tax (subtotal minus any discount) must reach the signed price, or the payment is rejected as `underpaid` and gives no access. So **discount codes that bring a skill below its price don't work** for marketplace products;
   - a one-time order only counts for a one-time skill, and a subscription only for a monthly skill;
   - the order or subscription must be for the variant set in `LEMONSQUEEZY_VARIANT_ONE_TIME` / `LEMONSQUEEZY_VARIANT_MONTHLY`. **Both must be set**: with a variant id missing, paying events are rejected.

   Subscription status events carry no amount, so a subscription gives access only after one of its invoices has paid the signed price (`price_ok` in the `subscriptions` table, migration `0003`). Don't share the products' public buy links: buyers should always start from the skill page.
3. Under **Settings → API**, create an API key.
4. Under **Settings → Webhooks**, add `https://<your-domain>/api/market/webhook`, type a signing secret, and tick these events:
   `order_created`, `order_refunded`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`, `subscription_paused`, `subscription_unpaused`, `subscription_payment_success`, `subscription_payment_refunded`.
   The voice app's webhook can stay as it is. Each app ignores the other's events.

### 4. Keys
For local work, copy `.env.example` to `.env.local` and fill it in. For Cloudflare:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put LEMONSQUEEZY_API_KEY
npx wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET
```

Put the non-secret values under `vars` in `wrangler.jsonc`: `SITE_URL`, `ADMIN_EMAILS`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ONE_TIME`, `LEMONSQUEEZY_VARIANT_MONTHLY`, and `LEMONSQUEEZY_TEST_MODE` (`1` while testing). Keep `MOCK_AUTH` at `"0"`.

## How access works

The rule lives in `src/lib/market/access.ts` and is enforced on the server in `/api/market/run/[id]` and `/api/run/[slug]`, before the AI is called.

- **Free and approved:** anyone can run it, without signing in.
- **Paid:** these people can run it: the creator, the admin, a buyer with a paid (not refunded) purchase, a subscriber who is active or cancelled but still inside the paid period, a user inside an unexpired trial (one per person per skill), and anyone with an admin grant for this skill or for all skills that isn't revoked or expired.
- **Pending or hidden:** only the creator and the admin can see or run it.
- **The owner's built-in skills:** free unless priced on the admin page.

Skill instructions are stored in `skill_sources` and never reach the browser.

## Prices

Creators set prices in USD, from $1 to $500. Visitors see `≈` plus the amount in their own currency. The currency is picked from Cloudflare's `cf-ipcountry` header, then from `Accept-Language`, so a visitor in Azerbaijan sees AZN. Visitors can change it, and the choice is saved in localStorage. Rates come from open.er-api.com (free, no key, includes AZN) and are cached for 12 hours. If AZN is ever missing, cbar.az fills it in. Lemon Squeezy always charges in USD, so the page says "charged in USD; your bank converts".

## Money

Each payment records a `sales` row with the pre-tax amount, the platform fee (20%, `MARKET_FEE_PERCENT`) and the creator's share. Sales of built-in skills go 100% to the site. Lemon Squeezy's own fee comes out of the payout to the owner, so the 20% has to cover it. Creators see their balance on `/[lang]/earnings`. The admin records each payout on the **Payouts** tab after sending the money by hand.
