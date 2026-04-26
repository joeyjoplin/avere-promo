# avere-waitlist — Tasks

Work tracker for shipping the Early Adopter Campaign. Order matters where noted; everything else can be parallelized.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase 0 — Prerequisites (start day 1, blocks launch)

- [x] **0.1 Resend domain setup** — Resend auto-published SPF/DKIM/MX in GoDaddy. DMARC already present (GoDaddy default: `p=quarantine`, rua → `dmarc_rua@onsecureserver.net`). `RESEND_API_KEY` created. Test curl email landed in Gmail Inbox from `Avere <contato@avere.finance>` — DMARC PASS implied by inbox placement under `p=quarantine`.
- [x] **0.2 Decide sender address** — `RESEND_FROM_ADDRESS="Avere <contato@avere.finance>"`. Real mailbox, so user replies are reachable.
- [x] **0.3 Reserve subdomain** — `waitlist.avere.finance` planned. GoDaddy registrar access confirmed; final DNS cutover happens in Phase 5 once Vercel provides CNAME target.

---

## Phase 1 — Supabase

- [x] **1.1 Create new Supabase project** — `avere-waitlist`, US East region, free tier.
- [x] **1.2 Run `waitlist` migration** — table + `assign_voucher()` function + `before insert` trigger created via SQL Editor.
- [x] **1.3 Configure RLS** — RLS enabled, zero policies. Verified via `pg_class.relrowsecurity = true` and `pg_policies` count = 0.
- [x] **1.4 Manual trigger test** — confirmed: positions 1–4 + 200 get voucher; position 201 does not; duplicate email rejected by unique constraint; table cleaned + sequence reset to 1.
- [x] **1.5 Capture env vars** — `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (service-role, server-only) saved.

---

## Phase 2 — Cloudflare Turnstile

- [x] **2.1 Register campaign domain** in Cloudflare Turnstile — widget `avere-waitlist`, hostnames `waitlist.avere.finance` + `localhost`, mode Managed.
- [x] **2.2 Capture keys** — `TURNSTILE_SITE_KEY` (public) + `TURNSTILE_SECRET_KEY` (server-only) saved in password manager.

---

## Phase 3 — Next.js app

Build order: lib helpers → API route → form → confirmation page.

### 3.1 Project bootstrap
- [x] Next.js 16 App Router + TypeScript + Tailwind v4 scaffolded at root, runtime deps (`@supabase/supabase-js`, `resend`) installed.
- [x] `.env.local` populated with all 7 vars; `.gitignore` blocks all `.env*` files.

### 3.2 `lib/supabase.ts`
- [x] Service-role client, server-only, fail-fast on missing env vars.

### 3.3 `lib/turnstile.ts`
- [x] `validateTurnstile(token, remoteIp?)`: returns false on rejected token (caller → 400), throws on network/HTTP failure (caller → 503).

### 3.4 `lib/email.ts` + `lib/copy.ts`
- [x] `lib/copy.ts` exports canonical `US_RESIDENCY_DISCLAIMER` (single source of truth, imported by form + email).
- [x] `sendVoucherEmail` (subject: "Your $50 Avere voucher is reserved") and `sendWaitlistEmail` (subject: "You're #N on the Avere waitlist") with plain text + HTML; both throw on Resend error.

### 3.5 `app/api/waitlist/route.ts` (POST)
- [x] Strict order enforced: residency → Turnstile → email format → INSERT (with `.select()` for read-back) → email send → UPDATE `email_sent_at`.
- [x] Failure mapping: 400 (validation), 409 (duplicate email, Postgres `23505`), 500 (other DB), 503 (Turnstile API down), 200 (insert ok + email failed — row recoverable).
- [x] Email normalization: `.trim().toLowerCase()` before insert.
- [x] IP forwarded to Turnstile via `x-forwarded-for`.

### 3.6 `app/page.tsx` + `app/_components/waitlist-form.tsx`
- [x] Server `page.tsx` reads `TURNSTILE_SITE_KEY` and passes to client `WaitlistForm` as prop (avoids needing `NEXT_PUBLIC_` duplicate).
- [x] Form: email input, residency checkbox (label = `US_RESIDENCY_DISCLAIMER`), Turnstile widget loaded via `next/script`.
- [x] Disclaimer text appears identically in checkbox label AND below-form footer.
- [x] On submit: POST `/api/waitlist`, redirect to `/confirmation?voucher_code=...` or `?position=...`. Turnstile resets on error so user can retry.
- [x] Submit button disabled until residency checked AND Turnstile token present.

### 3.7 `app/confirmation/page.tsx`
- [x] Server component with async `searchParams`. Renders one of three views: voucher (code + terms), waitlist (position), or fallback (direct nav with no params).
- [x] No DB lookup — display-only. Voucher validity checked at production redemption, not here.

### 3.8 `app/layout.tsx`
- [x] Metadata updated: title "Avere — Reserve your $50 voucher", description matching form copy. Geist fonts and base layout retained from scaffold.

---

## Phase 4 — Disclaimer text consistency check

- [x] Canonical string locked in `lib/copy.ts` (`US_RESIDENCY_DISCLAIMER`).
- [x] Audited via grep: no hardcoded duplicates in any `.ts`/`.tsx` file. All 3 required surfaces (checkbox label, form footer, voucher email plain+HTML) reference the constant. Edits to `lib/copy.ts` propagate to all 4 user-visible appearances.

---

## Phase 5 — Deployment

- [ ] **5.1 Create Vercel project** — separate from any Avere core project, connected to `avere-waitlist` repo.
- [ ] **5.2 Set env vars** in Vercel (all 7).
- [ ] **5.3 Deploy** to production.
- [ ] **5.4 DNS** — point `waitlist.avere.xyz` at Vercel, verify cert.
- [ ] **5.5 Smoke test prod URL** — confirm form loads, Turnstile widget renders, env vars resolved.

---

## Phase 6 — Soft launch validation

- [ ] **6.1 End-to-end test** with 5–10 real signups (team + friends).
- [ ] **6.2 Verify** for each: row in Supabase, voucher_code populated for first 200, email delivered, `email_sent_at` set.
- [ ] **6.3 Test rejection paths**: unchecked residency, failed Turnstile, malformed email, duplicate email.
- [ ] **6.4 Sign off** — only after all paths pass do we hand off.

---

## Phase 7 — Marketing handoff

- [ ] **7.1 Send designer the URL** (`https://waitlist.avere.xyz`) and CTA copy guidance ("Reserve your $50 voucher", "first 200 only").
- [ ] **7.2 Confirm** designer pasted URL into existing landing CTA and shipped.

---

## Ops scripts (post-launch, as needed)

- [ ] **Resend replay script** — query `has_voucher = true AND email_sent_at IS NULL`, re-send each via Resend, update `email_sent_at`.
- [ ] **Status query** — count `has_voucher = true` vs total signups for pitch metrics.

---

## Out of scope — refuse if requested

- Solana / wallet / Anchor / Turnkey code
- Connecting to the `avere` core product (Supabase, APIs, anything)
- KYC / Sumsub sandbox in this repo
- IP geolocation gating
- Name / phone / address / any non-email PII
- Anonymous-role Supabase access from client
- Sending email before DB insert
- Skipping Turnstile validation
