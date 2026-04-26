import { WaitlistForm } from "./_components/waitlist-form";
import { US_RESIDENCY_DISCLAIMER } from "@/lib/copy";

export default function Page() {
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
  if (!turnstileSiteKey) {
    throw new Error("TURNSTILE_SITE_KEY must be set in .env.local");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <div>
          <p className="brand-label mb-5">Early adopter campaign</p>
          <h1 className="brand-heading text-3xl sm:text-5xl text-white">
            Reserve your $50 Avere voucher
          </h1>
          <p className="mt-5 text-base sm:text-lg font-light text-white/55 leading-relaxed">
            First 200 entries get{" "}
            <strong className="text-white/85 font-semibold">
              $50 USDC pre-approved loan at 2% APR
            </strong>
            , redeemable at official launch.
          </p>
        </div>
        <WaitlistForm turnstileSiteKey={turnstileSiteKey} />
        <p className="text-xs text-white/35 leading-relaxed border-t border-white/5 pt-6">
          {US_RESIDENCY_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
