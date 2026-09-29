# GetSetGrades — Production Deployment Guide

This document explains exactly how to take GetSetGrades from the local sandbox
to a production deployment on Vercel + PostgreSQL + Resend + PayPal Payment Link reconciliation. **Do not deploy on SQLite, in-memory rate limiting, or the dev
`getsetgrades.example` placeholder URL.**

---

## 1. Local development (already configured)

The repository ships with a working local-dev setup:

- **Database:** PostgreSQL, always — there is no SQLite fallback. Point
  `DATABASE_URL` at a real Postgres instance (a free Neon or Supabase
  branch works fine for local dev) and run `bunx prisma migrate deploy`
  to apply the committed migration in `prisma/migrations/`.
- **Email:** If `EMAIL_PROVIDER_API_KEY` / `EMAIL_FROM` are unset, the
  email helper gracefully no-ops. DB submissions still succeed.
- **AI:** If `GROQ_API_KEY` is unset, `/api/ai-chat` returns `503`.
- **Rate limiting:** In-memory per-process. Fine for one dev server.
- **Site URL:** Falls back to `https://getsetgrades.example` (clearly logged).

---

## 2. Production prerequisites

Before deploying, you MUST have:

1. **A PostgreSQL database.** Recommended managed providers:
   - **Supabase** (free tier works for launch)
   - **Neon** (serverless Postgres, generous free tier)
   - **Railway** / **Vercel Postgres**

2. **A Resend account** with a **verified sender domain** (or a verified
   single address on the free plan). `EMAIL_FROM` MUST be an address
   Resend has authorized, or sends will fail.

3. **PayPal Payment Link**:
   - The application is configured with this public Payment Link:
     `https://www.paypal.com/ncp/payment/K79KML66T654L`
   - PayPal payment confirmation is reconciled manually in `/admin`.
   - Do **not** configure `/api/payment/webhook` as if it were a PayPal webhook.
   - After confirming a transaction in PayPal, enter the PayPal transaction ID and paid amount in the admin dashboard.

4. **A Groq API key** (optional — only if you keep the AI section on the
   homepage). Get one at https://console.groq.com.

5. **An Upstash Redis REST instance** (recommended) so rate limiting is
   distributed across all Vercel instances. Get one at https://upstash.com.
   If you skip this, rate limiting stays per-instance (less effective but
   the site still runs).

6. **Your canonical production URL**, e.g. `https://your-domain.example`. Set as
   `NEXT_PUBLIC_SITE_URL`.

---

## 3. Database: already switched to PostgreSQL

`prisma/schema.prisma` already has `provider = "postgresql"`, and the
initial migration is already committed at
`prisma/migrations/20260929000000_init/`. You do **not** need to run
`prisma migrate dev --name init` — just point `DATABASE_URL` at a real
database and deploy the migration that's already there.

> **One thing worth knowing:** that migration's SQL was hand-written to
> match Prisma's own generation conventions field-for-field against this
> schema (table/column/constraint names, types, defaults, indexes) — it
> was **not** produced by actually running `prisma migrate dev`, because
> doing so requires Prisma's schema-engine binary, which is fetched from
> `binaries.prisma.sh` and wasn't reachable in the sandbox this was built
> in. It should apply cleanly, but the cheap way to be 100% sure before
> your first production deploy is to run this once you have a real
> `DATABASE_URL` (local Postgres, or a free Neon/Supabase branch — even a
> throwaway one):
>
> ```bash
> bunx prisma migrate diff \
>   --from-migrations ./prisma/migrations \
>   --to-schema-datamodel ./prisma/schema.prisma \
>   --shadow-database-url "$DATABASE_URL" \
>   --script
> ```
>
> An empty/no-op result confirms the migration is exact. If it prints
> anything, review it — for a schema this simple (four flat tables, no
> relations, no enums) a difference would be unusual, but check before
> trusting it against real data.

### Step 3a — Set `DATABASE_URL` to your Postgres connection string

```bash
# .env (local) or Vercel project settings (production)
DATABASE_URL="postgresql://user:password@host:5432/getsetgrades?sslmode=require"
```

### Step 3b — Generate the client and apply the migration

```bash
bun install
bun run db:generate            # prisma generate
bunx prisma migrate deploy     # applies prisma/migrations/20260929000000_init
```

### Step 3c — On Vercel, run migrations on deploy

Add a `postbuild` script (or use Vercel's "Build Command" override):

```bash
bunx prisma migrate deploy && bun run build
```

`prisma migrate deploy` applies pending migrations non-interactively —
safe for CI/CD. **Never use `prisma db push --accept-data-loss` in
production.**

### If you add or change a model later

Once you have real Postgres access, generate new migrations the normal
way — `bunx prisma migrate dev --name <what_changed>` — and commit the
new folder it creates under `prisma/migrations/`. Don't hand-edit
`migration.sql` files after they've been applied anywhere.

---

## 4. Environment variables (Vercel → Project → Settings → Environment Variables)

Copy from `.env.example` and fill in real values. Set them for
**Production**, **Preview**, and **Development** as appropriate.

### Public (safe to expose to the browser)
- `NEXT_PUBLIC_SITE_URL` — your canonical production URL (no trailing slash)
- `NEXT_PUBLIC_PAYMENT_LINK` — PayPal Payment Link
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — display-only WhatsApp number

### Server-only secrets (NEVER prefix with `NEXT_PUBLIC_`)
- `DATABASE_URL` — Postgres connection string
- `EMAIL_PROVIDER_API_KEY` — Resend API key (`re_...`)
- `EMAIL_FROM` — `GetSetGrades <hello@your-domain.com>` (must be authorized by Resend)
- `EMAIL_TO` — `heygetsetgrades@zohomail.in` (where notification emails are sent)
- `ADMIN_PASSWORD` — server-only password for `/admin`
- `ADMIN_SESSION_SECRET` — server-only random secret (at least 32 characters)
- `GROQ_API_KEY` — Groq API key (omit to disable AI)
- `RATE_LIMIT_REDIS_URL` — Upstash Redis REST URL
- `RATE_LIMIT_REDIS_TOKEN` — Upstash Redis REST token
- `IP_HASH_SALT` — random string for IP hashing (optional; has a default)

---

## 5. Build commands

The repo already has:

```bash
bun run lint        # ESLint
bun run db:generate # prisma generate
bun run build       # next build
```

Add a typecheck before build:

```bash
bunx tsc --noEmit
```

Vercel build command (recommended):

```bash
bun install && bunx prisma generate && bunx prisma migrate deploy && bun run build
```

---

## 6. Post-deploy verification

1. Visit the site. Confirm the hero loads with the liquid-glass session
   panel and no horizontal scroll on mobile (320px, 375px, 390px, 430px).
2. Submit the contact form. Confirm a `ContactMessage` row appears in
   Postgres and (if Resend is configured) a notification email lands in
   `heygetsetgrades@zohomail.in`.
3. Open the booking dialog, complete steps 1–5, and confirm:
   - The booking row is created with `status: "pending"` then
     `pending_payment` after the user clicks "Continue to secure payment".
   - The hosted checkout URL opens in a new tab.
   - **DO NOT** see a "Payment successful" message before verification.
   - The PayPal payment page opens in a new tab.
4. Sign in at `/admin`, locate the booking, verify the payment in PayPal,
   then record the PayPal transaction ID and amount. The booking should
   become `status: "paid"` and `paymentStatus: "paid"`.
5. Check `/sitemap.xml` and `/robots.txt` — both must reference your real
   production URL, not `getsetgrades.example`.
6. Check the browser's network tab on the homepage: the CSP header should
   be present and no third-party scripts should load.

---

## 7. Things this repository intentionally does NOT do

- **No SQLite in production.** The schema comment marks the dev/prod
  switch clearly. Vercel's ephemeral filesystem would lose SQLite data on
  every cold start.
- **No in-memory rate limiting as the production default.** Set
  `RATE_LIMIT_REDIS_URL` + `RATE_LIMIT_REDIS_TOKEN` for distributed
  limiting across all Vercel instances.
- **No fake testimonials / student counts / success rates.** The site
  shows only what is real.
- **No automatic payment confirmation.** PayPal Payment Link payments stay
  unverified until an authenticated admin manually reconciles the PayPal transaction.
- **No raw IP storage.** IPs are salted-hashed before persistence; only
  the first octet is logged.
- **No PII in logs.** Names, emails, WhatsApp numbers, messages,
  descriptions, AI prompts/responses, and payment data are never logged.
- **No `dangerouslySetInnerHTML` on user content.** React escaping stays
  on. AI replies render through a minimal, allow-listed markdown
  subset (paragraphs + bullet lists only).

---

## 8. Rollback

If a deploy misbehaves:

1. Roll back in Vercel (one click on the previous deployment).
2. The Postgres migrations are forward-only. To roll back a migration,
   write a new `--down` migration; do NOT run `prisma migrate reset` on
   production (it drops data).
3. Disable the AI section by unsetting `GROQ_API_KEY` — `/api/ai-chat`
   will return `503` and the UI gracefully shows the "AI is not
   configured" state.
