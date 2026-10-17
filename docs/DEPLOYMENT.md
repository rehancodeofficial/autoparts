# Deployment & configuration

## 1. Create the database schema in Supabase

The Supabase project has no tables. The migration runner connects over plain
PostgreSQL using `DATABASE_URL`, which pointed at `localhost`, so nothing was
ever created there — that is the source of the 500 errors.

Open the Supabase dashboard → **SQL Editor** → **New query**, paste
[`docs/SUPABASE_SETUP.sql`](SUPABASE_SETUP.sql) and run it. It is idempotent,
so re-running is safe. It creates 29 tables and the administrator account.

Verify afterwards:

```sql
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public' ORDER BY table_name;
```

## 2. Set the Vercel environment variables

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Transaction Pooler connection string (Project Settings → Database → Connection string → **Transaction pooler**, port 6543) |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `PUBLIC_BASE_URL` | `https://<your-domain>` — where the payment provider returns the shopper |
| `PAYMENT_GATEWAY_PROVIDER` | `MOCK` until real payment credentials exist |
| `PAYMENT_MOCK_SECRET` | A long random string |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Your own admin credentials |
| `NODE_ENV` | `production` |

`SUPABASE_SERVICE_ROLE_KEY` is **not** a database password. `DATABASE_URL`
needs the database password from the same settings page.

With `NODE_ENV=production` the admin bootstrap refuses to seed the default
password, so `ADMIN_PASSWORD` must be set.

## 3. Change the admin password

The setup SQL seeds `demoadmin` / `demoadmin` so the panel is reachable
immediately. **Change it before the site is public.** Either set
`ADMIN_PASSWORD` and run `pnpm db:bootstrap` with `DATABASE_URL` pointed at
Supabase, or generate a bcrypt hash and:

```sql
UPDATE "User" SET "passwordHash" = '<new-bcrypt-hash>'
 WHERE "email" = 'demoadmin@admin.local';
```

## 4. Payments

The payment layer is provider-agnostic. `PAYMENT_GATEWAY_PROVIDER` selects the
driver.

### MOCK (default)

A self-contained test gateway: no network calls, no charges. The outcome is
encoded in a signed payment reference, so it behaves identically across
serverless invocations. Set `MOCK_PAYMENT_OUTCOME` to `paid`, `failed`,
`cancelled` or `pending` to exercise each path.

Every order paid through it is stored with `isTestMode = true` and the admin
panel labels it **TEST MODE**.

### MOYASAR

One hosted page covers mada, Visa/Mastercard, Apple Pay and STC Pay, so no card
data touches this application.

```
PAYMENT_GATEWAY_PROVIDER=MOYASAR
MOYASAR_SECRET_KEY=sk_test_...
MOYASAR_WEBHOOK_SECRET=<the secret token you set on the webhook>
```

Register the webhook in the Moyasar dashboard against:

```
https://<your-domain>/api/payments/webhook/MOYASAR
```

**This driver has not been run against the live sandbox** — no credentials were
available. It is written to Moyasar's documented Invoices API. Test it in
sandbox mode before taking real payments.

### Adding another provider

Implement the four methods of `PaymentDriver` in
[`packages/db/src/paymentProviders.ts`](../packages/db/src/paymentProviders.ts)
— `createPayment`, `verifyPayment`, `refund`, `parseWebhook` — and add a case to
`getPaymentDriver()`. Nothing outside that file is provider-specific.

## 5. Local development

```bash
# API (port 4000)
pnpm api:dev

# Storefront (port 5173, proxies /api to 4000)
pnpm dev
```

Set `PUBLIC_BASE_URL=http://localhost:5173` so the payment redirect returns to
the Vite dev server rather than the API port.

Applying migrations, seeding the catalogue and creating the admin account in
one step, against whatever `DATABASE_URL` points at:

```bash
pnpm db:bootstrap
```

## 6. Tests

```bash
pnpm test
```

The commerce suite (`src/commerce.test.ts`) runs against a real PostgreSQL
database because the checkout path relies on `SELECT … FOR UPDATE`, conditional
`UPDATE … WHERE` guards, `ON CONFLICT … DO NOTHING` and `COUNT(*) FILTER` —
the constructs that make the concurrency and idempotency guarantees real, and
which `pg-mem` does not implement. Create the scratch database once:

```bash
createdb -h localhost -U autopart_user autopart_test
```

It is pointed at by `TEST_DATABASE_URL` and its schema is dropped and rebuilt on
every run. Without it the suite skips with a warning rather than passing
silently.

## 7. Security notes

- Row Level Security is enabled on every table with **no** policies for `anon`
  or `authenticated`, and their table privileges are revoked. The browser never
  talks to PostgREST; all access goes through the Express API, which connects as
  the database owner. If `VITE_SUPABASE_ANON_KEY` ever leaks, customer orders
  and payments stay unreachable.
- No secret is exposed to the browser. The only `VITE_*` values are the Supabase
  URL and anon key, and the anon client is unused.
- Order tracking uses a 192-bit random token rather than a login. Anyone holding
  the link can see that order, which is why the confirmation page says to keep
  it private. It exposes no internal notes, payment references or order id.
