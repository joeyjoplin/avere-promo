import { WaitlistForm } from "./_components/waitlist-form";
import { US_RESIDENCY_DISCLAIMER } from "@/lib/copy";

export default function Page() {
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
  if (!turnstileSiteKey) {
    throw new Error("TURNSTILE_SITE_KEY must be set in .env.local");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-zinc-50">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Reserve your $50 Avere voucher
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            First 200 entries get $50 USDC pre-approved loan at 2% APR,
            redeemable at official launch.
          </p>
        </div>
        <WaitlistForm turnstileSiteKey={turnstileSiteKey} />
        <p className="text-xs text-zinc-500 text-center">
          {US_RESIDENCY_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
