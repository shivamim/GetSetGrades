"use client";

import * as React from "react";
import { Gift, X } from "lucide-react";

import { siteConfig } from "@/lib/site-config";
import { getWhatsappUrl } from "@/components/site/whatsapp";

/**
 * Slim announcement strip above the header promoting the referral offer:
 * "refer a friend, once they complete their first session, we do one of
 * your sessions free."
 *
 * Dismissible per browser tab (sessionStorage) — reappears on next visit
 * so the offer keeps getting seen, but doesn't nag within a session.
 */
const STORAGE_KEY = "gid_offer_dismissed";

export function OfferStrip() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!siteConfig.offer.enabled) return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // sessionStorage unavailable — show the strip anyway.
    }
    // sessionStorage is only readable client-side (SSR would mismatch),
    // so this genuinely has to run post-mount rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, []);

  if (!siteConfig.offer.enabled || !visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  const referUrl = getWhatsappUrl(
    "Hi GetSetGrades, I'd like to refer a friend for the referral offer.",
  );

  return (
    <div className="relative z-[60] w-full bg-gradient-to-r from-brand-navy via-brand-blue to-brand-teal px-3 py-2 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-center">
        <Gift className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
        <p className="text-[11px] font-medium leading-tight sm:text-xs">
          {siteConfig.offer.text}
        </p>
        <a
          href={referUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 shrink-0 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold underline-offset-2 transition-colors hover:bg-white/25 hover:underline sm:text-xs"
        >
          {siteConfig.offer.ctaLabel} →
        </a>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss offer"
        className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default OfferStrip;
