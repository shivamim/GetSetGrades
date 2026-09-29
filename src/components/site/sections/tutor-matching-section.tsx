import {
  Compass,
  GraduationCap,
  MessageSquarePlus,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";

type MatchingStep = {
  /** lucide icon */
  icon: LucideIcon;
  /** Step number, e.g. "01", "02". */
  number: string;
  /** Short, single-line step title. */
  title: string;
  /** One-line supporting description. */
  description: string;
};

const matchingSteps: MatchingStep[] = [
  {
    icon: MessageSquarePlus,
    number: "01",
    title: "You tell us what you need.",
    description: "Share your subject, level and what you're working on.",
  },
  {
    icon: Compass,
    number: "02",
    title: "We review your subject and requirements.",
    description: "We look at the topic and the kind of support that fits.",
  },
  {
    icon: UserCheck,
    number: "03",
    title: "A suitable tutor is assigned.",
    description: "We'll match you with a tutor who fits your subject.",
  },
  {
    icon: GraduationCap,
    number: "04",
    title: "You start your session.",
    description: "One-to-one, online, focused on you and your goals.",
  },
];

/**
 * Tutor Matching section (per spec §13).
 *
 * A horizontal 4-step matching flow on desktop, vertical on mobile. Steps
 * are connected by a mint→blue→teal gradient line that sits behind the
 * step circles. Each step is a `glass-card` with a gradient icon circle
 * and a small mono step number above the title.
 *
 * Below the 4 steps, two `glass-card-tinted` chips render a static
 * before/after demo ("Finding your tutor..." / "Tutor matched ✓"). This is
 * intentionally a static visual, not an animated state-transition, per the
 * brief.
 *
 * The wording deliberately avoids claiming automated matching the actual
 * process is manual. "We'll match you with a suitable tutor."
 */
export function TutorMatchingSection() {
  return (
    <section
      id="tutor-matching"
      aria-labelledby="tutor-matching-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tutor matching"
          number="03"
          headingId="tutor-matching-heading"
          title={
            <>
              Get matched with{" "}
              <span className="brand-text-gradient">the right tutor</span>.
            </>
          }
          subtitle="Tell us what you're working on and we'll connect you with a tutor who fits your subject and support needs."
        />

        {/* 4-step flow horizontal timeline on desktop, vertical on mobile */}
        <div className="relative mt-14">
          {/* Desktop horizontal gradient connector */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-brand-mint via-brand-blue to-brand-teal opacity-60 md:block"
          />

          <ol
            role="list"
            className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6"
          >
            {matchingSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <ScrollReveal
                  key={step.number}
                  as="li"
                  delay={idx * 100}
                  className="relative"
                >
                  <article className="glass-card flex h-full flex-col rounded-2xl p-5">
                    {/* Icon circle */}
                    <div className="relative z-10 mb-4 inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white shadow-soft">
                      <Icon className="size-5" />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      {step.number}
                    </p>
                    <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm/relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </article>
                </ScrollReveal>
              );
            })}
          </ol>
        </div>

        {/* Before/after demo static, NOT an animated transition */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="glass-card-tinted flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-foreground">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-blue opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-brand-blue" />
            </span>
            Finding your tutor…
          </div>
          <span aria-hidden="true" className="text-muted-foreground">
            →
          </span>
          <div className="glass-card-tinted flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-foreground">
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-mint text-brand-navy">
              <UserCheck className="size-3.5" />
            </span>
            Tutor matched ✓
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-brand-navy text-white transition-colors hover:bg-brand-blue"
          >
            <a href="#book">Get Started</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default TutorMatchingSection;
