# Security Audit

Date: 2026-07-30
Project path: `/Users/yassine/Downloads/mentor-market-flow-main-1`

## Architecture Discovered

ZacTrades is a React/TanStack Start application using Supabase Auth, Supabase Postgres/RLS, browser route components, TanStack server functions, and a Cloudflare-style server entry in `src/server.ts`.

Primary trust boundaries:

- Browser/UI data is untrusted, including plan names, prices, package duration, user IDs, phone numbers, and payment method selections.
- Supabase Auth access tokens identify users, but authorization still depends on RLS or server-side checks.
- Supabase service-role access is server-only and bypasses RLS.
- Payment status must come from a provider-hosted checkout plus verified server-to-server webhook.
- Admin UI is a convenience layer; high-risk state changes should be backed by RLS, service functions, and audit records.

## Critical Findings

### SEC-001: Local paid-access confirmation allowed authenticated self-fulfillment

Severity: Critical

Affected areas:

- `supabase/auth-schema.sql` local `confirm_local_*` functions
- `src/lib/payment-server.ts` checkout fallback logic

Risk:

Authenticated users could receive paid access without a trusted payment provider confirmation.

Fix status: Fixed in code and SQL migration.

Implemented remediation:

- Removed local-paid fallback behavior from checkout server functions.
- Checkout records now remain `pending` until a trusted provider flow is configured and, for NOWPayments, a verified IPN marks payment paid.
- Added SQL revokes for local confirmation functions from `public`, `anon`, and `authenticated`.

Verification:

- `rg` check found no remaining `local_paid` or frontend payment-reference confirmation path in checkout/payment files.
- `npm run build` passed.

### SEC-002: Raw card data was collected in React state/DOM

Severity: Critical

Affected area:

- `src/components/site/CheckoutDialog.tsx`

Risk:

Collecting PAN, expiry, and CVC in the app would expand PCI DSS scope and create browser-side leakage risk.

Fix status: Fixed.

Implemented remediation:

- Removed card number, expiry, and CVC inputs.
- Card checkout now instructs users that card details are entered only on the connected hosted payment provider page.
- The app no longer stores or submits card PAN/CVC values.

Verification:

- `rg` check found no old `setCard`, `setCvc`, `Card number`, or raw CVC input paths.
- `npm run build` passed.

## High-Priority Findings

### SEC-003: Checkout trusted browser-supplied prices and product labels

Severity: High

Risk:

A modified request could underpay or request a different entitlement than the displayed checkout card.

Fix status: Fixed for application checkout initiation.

Implemented remediation:

- Server functions now accept only product identifiers such as package/plan slugs.
- Authoritative pricing and duration are looked up server-side from Supabase tables or server constants.
- Browser-supplied labels and amounts are no longer used as payment authority.

Verification:

- Checkout server functions resolve live trading and mentorship products server-side before creating payment records.
- `npm run build` passed.

### SEC-004: Missing payment webhook verification and idempotency

Severity: High

Risk:

Payments could not be securely confirmed from provider events, and duplicate webhook delivery could cause inconsistent fulfillment.

Fix status: Partially fixed.

Implemented remediation:

- Added `/api/nowpayments/ipn` route.
- Added HMAC SHA-512 signature verification for NOWPayments IPN events.
- Added `payment_webhook_events` table with unique provider/event IDs for idempotency.
- Validates amount and USD currency before marking access paid.
- Duplicate IPNs return safely without duplicate fulfillment.

Remaining work:

- A dedicated card-provider webhook still needs to be implemented once the real card provider is chosen.

Verification:

- `npm run build` passed.
- `npm run lint` passed with warnings only.

## Medium Findings

### SEC-005: Server env helper could read non-VITE keys from `import.meta.env`

Severity: Medium

Fix status: Fixed in `src/lib/payment-server.ts`.

Implemented remediation:

- Server env lookup now limits `import.meta.env` fallback to `VITE_*` keys only.
- Server-only values must come from runtime/deployment secrets.

Verification:

- Built frontend assets scanned clean for server-only secret names and previously pasted secret fragments.

### SEC-006: Blog PDF bucket is public

Severity: Medium

Fix status: Open.

Risk:

Logged-in UI gating does not protect direct public PDF URLs if a URL is shared.

Recommended next remediation:

- Move `blog-pdfs` to a private bucket.
- Generate short-lived signed URLs from a server function after checking the user session.

### SEC-007: PDF upload validation had no size limit and predictable names

Severity: Medium

Fix status: Partially fixed.

Implemented remediation:

- Added a 10 MB PDF upload limit.
- Changed generated PDF object names to use `crypto.randomUUID()`.

Remaining work:

- Add server-side PDF validation/scanning if PDFs become sensitive or user-uploaded beyond admins.

### SEC-008: High-risk admin state changes still occur from browser client

Severity: Medium

Fix status: Open.

Risk:

RLS protects access, but browser-origin admin actions are easier to abuse after admin session compromise.

Recommended remediation:

- Move payment/manual entitlement changes to audited server functions.
- Add reason fields and optional MFA/step-up for sensitive admin actions.

### SEC-009: Security headers were missing

Severity: Medium

Fix status: Fixed.

Implemented remediation:

- Added baseline security headers in `src/server.ts`, including CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.

Verification:

- `npm run build` passed.

## Dependency Audit

Initial audit found high-severity advisories in production dependencies. Safe fixes were applied with `npm audit fix`.

Final result:

- `npm audit --omit=dev`: `found 0 vulnerabilities`

## Final Verification

Commands executed:

- `npm run build`: passed.
- `npm run lint`: passed with 6 Fast Refresh warnings in existing reusable UI component files.
- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- Frontend bundle secret scan: no matches for server-only secret names or previously pasted secret fragments in `dist/client`.

## Remaining Risks

- Card-provider webhook is still provider-dependent and must be added before card payments can be fully automated.
- Blog PDF files remain public by direct URL until the bucket is made private and signed URLs are implemented.
- Existing real NOWPayments secrets were pasted into chat and should be rotated before production.
- Admin payment/role actions should eventually be moved to audited server-side functions.
