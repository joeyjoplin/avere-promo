"use client";

import { useState, useRef, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { US_RESIDENCY_DISCLAIMER } from "@/lib/copy";

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: TurnstileOptions,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export function WaitlistForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) {
  const [email, setEmail] = useState("");
  const [residencyConfirmed, setResidencyConfirmed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scriptLoaded) return;
    if (!widgetContainerRef.current) return;
    if (widgetIdRef.current) return;
    if (!window.turnstile) return;

    widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, turnstileSiteKey]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!residencyConfirmed) {
      setError("Please confirm US residency.");
      return;
    }
    if (!turnstileToken) {
      setError("Please complete the bot challenge.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          residency_confirmed: residencyConfirmed,
          turnstile_token: turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setTurnstileToken("");
        setSubmitting(false);
        return;
      }

      const params = new URLSearchParams();
      if (data.has_voucher && data.voucher_code) {
        params.set("voucher_code", data.voucher_code);
      } else {
        params.set("position", String(data.position));
      }
      router.push(`/confirmation?${params}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-900">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={submitting}
            className="px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={residencyConfirmed}
            onChange={(e) => setResidencyConfirmed(e.target.checked)}
            required
            disabled={submitting}
            className="mt-0.5"
          />
          <span>{US_RESIDENCY_DISCLAIMER}</span>
        </label>

        <div ref={widgetContainerRef} />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !turnstileToken || !residencyConfirmed}
          className="px-4 py-2 bg-zinc-900 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
        >
          {submitting ? "Submitting…" : "Reserve voucher"}
        </button>
      </form>
    </>
  );
}
