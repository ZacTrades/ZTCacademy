# Security Implementation Notes

Date: 2026-07-30
Project path: `/Users/yassine/Downloads/mentor-market-flow-main-1`

## What Changed

- Removed local self-confirmation payment paths.
- Removed raw card data collection from checkout UI.
- Moved payment amount/product authority to server-side product lookup.
- Added NOWPayments IPN endpoint with signature verification and idempotency.
- Added payment webhook event storage and unique indexes.
- Added baseline security headers.
- Hardened server env access for payment secrets.
- Added PDF upload size limit and random object names.
- Updated dependency lockfile with safe `npm audit fix` changes.

## Payment State Machine

Expected lifecycle:

- `pending`: checkout was created but provider has not confirmed payment.
- `paid`: provider webhook confirmed expected amount and currency.
- `cancelled` or `expired`: provider reported a terminal non-paid status.

The browser can start checkout, but it cannot mark a payment paid.

## Card-Payment Design

Current safe behavior:

- ZacTrades does not collect card number, expiry, or CVC.
- Card payment requires a hosted external provider URL configured server-side.
- If no card gateway is configured, checkout returns a configuration error instead of granting access.

Required before production card automation:

- Choose the final card provider.
- Add that provider's signed webhook endpoint.
- Verify amount, currency, provider order ID, and expected local checkout reference.
- Store webhook events idempotently before fulfillment.

## Crypto-Payment Design

NOWPayments checkout creates hosted invoices server-side. Payment access is granted only through `/api/nowpayments/ipn` after:

- `x-nowpayments-sig` is present.
- HMAC SHA-512 signature over the sorted JSON body matches `NOWPAYMENTS_IPN_SECRET`.
- Event is inserted uniquely into `payment_webhook_events`.
- Local pending payment record is found by checkout reference.
- Paid status is terminal enough for fulfillment.
- Expected USD amount and currency match the local pending record.

Provider documentation reviewed:

- NOWPayments IPN setup: https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup
- NOWPayments integration guide: https://nowpayments.zendesk.com/hc/en-us/articles/21341613323421-NOWPayments-Integration-Guide

## Database And RLS Changes

Run this migration in Supabase SQL editor:

- `supabase/migrations/202607300001_security_hardening.sql`

It creates:

- `public.payment_webhook_events`
- unique provider checkout indexes for paid-access tables
- revokes for local confirmation functions

The same hardening block was also appended to `supabase/auth-schema.sql` for new database installs.

Important:

- If the unique indexes fail, check for duplicate existing `provider_checkout_id` values and clean/merge those records first.
- Do not re-grant `confirm_local_*` functions to `authenticated`.

## Required Environment Variables

Browser-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`
- `NOWPAYMENTS_IPN_CALLBACK_URL`
- `NOWPAYMENTS_SUCCESS_URL`
- `NOWPAYMENTS_CANCEL_URL`
- `PAYMENT_GATEWAY_PROVIDER`
- `PAYMENT_GATEWAY_API_URL`
- `PAYMENT_GATEWAY_SECRET_KEY`
- Discord secret/role variables if Discord automation is enabled

Never put server-only secrets in `VITE_*` variables.

## Required Manual Actions

1. Rotate the NOWPayments API key and IPN secret that were pasted into chat before production.
2. Add the rotated secrets to Netlify/hosting environment variables, not to git.
3. Configure NOWPayments IPN callback URL to `https://your-domain.com/api/nowpayments/ipn`.
4. Run `supabase/migrations/202607300001_security_hardening.sql` in Supabase.
5. Test a small NOWPayments invoice end-to-end in sandbox or low-value production mode.
6. Confirm paid access changes from `pending` to `paid` only after a valid IPN.
7. Decide whether blog PDFs are public marketing content or private member content.
8. If PDFs are private, move the bucket to private and implement signed URLs.

## Deployment Checklist

- Build passes with `npm run build`.
- Lint has no errors with `npm run lint`.
- Production audit passes with `npm audit --omit=dev`.
- `dist/client` contains no server-only secret names or pasted secret fragments.
- Supabase migration is applied.
- Runtime env contains all required server-only secrets.
- NOWPayments IPN URL is reachable publicly over HTTPS.
- Card checkout is disabled or routed only to a real hosted provider.
- Admin users are reviewed and minimal.
- `.env`, `.env.local`, and generated secret files are not committed.

## Incident Response Basics

If a payment secret leaks:

1. Rotate it in the provider dashboard immediately.
2. Update hosting environment variables.
3. Redeploy.
4. Review `payment_webhook_events` and paid-access tables for suspicious records.
5. Revoke any suspicious Discord roles or paid access manually.
