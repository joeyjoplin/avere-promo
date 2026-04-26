# Avere Promo — Blueprint

**Repository:** `avere-waitlist` (separate from `avere` core product)
**Stack:** Next.js (App Router) · Supabase · Resend · Cloudflare Turnstile · Vercel
**Owner:** [team member name]
**Status:** Phase 1 — go-to-market for the Colosseum Hackathon launch

---

## Purpose

This repository contains the Early Adopter Campaign for Avere — a small Next.js app that captures email signups, generates 200 vouchers ($50 USDC pre-approved at 2% APR, redeemable at official launch), and hands off a single URL to the marketing team to embed in the existing landing page CTA.

This is **not** the Avere product. It does not touch Anchor programs, Turnkey wallets, KYC integration, or the Score Engine. It exists to produce a credible go-to-market signal for the startup competition pitch and to seed a warm list for production launch.

For the core product blueprint, see the `avere` repository's `AVERE_BLUEPRINT.md`.

---

## Why this exists separately

Avere is participating in a startup competition, not just a technical hackathon. Judges expect evidence that the team has thought about distribution, not just product. The early adopter campaign is the smallest piece of credible GTM that can ship alongside the MVP demo: it captures real intent, produces a concrete signal ("N people signed up"), and gives the team a warm list to activate at production launch.

Keeping the campaign in its own repository, with its own Vercel project and its own Supabase project, gives three benefits:

1. **The core product is not affected by campaign iterations.** Marketing copy, form layout, voucher mechanics — all of these can change without touching Anchor program code or risking demo stability.
2. **The marketing designer's interface is one URL.** She does not need access to the core product repo, does not need to know Solana exists, does not need to deal with environment variables or build steps. She receives a final URL, pastes it into the existing landing page CTA, and ships.
3. **Permissions and audit trails stay clean.** Future contributors to the campaign (growth, marketing, ops) can be granted access to this repository without exposure to product code.

The only interface between campaign and product is the demo CTA on the marketing landing page, which links to the Avere app's Vercel deployment. The two systems share nothing else.

---

## What it is — two-CTA flow

The marketing landing page (designed by marketing, lives in a separate marketing site repo or CMS) has two CTAs that drive traffic to two distinct goals:

```
Avere Landing Page (marketing site, not this repo)
│
├─ CTA "Try the demo" → Vercel deployment of the Avere app
│   └─ User explores: signup with passkey, KYC sandbox flow,
│       deposit, loan, score progression. Sandbox data is ephemeral.
│       (KYC sandbox integration in the demo is part of the Avere
│       core product roadmap, not this repo.)
│
└─ CTA "Reserve your $50 voucher (first 200 only)" → THIS APP
    └─ Email-only form, US-residency checkbox, Turnstile challenge
        └─ Trigger generates voucher_code if position ≤ 200
            └─ Email confirms voucher (or waitlist position if > 200)
```

The two flows are intentionally separate. **The demo demonstrates the product.** **The waitlist captures intent.** Mixing them — for example, requiring KYC sandbox completion to receive a voucher — would conflate testing with conversion and would create the regulatory problem of collecting real PII through a sandbox environment.

The campaign is **independent of demo state**: it can ship and start collecting signups even if the demo has not yet integrated KYC or other features.

---

## Why Sumsub Sandbox is not used in this app

Sumsub Sandbox is built for development and testing, not for capturing real identity data. Using sandbox to collect real documents from real users in exchange for real value (the voucher) creates three problems:

1. Sandbox approvals are not legally valid for production KYC, so the user would have to redo KYC at launch
2. Sandbox data lifecycle is controlled by Sumsub, not by Avere — retention and deletion guarantees are weak
3. It likely violates Sumsub's sandbox terms of use

In the waitlist, no KYC happens. The user submits an email, receives a voucher code, and is told that actual KYC will run at launch with Sumsub production. That is when the voucher is redeemed for the $50 pre-approved loan.

---

## Voucher mechanics

| Property | Value |
|---|---|
| Total vouchers | 200 (first-come, first-served) |
| Geographic eligibility | US residents only · enforced at launch via KYC, signaled at signup via checkbox |
| Loan amount | $50 USDC pre-approved |
| Subsidized rate | 2% APR (vs. tier-based rate, typically 10–14%) |
| Term | 3 months (recommended; final TBD at launch) |
| Identity binding | Email-bound — voucher only valid when user passes KYC at launch with the same email used to claim |
| Redemption window | 90 days from official product launch (i.e. when the production Avere app is legally live and accepting real KYC) — not 90 days from any earlier announcement |

The 2% rate is below Avere's cost of capital and is a deliberate marketing investment. With 200 vouchers × $50 × 2% × 0.25 yr ≈ $5 in interest forgone per voucher, the entire campaign costs at most a few hundred dollars in subsidized rate vs. the brand value of 200 verified early users.

---

## US-only enforcement — two layers

The product is launching in the US under a Florida Consumer Finance License. Waitlist eligibility must reflect that scope, but does not require expensive verification at signup.

**Layer 1 — Self-attestation at signup.** The waitlist form includes a required checkbox:

> *"I confirm I am a US resident. I understand this voucher is redeemable only by US residents at official launch, verified via KYC."*

The form will not submit without it. The checkbox creates a clear legal record of the user's representation.

**Layer 2 — Hard verification at launch.** When the user attempts to redeem the voucher in the production app, Sumsub KYC verifies country of residence as part of standard identity verification. Non-US residents cannot redeem — the voucher becomes inactive.

**No IP geolocation.** False positives (US residents traveling, expats using VPN, dual-residence cases) are real and create more friction than they prevent. Self-attestation + KYC verification at redemption is the standard approach for early access campaigns and is sufficient.

The legal text appears in three places: the checkbox label on the form, the footer of the form, and the confirmation email when the voucher is sent. Wording is consistent across all three.

---

## Architecture — Next.js minimal app on Vercel

```
avere-waitlist/                          # this repo
├── app/
│   ├── page.tsx                         # the form (server component + client form)
│   ├── api/
│   │   └── waitlist/route.ts            # POST handler: validates → inserts → sends email
│   ├── confirmation/page.tsx            # post-submit screen showing voucher or waitlist position
│   └── layout.tsx
├── lib/
│   ├── supabase.ts                      # service-role client (server-only)
│   ├── email.ts                         # Resend client + voucher template
│   └── turnstile.ts                     # Turnstile token validation
├── .env.local                           # see Environment Variables section
└── package.json
```

### Why Next.js

- Server-side validation of the checkbox and bot challenge before any DB write
- API route keeps the Supabase service-role key off the client (the public form never holds DB credentials)
- Same deployment target the team already uses (Vercel) — zero new ops surface to learn
- Easy to iterate copy and styling without touching infrastructure

### Vercel project setup

This app is deployed to a **separate Vercel project** from the Avere core product, connected to a separate Git repository. The trade-off vs. a shared deployment is documented in the parent product blueprint; the short version is that separation costs an extra hour of setup and saves significant audit-trail and access-control complexity.

URL strategy: subdomain (`waitlist.avere.finance`) preferred over subpath. Subdomain is stable regardless of how the marketing site or core product evolve their routing.

---

## Supabase schema

```sql
create table waitlist (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  position        int generated always as identity,
  voucher_code    text unique,
  has_voucher     boolean not null default false,
  redeemed_at     timestamp,                       -- set at launch when voucher is used
  email_sent_at   timestamp,                       -- set when Resend confirms delivery
  created_at      timestamp not null default now()
);

-- Trigger: assign voucher to first 200 entries at insert time
create function assign_voucher() returns trigger as $$
begin
  if new.position <= 200 then
    new.voucher_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    new.has_voucher := true;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger waitlist_voucher_assign
  before insert on waitlist
  for each row execute function assign_voucher();
```

The voucher code is an 8-character alphanumeric (e.g., `A3F7K2P9`). Short enough to type, long enough to avoid collision in 200 entries. `position` is auto-incremented atomically by Postgres — no race condition possible.

**Row Level Security:** anonymous role has zero access. Only the `service_role` key (server-only, never exposed to the client) can insert or read. The Next.js API route uses the service-role client; the public form never talks to Supabase directly.

---

## Insert + email flow — order matters

The API route at `app/api/waitlist/route.ts` follows a strict order. **Do not reorder these steps.**

```
1. Receive POST { email, residency_confirmed, turnstile_token }
2. Validate residency_confirmed === true → if false, return 400
3. Validate Turnstile token via cloudflare API → if invalid, return 400
4. Validate email format → if invalid, return 400
5. INSERT into waitlist (email)
   ↓ Trigger runs, returns the row including voucher_code (or null)
6. Read back voucher_code and position from the inserted row
7. Send email via Resend with the voucher_code (or waitlist position message)
8. On Resend success: UPDATE waitlist SET email_sent_at = now() WHERE id = inserted.id
9. Return 200 with { has_voucher, voucher_code or null, position }
```

### Why this order, and why the email is last

The principle: **never send a transactional email for a record that does not exist in the database.** If you reverse the order — send email first, then insert — and the insert fails, the user has a voucher code in their inbox that does not exist in the system, and you have no way to validate it at launch. By inserting first, the database is the source of truth.

If the insert succeeds and the email send fails, the situation is recoverable: the row exists with `email_sent_at = null`, which is a queryable state. An admin can identify all rows where `has_voucher = true AND email_sent_at IS NULL` and trigger manual resends. The user has a valid voucher in the system; they just have not been notified yet.

If the insert succeeds and the email send succeeds, `email_sent_at` is set. This becomes the audit trail for "voucher was delivered" — useful at launch when validating redemption attempts.

### Failure modes and what to do

| Failure | What happens | What admin does |
|---|---|---|
| Validation fails (residency unchecked, Turnstile invalid, email malformed) | API returns 4xx, no DB write | Nothing — user retries |
| Supabase insert fails (DB down, unique constraint on email) | API returns 5xx, no email sent | If unique constraint: tell user "email already registered". Otherwise retry |
| Resend fails after successful insert | Row exists with `email_sent_at = null` | Run manual resend from admin script (query rows with null `email_sent_at`, send each) |
| Turnstile API down | API returns 503, no DB write | Wait for Turnstile to recover; user retries |

Bot protection is enforced **before** the database write, not after. A failed Turnstile validation should never result in a row in the database, even temporarily.

---

## Environment variables

```
# Supabase (separate project from core Avere — see core blueprint for that)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service-role key, server-only, never expose>

# Resend
RESEND_API_KEY=re_<...>
RESEND_FROM_ADDRESS="Avere <hello@avere.finance>"   # must match a verified domain in Resend

# Cloudflare Turnstile
TURNSTILE_SITE_KEY=<public, used by client widget>
TURNSTILE_SECRET_KEY=<server-only, used to validate token>

# Domain configuration
WAITLIST_PUBLIC_URL=https://waitlist.avere.finance
```

The `SUPABASE_SERVICE_KEY` and `TURNSTILE_SECRET_KEY` are **server-only**. They are never exposed in client bundles or in the browser. The Next.js convention is straightforward: any variable not prefixed with `NEXT_PUBLIC_` is server-only, and the API route runs server-side. Do not import these in client components.

---

## Implementation sequence — what ships in the hackathon

In order, with rough effort estimates:

1. **Resend domain setup** (30 min active + 24–48h DNS propagation) — add the campaign domain to Resend, configure SPF, DKIM, and DMARC records, send a test transactional email. **Start this first** because of the propagation delay; everything else can happen in parallel.

2. **Supabase project** (1 hour) — create a new Supabase project (separate from any future core product Supabase). Run the `waitlist` table migration above. Configure RLS so only the service role can insert. Test the trigger by inserting a row manually via the SQL editor.

3. **Cloudflare Turnstile** (30 min) — register the campaign domain, get site key and secret, paste into env vars.

4. **Next.js app** (3–4 hours) — single-page form with email input, US-residency checkbox, Turnstile widget, submit button. API route validates server-side, runs the insert + email flow above, returns voucher code or waitlist position. Confirmation page renders the result. Use a simple design — Tailwind defaults are fine; the marketing landing handles visual identity.

5. **Vercel deployment** (30 min) — create new Vercel project, connect to the `avere-waitlist` repo, set environment variables, deploy. Configure the subdomain (`waitlist.avere.finance`) via DNS.

6. **Marketing handoff** (15 min) — send the designer the final URL. She updates the existing landing page CTA to point to it. Done.

7. **Soft launch test** (1 hour) — submit 5–10 real signups from team members and friends to validate the full pipeline (form → Turnstile → Supabase → Resend → voucher in inbox). Do not start any paid promotion or social media announcement until this passes end-to-end.

**Total: ~6–8 hours of engineering work, plus the DNS propagation wait.** Assuming the team starts step 1 (Resend DNS) on day 1 of the campaign sprint, everything else fits comfortably alongside core product work.

---

## Marketing handoff — what the designer needs

The interface is one URL. The designer does not need anything else.

```
URL to paste into the existing CTA button: https://waitlist.avere.finance
```

She does not need:
- Access to this repository
- Access to the Vercel project
- Access to Supabase or Resend
- Knowledge of how the form is implemented
- Coordination with engineering for normal copy or design changes

She **does** need to know:
- The CTA copy should match the campaign promise: "Reserve your $50 voucher" or "Get early access" or similar
- The subtitle/body should mention "first 200 only" to convey scarcity
- Any visual treatment, animations, or hero copy on the landing page is her domain — she does not need engineering input

If the form itself needs design changes (layout, colors, typography), engineering will iterate with her on this repo's `app/page.tsx`. The form intentionally uses minimal design; the landing page does the visual heavy lifting.

---

## Risks and mitigations

1. **Email-only verification is weak against bots.** Mitigation: Cloudflare Turnstile on the form. Token validated server-side before DB write. Blocks 99% of automated signups at zero cost to legitimate users (no captcha popup in the normal case).

2. **Email deliverability for the voucher message.** Cold campaign domain, no sender reputation. Mitigation: SPF, DKIM, DMARC configured at least 48 hours before the campaign launches. Use Resend (has good shared IP reputation) — never a generic SMTP.

3. **Voucher code disclosure.** A user could share their code with someone else after receiving the email. Mitigation: code is bound to email at redemption — the launch app validates that the email used to claim matches the email going through KYC. Sharing the code without the email is harmless.

4. **Campaign exhaustion timing.** If the 200 fill in 6 hours, the social proof story is "viral demand". If they take 6 weeks, it is "tepid response". Mitigation: launch the campaign late enough in the hackathon timeline to have a story to tell, but early enough to actually fill. Two weeks before pitch is the sweet spot.

5. **Resend failure stranding users.** Possible failure mode where the row is inserted but the email never sends. Mitigation: `email_sent_at` field on the table is the queryable signal. Admin script queries `WHERE has_voucher = true AND email_sent_at IS NULL` periodically and resends.

6. **Race condition on the 200th voucher.** Theoretically possible if many submissions arrive in the same millisecond. Mitigation: Postgres `generated always as identity` is atomic per row. The trigger reads `new.position` after assignment, so two concurrent inserts cannot both get position 200. This is a Postgres guarantee, not a manual check.

---

## What this enables for the pitch

A line in the GTM slide that no other team will have:

> *"In two weeks of soft-launch, we captured 200 verified email signups across 4 channels with zero paid acquisition — the entire $50 voucher allocation was claimed."*

Even if numbers are softer ("180 signups, 60% from organic Twitter, average time-to-claim 3 days"), the data is real and the methodology is defensible. Most hackathon teams arrive at the pitch with zero evidence of demand. Avere arrives with a list.

---

*Avere Promo Blueprint — v1 (campaign extracted from core blueprint v20 on creation of the avere-waitlist repository · separate Git repo, separate Vercel project, separate Supabase project, separate from core product entirely)*
