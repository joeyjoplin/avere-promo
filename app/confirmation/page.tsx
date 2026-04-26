import Image from "next/image";
import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ voucher_code?: string; position?: string }>;
}) {
  const params = await searchParams;
  const voucherCode =
    typeof params.voucher_code === "string" ? params.voucher_code : null;
  const positionNum =
    typeof params.position === "string" ? Number(params.position) : NaN;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <Image
          src="/avere-logo.png"
          alt="Avere"
          width={180}
          height={50}
          priority
          className="mx-auto h-24 w-auto"
        />
        {voucherCode ? (
          <VoucherView code={voucherCode} />
        ) : positionNum > 0 ? (
          <WaitlistView position={positionNum} />
        ) : (
          <FallbackView />
        )}
      </div>
    </main>
  );
}

function VoucherView({ code }: { code: string }) {
  return (
    <>
      <div>
        <p className="brand-label mb-5">Voucher granted</p>
        <h1 className="brand-heading text-3xl sm:text-5xl text-white">
          Your $50 Avere voucher is granted
        </h1>
        <p className="mt-5 text-base sm:text-lg font-light text-white/55 leading-relaxed">
          Check your inbox for the confirmation email.
        </p>
      </div>

      <div>
        <p className="brand-label mb-3">Voucher code</p>
        <p className="font-mono text-2xl sm:text-3xl bg-[#1a1a1a] text-[#39ff14] border border-[#39ff14]/30 px-6 py-6 tracking-[0.4em] text-center">
          {code}
        </p>
      </div>

      <div>
        <p className="brand-label mb-4">Terms</p>
        <ul className="text-sm text-white/65 leading-relaxed space-y-2">
          <li className="flex gap-3">
            <span className="text-[#39ff14]">→</span>
            <span>$50 USDC pre-approved loan at 2% APR</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#39ff14]">→</span>
            <span>3-month term</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#39ff14]">→</span>
            <span>Redeemable within 90 days of official launch</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#39ff14]">→</span>
            <span>
              Bound to your email — use the same address at redemption
            </span>
          </li>
        </ul>
      </div>
    </>
  );
}

function WaitlistView({ position }: { position: number }) {
  return (
    <>
      <div>
        <p className="brand-label mb-5">On the waitlist</p>
        <h1 className="brand-heading text-3xl sm:text-5xl text-white">
          You&apos;re #{position} on the waitlist
        </h1>
        <p className="mt-5 text-base sm:text-lg font-light text-white/55 leading-relaxed">
          The first 200 vouchers have been claimed. We&apos;ll keep you posted
          as we approach launch.
        </p>
      </div>
      <p className="text-sm text-white/45">
        Check your inbox for the confirmation email.
      </p>
    </>
  );
}

function FallbackView() {
  return (
    <>
      <div>
        <p className="brand-label mb-5">Hmm</p>
        <h1 className="brand-heading text-2xl sm:text-3xl text-white">
          Looks like you arrived here without submitting the form
        </h1>
      </div>
      <Link
        href="/"
        className="brand-label text-[#39ff14] hover:text-white transition-colors inline-flex items-center gap-2 w-fit"
      >
        ← Go to the signup form
      </Link>
    </>
  );
}
