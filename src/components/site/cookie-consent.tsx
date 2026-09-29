"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * CookieConsent — audit Part 24.
 *
 * This site uses ONLY:
 *   - essential cookies (none currently — we don't run a session)
 *   - localStorage preference (this very banner's "dismissed" flag)
 *
 * We do NOT load analytics / marketing / advertising scripts. The banner
 * therefore does NOT imply that optional analytics exist. We state plainly
 * what we do and offer an "Okay, got it" button (no Accept/Reject pair
 * because there is nothing to reject).
 *
 * If analytics are added later:
 *   1. Update the Cookie Policy legal page.
 *   2. Replace this banner with an Accept/Reject pair.
 *   3. Gate the analytics script load on consent.
 *
 * Storage: `localStorage["gid_cookie_consent"] = "essential-only"`.
 */

const STORAGE_KEY = "gid_cookie_consent";
const STORAGE_VALUE = "essential-only";

export function CookieConsent() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      // localStorage is only readable client-side (SSR would mismatch),
      // so this genuinely has to run post-mount rather than during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v !== STORAGE_VALUE) setOpen(true);
    } catch {
      // localStorage may be disabled (private mode) — fail open so the
      // user still sees the banner.
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, STORAGE_VALUE);
    } catch {
      // Ignore write failure — the banner will re-show next visit, which
      // is the safest behaviour.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-20 z-50 sm:inset-x-auto sm:right-5 sm:bottom-24 sm:max-w-md"
    >
      <div className="liquid-glass rounded-3xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              We use only essential cookies
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              GetSetGrades doesn&apos;t use analytics or marketing trackers. We
              only store your preference to hide this banner. See our{" "}
              <a
                href="#legal-cookies"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Cookie Policy
              </a>{" "}
              for details.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={dismiss}
                className="rounded-full bg-brand-navy text-white hover:bg-brand-blue"
              >
                Okay, got it
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss cookie notice"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
