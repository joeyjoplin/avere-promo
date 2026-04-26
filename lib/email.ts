// Resend client + transactional email templates. Server-only.

import { Resend } from "resend";
import { US_RESIDENCY_DISCLAIMER } from "./copy";

const apiKey: string = (() => {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error("RESEND_API_KEY must be set in .env.local");
  return k;
})();

const fromAddress: string = (() => {
  const f = process.env.RESEND_FROM_ADDRESS;
  if (!f) throw new Error("RESEND_FROM_ADDRESS must be set in .env.local");
  return f;
})();

const resend = new Resend(apiKey);

export async function sendVoucherEmail(
  to: string,
  voucherCode: string,
): Promise<void> {
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Your $50 Avere voucher is granted",
    text: `Your $50 Avere voucher is granted.

Voucher code: ${voucherCode}

Terms:
- $50 USDC pre-approved loan at 2% APR
- 3-month term
- Redeemable within 90 days of official launch
- Voucher is bound to this email — use the same address when redeeming at launch

${US_RESIDENCY_DISCLAIMER}

— The Avere Team`,
    html: `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Your $50 Avere voucher is granted</h1>
    <p style="margin: 0 0 8px;">Voucher code:</p>
    <p style="font-family: 'Menlo', monospace; font-size: 24px; background: #f5f5f5; padding: 16px; text-align: center; letter-spacing: 4px; margin: 0 0 24px;">${voucherCode}</p>
    <h2 style="font-size: 16px; margin: 0 0 8px;">Terms</h2>
    <ul style="margin: 0 0 24px; padding-left: 20px;">
      <li>$50 USDC pre-approved loan at 2% APR</li>
      <li>3-month term</li>
      <li>Redeemable within 90 days of official launch</li>
      <li>Voucher is bound to this email — use the same address when redeeming at launch</li>
    </ul>
    <p style="font-size: 13px; color: #666; margin: 0 0 16px;">${US_RESIDENCY_DISCLAIMER}</p>
    <p style="font-size: 13px; color: #666; margin: 0;">— The Avere Team</p>
  </body>
</html>`,
  });

  if (error) {
    throw new Error(`Resend voucher email failed: ${error.message}`);
  }
}

export async function sendWaitlistEmail(
  to: string,
  position: number,
): Promise<void> {
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: `You're #${position} on the Avere waitlist`,
    text: `Thanks for signing up for early access to Avere.

The first 200 vouchers have been claimed. You're #${position} on the waitlist — we'll keep you posted as we approach launch.

— The Avere Team`,
    html: `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">You're #${position} on the Avere waitlist</h1>
    <p style="margin: 0 0 16px;">Thanks for signing up for early access to Avere.</p>
    <p style="margin: 0 0 16px;">The first 200 vouchers have been claimed. You're <strong>#${position}</strong> on the waitlist — we'll keep you posted as we approach launch.</p>
    <p style="font-size: 13px; color: #666; margin: 0;">— The Avere Team</p>
  </body>
</html>`,
  });

  if (error) {
    throw new Error(`Resend waitlist email failed: ${error.message}`);
  }
}
