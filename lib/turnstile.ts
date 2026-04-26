// Cloudflare Turnstile token validator. Server-only.

const secret: string = (() => {
  const s = process.env.TURNSTILE_SECRET_KEY;
  if (!s) {
    throw new Error("TURNSTILE_SECRET_KEY must be set in .env.local");
  }
  return s;
})();

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Throws on network/HTTP failure (caller treats as 503); returns false on invalid token (caller treats as 400).
export async function validateTurnstile(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.append("remoteip", remoteIp);

  const res = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Turnstile siteverify HTTP ${res.status}`);
  }

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
