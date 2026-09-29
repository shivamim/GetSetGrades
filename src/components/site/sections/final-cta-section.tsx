import { ArrowRight, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsappUrl, WhatsAppIcon } from "@/components/site/whatsapp";

/**
 * Final CTA section.
 *
 * One calm gradient panel with primary + WhatsApp CTAs. We removed the
 * duplicate floating "Tutor assigned ✓ / Session confirmed / Get started
 * in minutes" chips from the previous version — those were the kind of
 * "random floating badges" the audit (Part 47 / 48) calls out as
 * "generic AI design". The hero already carries that language; the final
 * CTA should be calm and direct.
 */
export function FinalCtaSection() {
  const whatsappUrl = getWhatsappUrl();

  return (
    <section id="cta" aria-labelledby="cta-heading" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[color-mix(in_oklch,var(--brand-mint)_45%,transparent)] via-white to-[color-mix(in_oklch,var(--brand-blue)_18%,transparent)] px-6 py-14 text-center shadow-soft-lg md:px-12 md:py-20">
          {/* Soft radial halo behind the CTA copy. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 60% 60% at 50% 50%, color-mix(in oklch, var(--brand-mint) 35%, transparent), transparent 70%)",
            }}
          />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-navy">
              Ready to GetSetGrades?
            </p>

            <h2
              id="cta-heading"
              className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Tell us what you&apos;re working on — we&apos;ll help you find
              the right support.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base/relaxed text-muted-foreground">
              Get started with{" "}
              <span className="brand-text-gradient font-semibold">
                GetSetGrades
              </span>{" "}
              — academic support built around your subject and schedule.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="group rounded-full bg-brand-navy text-white transition-colors hover:bg-brand-blue"
              >
                <a href="#book">
                  Get Started
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="group rounded-full bg-white"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-4" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <UserCheck className="size-4 text-brand-blue" aria-hidden="true" />
              Online support • Flexible sessions • Students worldwide
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCtaSection;
