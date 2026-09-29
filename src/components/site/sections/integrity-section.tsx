import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WhatsAppIcon, getWhatsappUrl } from "@/components/site/whatsapp";

/**
 * Academic Integrity section.
 *
 * Two-column layout:
 *  - Left: eyebrow + heading (with "learn" in brand gradient) + body copy
 *    + sub-line + primary CTA ("Get Academic Support" → #book) and a
 *    secondary "Chat on WhatsApp" link.
 *  - Right: a card titled "What's allowed vs not allowed" with two
 *    bulleted lists (allowed = emerald Check, not allowed = rose X).
 *
 * Tone: professional and non-judgmental we describe what GetSetGrades
 * does and what it will not do, without preaching.
 */

const allowed: readonly string[] = [
  "Tutoring",
  "Concept explanations",
  "Guided problem solving",
  "Study planning",
  "Revision",
  "Practice questions",
  "Programming explanations",
  "Research guidance",
  "Feedback",
  "Project guidance",
];

const notAllowed: readonly string[] = [
  "Impersonating students",
  "Taking exams for students",
  "Completing proctored assessments",
  "Plagiarism facilitation",
  "Academic fraud",
  "Credential sharing",
];

export function IntegritySection() {
  const whatsappHref = getWhatsappUrl();

  return (
    <section
      id="integrity"
      aria-labelledby="integrity-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left column heading + copy + CTAs */}
          <div>
            <p className="text-sm font-medium text-brand-blue mb-3">
              Academic integrity
            </p>
            <h2
              id="integrity-heading"
              className="text-3xl md:text-4xl font-semibold tracking-tight"
            >
              We help you <span className="brand-text-gradient">learn</span> -
              not cheat.
            </h2>

            <p className="mt-5 text-base/relaxed text-muted-foreground">
              GetSetGrades provides tutoring, explanations, study guidance and
              academic support. We do not impersonate students, take exams on
              behalf of students, or provide services intended to misrepresent a
              student&apos;s own work.
            </p>
            <p className="mt-4 text-base/relaxed text-foreground/80">
              Need help understanding something? That&apos;s exactly what
              we&apos;re here for.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full">
                <a href="#book">Get Academic Support</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl"
              >
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Right column allowed vs not-allowed card */}
          <div className="rounded-2xl border border-border bg-card shadow-soft p-6 md:p-8">
            <h3 className="text-lg font-semibold tracking-tight">
              What&apos;s allowed vs not allowed
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A quick, honest look at how GetSetGrades works.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Allowed
                </p>
                <ul className="mt-3 space-y-2">
                  {allowed.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                  Not allowed
                </p>
                <ul className="mt-3 space-y-2">
                  {notAllowed.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <X
                        className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default IntegritySection;
