# CLAUDE.md — avere-waitlist

This is the coding rules file for the **avere-waitlist** repository — the Early Adopter Campaign for Avere. It is a separate codebase from the Avere product. If you are looking for rules about Anchor programs, Turnkey, KYC integration, or the Score Engine, see the `avere` repository's `CLAUDE.md` instead.

---

## Project identity

`avere-waitlist` is a single-purpose Next.js app on Vercel. It exists to:

1. Capture email signups from a public form
2. Generate vouchers for the first 200 entries (8-character alphanumeric codes)
3. Send confirmation emails with the voucher code (or waitlist position for entries beyond 200)
4. Hand off a single URL (`https://waitlist.avere.finance`) to the marketing team

It does not authenticate users beyond email + bot challenge. It does not store PII. It does not connect to Solana. It does not know what Avere does as a product.

For the full feature blueprint, see `AVERE_PROMO_BLUEPRINT.md` in this same repository.

---

## Stack

- **Framework:** Next.js 14+ App Router, TypeScript
- **Database:** Supabase (Postgres), service-role access only
- **Email:** Resend
- **Bot protection:** Cloudflare Turnstile
- **Hosting:** Vercel
- **Styling:** Tailwind CSS (utility-first, no design system needed)

There are no other dependencies. Avoid adding libraries unless absolutely necessary — the surface area of this app is small by design.

---

## Hard rules

These cannot be relaxed without explicit discussion:

1. **The campaign is independent of the Avere core product.** This repository never imports from, depends on, or coordinates with the `avere` repo. The only outbound connection is the demo CTA on the marketing landing page, which is configured by the marketing team — not by code in this repo.

2. **Service-role keys are server-only.** `SUPABASE_SERVICE_KEY` and `TURNSTILE_SECRET_KEY` must never appear in client bundles. Any variable not prefixed with `NEXT_PUBLIC_` is server-only by Next.js convention. Do not import server-only modules from client components. The Supabase client used in this project is the service-role client; there is no anonymous-role usage.

3. **Insert before email, always.** The API route inserts the row in Supabase first, then sends the email. Never reverse this. If the email send fails, the row already exists with `email_sent_at = null` and can be resent manually. Reversing the order would create users with vouchers in their inbox that do not exist in the database.

4. **Turnstile validates before DB write.** A failed bot challenge must never result in a row in Supabase, even temporarily. Validate the token via Cloudflare's siteverify API, then proceed to insert. If validation fails, return 400 and stop.

5. **US-residency checkbox is required server-side.** Do not trust the client. The API route checks `residency_confirmed === true` on the server before any other logic. Missing or false → 400.

6. **No PII storage beyond email.** Do not add fields for name, address, phone, or any other personal data. The waitlist needs email + voucher binding. Anything else is liability without product value.

7. **No Sumsub integration in this repo.** KYC happens at launch in the production Avere app, not here. If anyone proposes adding KYC sandbox to this app, refer them to `AVERE_PROMO_BLUEPRINT.md` section "Why Sumsub Sandbox is not used in this app".

8. **Email subject and body match the legal text on the form.** The US-residency disclaimer text appears in three places: the checkbox label, the form footer, and the confirmation email. All three must be identical wording. Edit them together or not at all.

---

## Repository structure

```
avere-waitlist/
├── app/
│   ├── page.tsx                # the form
│   ├── api/
│   │   └── waitlist/route.ts   # POST handler
│   ├── confirmation/page.tsx   # post-submit screen
│   └── layout.tsx
├── lib/
│   ├── supabase.ts             # service-role client
│   ├── email.ts                # Resend client + voucher email template
│   └── turnstile.ts            # token validation helper
├── .env.local                  # SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY,
│                               #   RESEND_FROM_ADDRESS, TURNSTILE_SITE_KEY,
│                               #   TURNSTILE_SECRET_KEY, WAITLIST_PUBLIC_URL
├── AVERE_PROMO_BLUEPRINT.md    # the full feature blueprint
└── CLAUDE.md                   # this file
```

---

## Implementation sequence

When implementing from scratch, follow this order. Each step is independent enough that incomplete earlier steps do not block tests of later ones — but ship in order to keep the deployment pipeline coherent.

1. **Resend domain setup** (DNS propagation 24–48h — start day 1)
2. **Supabase project + migration + trigger** (1h)
3. **Cloudflare Turnstile registration** (30min)
4. **Next.js app: form, API route, confirmation page** (3–4h)
5. **Vercel deployment + subdomain DNS** (30min)
6. **Soft launch test with 5–10 real signups** (1h)
7. **Hand off URL to marketing**

Total ~6–8 hours of code, plus the DNS wait. See `AVERE_PROMO_BLUEPRINT.md` for full step-by-step.

---

## Coding sessions

When opening a coding session for this repository, read `AVERE_PROMO_BLUEPRINT.md` first — it has the schema, the flow, the failure modes, and the marketing context. The blueprint is the source of truth; this `CLAUDE.md` is rules and shorthand.

**Form session prompt:**
```
Read AVERE_PROMO_BLUEPRINT.md sections "What it is", "US-only enforcement",
and "Insert + email flow".

Implement app/page.tsx as a server component with a client form child.
Form fields: email (required, validated), US-residency checkbox (required),
Turnstile widget (required). Posts to /api/waitlist. On 200, redirect to
/confirmation with voucher_code or position as URL params.

Use Tailwind. Minimal styling — visual identity is owned by the marketing
landing page, not this form.
```

**API route session prompt:**
```
Read AVERE_PROMO_BLUEPRINT.md section "Insert + email flow — order matters"
and "Failure modes".

Implement app/api/waitlist/route.ts. Order: validate residency_confirmed →
validate Turnstile token → validate email format → INSERT into waitlist →
read back voucher_code and position → send email via Resend → UPDATE
email_sent_at on success.

Never reverse insert/email order. Bot validation must precede DB write.
Return appropriate HTTP codes per failure mode table in the blueprint.
```

**Email template session prompt:**
```
Read AVERE_PROMO_BLUEPRINT.md sections "Voucher mechanics" and "US-only
enforcement".

Implement lib/email.ts with two templates: voucher_email (for has_voucher = true)
and waitlist_email (for has_voucher = false, position > 200).

Voucher email contains: voucher code, $50 amount, 2% APR, 3-month term,
US-residency disclaimer text matching the form's checkbox label.

Plain text + HTML versions. Subject lines distinct between the two templates.
```

---

## Anti-patterns to refuse

If a request asks you to do any of the following, push back and reference this rules file:

- Add Solana, wallet, or blockchain code to this app
- Connect to the Avere core product's Supabase, Anchor programs, or APIs
- Replace email-only signup with KYC, phone verification, or social login
- Skip Turnstile validation "because it's just a small launch"
- Send the voucher email before the database insert succeeds
- Store name, address, phone, document, or any non-email PII
- Add IP geolocation gating (the blueprint explicitly chose self-attestation over IP)
- Add features beyond email capture, voucher generation, and email send

---

*avere-waitlist · CLAUDE.md v1 · Stack: Next.js + Supabase + Resend + Turnstile · See AVERE_PROMO_BLUEPRINT.md for full feature spec*
