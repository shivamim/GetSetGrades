import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Lightbulb,
  MessageSquare,
  UserCheck,
  Video,
  type LucideIcon,
} from "lucide-react";

import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";

type JourneyStep = {
  /** lucide icon */
  icon: LucideIcon;
  /** Step title (short, action-oriented). */
  title: string;
  /** One-line supporting description. */
  description: string;
};

const journeySteps: JourneyStep[] = [
  {
    icon: CircleHelp,
    title: "You have a problem",
    description: "A topic, an assignment, a tricky concept.",
  },
  {
    icon: MessageSquare,
    title: "Tell GetSetGrades",
    description: "Share what you're working on.",
  },
  {
    icon: UserCheck,
    title: "Tutor assigned",
    description: "We connect you with the right person.",
  },
  {
    icon: Video,
    title: "Session begins",
    description: "One-to-one, online, focused on you.",
  },
  {
    icon: Lightbulb,
    title: "Concept understood",
    description: "You actually get it.",
  },
  {
    icon: CheckCircle2,
    title: "Task completed with confidence",
    description: "Move forward, on your terms.",
  },
];

/**
 * Student Journey section (per spec §16).
 *
 * 6-step journey rendered as a responsive grid:
 *  - Mobile: single column
 *  - Tablet: 2 columns
 *  - Desktop: 3 columns
 *
 * Each step is a `rounded-2xl border border-border bg-card p-5 shadow-soft card-lift`
 * card with the icon in a `bg-brand-mint/40` mint circle. The final
 * "completed" step uses a gradient circle to signal "done". On desktop, an
 * `ArrowRight` between adjacent cards in the same row suggests forward flow.
 *
 * Cards are wrapped in `ScrollReveal` with staggered delays
 * (0 / 80 / 160 / 240 / 320 / 400 ms) so they reveal sequentially when
 * scrolled into view.
 */
export function StudentJourneySection() {
  return (
    <section
      id="journey"
      aria-labelledby="journey-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Student journey"
          number="08"
          headingId="journey-heading"
          title={
            <>
              From stuck to{" "}
              <span className="brand-text-gradient">sorted</span>.
            </>
          }
          subtitle={
            "A simple, premium workflow from \u201cI don't get this\u201d to \u201cI've got this.\u201d"
          }
        />

        <ul
          role="list"
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {journeySteps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === journeySteps.length - 1;
            // On desktop, show a small arrow at the right edge of every
            // card EXCEPT the last in each row (i.e. cards 3 and 6).
            const showArrowDesktop = (idx + 1) % 3 !== 0;
            return (
              <ScrollReveal
                key={step.title}
                as="li"
                delay={idx * 80}
                className="relative h-full"
              >
                <article className="card-lift relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
                  {/* Small step number badge top-right */}
                  <span className="absolute right-4 top-4 text-xs font-mono text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Icon circle gradient on the final step */}
                  <div
                    className={
                      isLast
                        ? "inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-white shadow-soft"
                        : "inline-flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--brand-mint)_40%,transparent)] text-brand-navy"
                    }
                    aria-hidden="true"
                  >
                    <Icon className="size-6" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm/relaxed text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Arrow on desktop (suggests forward flow) */}
                  {showArrowDesktop ? (
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground/60 lg:block"
                    />
                  ) : null}
                </article>
              </ScrollReveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default StudentJourneySection;
