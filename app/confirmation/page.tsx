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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-zinc-50">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Your $50 Avere voucher is reserved
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Check your inbox for the confirmation email.
        </p>
      </div>
      <div className="w-full">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          Voucher code
        </p>
        <p className="font-mono text-2xl bg-white border border-zinc-300 rounded-md px-4 py-4 tracking-[0.3em]">
          {code}
        </p>
      </div>
      <div className="w-full text-left">
        <h2 className="text-sm font-medium text-zinc-900 mb-2">Terms</h2>
        <ul className="text-sm text-zinc-600 space-y-1 list-disc list-inside">
          <li>$50 USDC pre-approved loan at 2% APR</li>
          <li>3-month term</li>
          <li>Redeemable within 90 days of official launch</li>
          <li>Bound to your email — use the same address at redemption</li>
        </ul>
      </div>
    </>
  );
}

function WaitlistView({ position }: { position: number }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        You&apos;re #{position} on the waitlist
      </h1>
      <p className="text-sm text-zinc-600">
        The first 200 vouchers have been claimed. We&apos;ll keep you posted as
        we approach launch.
      </p>
      <p className="text-sm text-zinc-600">
        Check your inbox for the confirmation email.
      </p>
    </>
  );
}

function FallbackView() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Looks like you arrived here without submitting the form
      </h1>
      <Link
        href="/"
        className="text-sm text-zinc-700 underline hover:text-zinc-900"
      >
        Go to the signup form
      </Link>
    </>
  );
}
