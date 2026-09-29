import {
  Compass,
  GraduationCap,
  MessageSquarePlus,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";

/**
 * How It Works section v2 (Task 5-c).
 *
 * Per spec §14:
 *  - 4 steps updated to:
 *      01 Tell us what you need
 *      02 We understand your subject and goals
 *      03 A suitable tutor is assigned
 *      04 Start learning and move forward
 *  - Each step now has a small lucide icon:
 *      MessageSquarePlus / Compass / UserCheck / GraduationCap
 *  - Steps are wrapped in `ScrollReveal` with staggered delays
 *    (0 / 100 / 200 / 300 ms) so they reveal sequentially when the
 *    section scrolls into view.
 *  - The connector line (horizontal on desktop, vertical on mobile)
 *    uses the brand-coloured gradient `from-brand-mint via-brand-blue
 *    to-brand-teal` preserved from the previous version.
 *  - Section heading uses the shared `SectionHeading` component with
 *    `eyebrow="How it works"` and `number="02"`, keeping the
 *    "Four simple steps." title.
 *
 * Each step: a small circle containing a lucide icon (with the
 * connector line behind it), then a large mono-font step number
 * (01-04), title and short description.
 */

type Step = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    number: "01",
    icon: MessageSquarePlus,
    title: "Tell us what you need",
    description:
      "Share your subject, topic and what you'd like to understand.",
  },
  {
    number: "02",
    icon: Compass,
    title: "We understand your subject and goals",
    description:
      "We review the topic, level and what you're hoping to achieve.",
  },
  {
    number: "03",
    icon: UserCheck,
    title: "A suitable tutor is assigned",
    description: "We match you with a tutor who fits you'll know before it starts.",
  },
  {
    number: "04",
    icon: GraduationCap,
    title: "Start learning and move forward",
    description: "Join your session and walk away with real understanding.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          number="02"
          headingId="how-heading"
          title="Four simple steps."
          subtitle="From first message to GetSetGrades clear, friendly, fast."
        />

        <div className="relative mt-14">
          {/* Horizontal connector line (desktop only) sits behind the circles. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-brand-mint via-brand-blue to-brand-teal opacity-60 md:block"
          />

          <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === steps.length - 1;

              return (
                <ScrollReveal
                  key={step.number}
                  as="li"
                  delay={idx * 100}
                  className="relative grid grid-cols-[3.5rem_1fr] items-start gap-x-4 md:flex md:flex-col md:items-start md:grid-cols-none"
                >
                  {/* Vertical connector segment (mobile only) -
                      spans from this step's circle centre (top-7) down to the
                      next step's circle centre. Opaque circle covers the
                      overlap so the line visually "passes through" the circle. */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-[1.75rem] top-7 h-[calc(100%_+_2rem)] w-px -translate-x-1/2 bg-gradient-to-b from-brand-mint via-brand-blue to-brand-teal opacity-60 md:hidden"
                    />
                  )}

                  {/* Circle with small icon */}
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-soft md:mb-6">
                    <Icon
                      className="h-6 w-6 text-brand-blue"
                      aria-hidden="true"
                    />
                  </span>

                  {/* Step content large number, title, description */}
                  <div>
                    <span className="block font-mono text-5xl font-semibold leading-none text-brand-blue">
                      {step.number}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
