# Netlify Deployment Checklist

## Build settings

- Build command: `npm run build`
- Publish directory: `dist/client`
- Node version: `22`

These are already configured in `netlify.toml`.

## Required Supabase migrations

Run all pending migrations before using the production site. The latest deployment-critical ones are:

- `202609180001_live_trading_access_extensions.sql`
- `202609180002_storage_upload_type_hardening.sql`
- `202609180003_remove_legacy_blog_pdf_surface.sql`

## Required Netlify environment variables

Set these in Netlify under Site configuration -> Environment variables.

### Supabase

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Payzone

- `PAYZONE_MERCHANT_ACCOUNT`
- `PAYZONE_PAYWALL_SECRET_KEY`
- `PAYZONE_NOTIFICATION_KEY`
- `PAYZONE_PAYWALL_URL`
- `PAYZONE_CURRENCY`
- `PAYZONE_CUSTOMER_COUNTRY`
- `PAYZONE_CUSTOMER_LOCALE`
- `PAYZONE_SKIN`
- `PAYZONE_CALLBACK_URL`
- `PAYZONE_SUCCESS_URL`
- `PAYZONE_FAILURE_URL`
- `PAYZONE_CANCEL_URL`
- `PAYZONE_PAYMENT_METHOD`
- `PAYZONE_FORCE_DEEP_LINK`

Production URLs should use your real domain:

- `PAYZONE_CALLBACK_URL=https://your-domain.com/api/payzone/callback`
- `PAYZONE_SUCCESS_URL=https://your-domain.com/payment/success`
- `PAYZONE_FAILURE_URL=https://your-domain.com/payment/failure`
- `PAYZONE_CANCEL_URL=https://your-domain.com/payment/cancel`

### NOWPayments, if crypto checkout stays enabled

- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`
- `NOWPAYMENTS_IPN_CALLBACK_URL`
- `NOWPAYMENTS_SUCCESS_URL`
- `NOWPAYMENTS_CANCEL_URL`

### Discord

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `DISCORD_MENTORSHIP_ROLE_ID`
- `DISCORD_ONE_TO_ONE_ROLE_ID`
- `DISCORD_GROUP_ROLE_ID`
- `DISCORD_LIVE_TRADING_ROLE_ID`
- `DISCORD_NEWS_ROLE_ID`
- `DISCORD_REMOVE_EXPIRED_MEMBERS`
- `DISCORD_ALLOW_PENDING_ACCESS`
- `DISCORD_CRON_SECRET`

Production values:

- `DISCORD_REDIRECT_URI=https://your-domain.com/discord/callback`
- `DISCORD_ALLOW_PENDING_ACCESS=false`

## Production endpoints to configure externally

### Payzone callback

Use:

```txt
https://your-domain.com/api/payzone/callback
```

### NOWPayments IPN callback

Use:

```txt
https://your-domain.com/api/nowpayments/ipn
```

### Discord expiry and role reconciliation

This is handled by the Netlify Scheduled Function:

```txt
netlify/functions/discord-access-sync.mjs
```

It runs every 10 minutes and calls this protected endpoint:

```txt
https://your-domain.com/api/discord/expire
```

This expires old access by date and also expires site access when you manually remove a paid role in Discord.

No external cron service is required.

## Final local verification

Before pushing/deploying:

```bash
env NETLIFY=true npm run build
```

The build should write:

```txt
.netlify/v1/functions/server.mjs
```
