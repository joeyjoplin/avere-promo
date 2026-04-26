# avere-waitlist

Early Adopter Campaign for Avere — a Next.js app that captures email signups, generates 200 vouchers ($50 USDC pre-approved loan at 2% APR, redeemable at official launch), and hands off a single URL to the marketing team.

This is **not** the Avere core product. It does not touch Anchor programs, wallets, or KYC integration. See `AVERE_PROMO_BLUEPRINT.md` for the full spec and `CLAUDE.md` for the coding rules and hard constraints.

## Stack

- Next.js 16 (App Router) · TypeScript · Tailwind v4
- Supabase (Postgres, service-role only)
- Resend (transactional email)
- Cloudflare Turnstile (bot protection)
- Vercel (hosting)

## Local development

1. Clone, `cd` in, `npm install`.
2. Create `.env.local` with the 7 env vars listed in `Environment` below.
3. Run the Supabase migration in the project's SQL editor (see `AVERE_PROMO_BLUEPRINT.md`, "Supabase schema" section). Confirm RLS is enabled with zero policies.
4. `npm run dev` → http://localhost:3000.

End-to-end smoke test:
- Submit the form with a real email
- Confirm a row lands in `waitlist` (Supabase Table Editor)
- Confirm a voucher email arrives in the inbox
- Confirm the redirect to `/confirmation?voucher_code=...` shows the code

## Environment

`.env.local` (gitignored — never commit):

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=
RESEND_FROM_ADDRESS=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
WAITLIST_PUBLIC_URL=
```

Same values configured in Vercel project settings.

## Architecture

```
app/
├── page.tsx                          # form (server component)
├── _components/waitlist-form.tsx     # form internals (client)
├── api/waitlist/route.ts             # POST handler — strict order
├── confirmation/page.tsx             # post-submit screen
└── layout.tsx                        # metadata + fonts
lib/
├── supabase.ts                       # service-role client
├── turnstile.ts                      # token validator
├── email.ts                          # Resend client + voucher/waitlist templates
└── copy.ts                           # canonical disclaimer string (single source of truth)
```

The API route enforces this order on every submission:

```
residency_confirmed → Turnstile → email format → INSERT → email send → UPDATE email_sent_at
```

Insert always precedes email send. If the email send fails after a successful insert, the row remains with `email_sent_at = NULL` for admin replay — the user is never notified of a voucher that doesn't exist in the database.

## Hard rules

See `CLAUDE.md` for the full list. Highlights:

- No imports from the `avere` core product. No Solana / wallet code.
- Service-role keys are server-only (no `NEXT_PUBLIC_` prefix on Supabase or Turnstile secret).
- The US-residency disclaimer text is single-sourced in `lib/copy.ts` and appears identically in the checkbox label, form footer, and voucher email. Edit there or not at all.
- No PII beyond email. No KYC. No IP geolocation gating.

## Ops

Recovery path for failed email sends after successful insert:

```sql
select id, email, voucher_code, has_voucher
from waitlist
where email_sent_at is null
order by created_at;
```

Replay each manually via the Resend API or a small script that imports `lib/email.ts`.

## Status

Phase 1 — go-to-market for the Colosseum Hackathon launch. See `tasks.md` for current progress.
