"use client";

import * as React from "react";

import { getWhatsappUrl, WhatsAppIcon } from "@/components/site/whatsapp";

/**
 * Floating WhatsApp action premium glass pill on desktop (text + glyph),
 * compact icon-only glass circle on mobile. Visible on every breakpoint.
 *
 * A small mint ping dot in the top-right corner draws the eye without
 * overwhelming. Reduced-motion users get no animation (the global rule in
 * globals.css forces `animation-duration: 0.001ms`).
 */
export function WhatsAppFab() {
  const [isDesktop, setIsDesktop] = React.useState(false);
  const whatsappUrl = getWhatsappUrl();

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsDesktop(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isDesktop) {
    // Desktop small floating glass pill with glyph + label.
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with GetSetGrades on WhatsApp"
          className="glass-card relative flex items-center gap-2 rounded-full py-2 pl-3 pr-4 text-sm font-medium text-foreground shadow-soft-lg transition-transform duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--brand-blue)_30%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {/* Small mint ping dot (top-right) */}
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-2 rounded-full bg-brand-mint"
          >
            <span className="animate-ping absolute inset-0 rounded-full bg-brand-mint opacity-75" />
          </span>
          <WhatsAppIcon className="size-5 text-brand-navy" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-foreground">WhatsApp</span>
            <span className="text-[0.7rem] text-muted-foreground">
              Chat with us
            </span>
          </span>
        </a>
      </div>
    );
  }

  // Mobile icon-only compact glass circle.
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with GetSetGrades on WhatsApp"
        className="glass-card relative flex size-12 items-center justify-center rounded-full shadow-soft-lg transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand-mint"
        >
          <span className="animate-ping absolute inset-0 rounded-full bg-brand-mint opacity-75" />
        </span>
        <WhatsAppIcon className="size-5 text-brand-navy" />
      </a>
    </div>
  );
}

export default WhatsAppFab;
