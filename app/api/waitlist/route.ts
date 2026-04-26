// POST /api/waitlist — order: residency → Turnstile → email → INSERT → send → UPDATE. Insert before send always.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateTurnstile } from "@/lib/turnstile";
import { sendVoucherEmail, sendWaitlistEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, residency_confirmed, turnstile_token } = body as {
    email?: unknown;
    residency_confirmed?: unknown;
    turnstile_token?: unknown;
  };

  if (residency_confirmed !== true) {
    return NextResponse.json(
      { error: "US residency confirmation required" },
      { status: 400 },
    );
  }

  if (typeof turnstile_token !== "string" || turnstile_token.length === 0) {
    return NextResponse.json(
      { error: "Bot challenge token missing" },
      { status: 400 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  let turnstileOk: boolean;
  try {
    turnstileOk = await validateTurnstile(turnstile_token, ip);
  } catch (err) {
    console.error("Turnstile API error:", err);
    return NextResponse.json(
      { error: "Bot validation service unavailable" },
      { status: 503 },
    );
  }
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Bot challenge failed" },
      { status: 400 },
    );
  }

  if (typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("waitlist")
    .insert({ email: normalizedEmail })
    .select("id, position, voucher_code, has_voucher")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!data) {
    console.error("Supabase insert returned no data");
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  try {
    if (data.has_voucher && data.voucher_code) {
      await sendVoucherEmail(normalizedEmail, data.voucher_code);
    } else {
      await sendWaitlistEmail(normalizedEmail, data.position);
    }
    await supabase
      .from("waitlist")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", data.id);
  } catch (err) {
    // Insert succeeded but email/UPDATE failed — row recoverable via admin replay (email_sent_at IS NULL).
    console.error(
      `Email send failed for waitlist id=${data.id}; email_sent_at remains null:`,
      err,
    );
  }

  return NextResponse.json({
    has_voucher: data.has_voucher,
    voucher_code: data.voucher_code,
    position: data.position,
  });
}
