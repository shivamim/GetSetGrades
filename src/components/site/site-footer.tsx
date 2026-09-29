"use client";

import * as React from "react";
import { Mail, ArrowRight } from "lucide-react";

import { siteConfig, type LegalPageKey } from "@/lib/site-config";
import { getWhatsappUrl, WhatsAppIcon } from "@/components/site/whatsapp";

/**
 * SiteFooter — audit Part 49.
 *
 * Layout:
 *   - Top: GetSetGrades wordmark + alt tagline ("Learn it. Understand it. GetSetGrades.").
 *   - Columns:
 *       Navigation: Services, How It Works, About, FAQ, Contact
 *       Support: WhatsApp, Email
 *       Legal: Privacy, Terms, Refund, Cookies, Acceptable Use, Grievance
 *   - Bottom: copyright + contact info.
 *
 * No social icons are rendered — the siteConfig.social object is empty
 * (audit Part 30: do NOT create fake Instagram/LinkedIn/YouTube/Twitter links).
 *
 * The footer is sticky to the bottom of the viewport per the project rules:
 * the root wrapper in `layout.tsx` is `min-h-screen flex flex-col` and this
 * footer is rendered with `mt-auto` so it always sits at the bottom when
 * content is short, and is pushed down naturally when content is long.
 */

export interface SiteFooterProps {
  /** Optional: open a legal modal when a legal link is clicked.
   * The page coordinator passes this in. */
  onOpenLegal?: (key: LegalPageKey) => void;
  /** Optional: open the real Grievance Redressal submission form.
   * The Grievance legal page explicitly promises this link exists. */
  onOpenGrievance?: () => void;
}

export function SiteFooter({ onOpenLegal, onOpenGrievance }: SiteFooterProps) {
  const whatsappUrl = getWhatsappUrl();
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t border-border bg-card/40"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {/* Brand + tagline */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <a
              href="#top"
              className="flex items-center gap-2"
              aria-label="GetSetGrades home"
            >
              <img
                src="/brand/getsetgrades-icon-32.png"
                srcSet="/brand/getsetgrades-icon-32.png 1x, /brand/getsetgrades-icon-192.png 2x"
                alt=""
                aria-hidden="true"
                width={36}
                height={36}
                className="size-9 shrink-0"
              />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                GetSetGrades
              </span>
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Learn it. Understand it. GetSetGrades.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation" className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </p>
            {siteConfig.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-foreground/80 transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Support */}
          <nav aria-label="Support" className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Support
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              <WhatsAppIcon className="size-3.5" />
              WhatsApp
            </a>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              <Mail className="size-3.5" />
              Email
            </a>
            <a
              href="#grievance"
              onClick={(e) => {
                if (onOpenGrievance) {
                  e.preventDefault();
                  onOpenGrievance();
                }
              }}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              <ArrowRight className="size-3.5" />
              File a Grievance
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              {siteConfig.contact.whatsappDisplay}
            </p>
            <p className="text-xs text-muted-foreground">
              {siteConfig.contact.email}
            </p>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal" className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </p>
            {siteConfig.legalPages.map((p) => (
              <a
                key={p.key}
                href={p.href}
                onClick={(e) => {
                  if (onOpenLegal) {
                    e.preventDefault();
                    onOpenLegal(p.key);
                  }
                }}
                className="text-sm text-foreground/80 transition-colors hover:text-foreground"
              >
                {p.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {year} GetSetGrades. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: {siteConfig.lastUpdated}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
