import {
  CalendarClock,
  HeartHandshake,
  Layers,
  Lightbulb,
  MessageSquare,
  Smile,
  type LucideIcon,
} from "lucide-react";

import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

/**
 * Why GetSetGrades — bento layout (audit Part 7 / 47).
 *
 * Feature card: Personalized support (large, spans 2 cols).
 * Secondary cards: Expert tutors, Flexible sessions, Multi-subject support,
 * Clear explanations, Student-first experience.
 *
 * Not 6 identical cards. Each card has a slightly different size / accent
 * so the grid feels art-directed.
 */

type Reason = {
  icon: LucideIcon;
  title: string;
  description: string;
  size: "feature" | "medium" | "small";
  accent?: "mint" | "blue" | "teal";
};

const reasons: Reason[] = [
  {
    icon: HeartHandshake,
    title: "Personalized support",
    description:
      "Support tailored to your topic, level and goals. Every session is built around what you actually need — not a one-size-fits-all template.",
    size: "feature",
    accent: "mint",
  },
  {
    icon: Lightbulb,
    title: "Expert tutors",
    description: "Someone who genuinely understands the subject.",
    size: "medium",
    accent: "blue",
  },
  {
    icon: CalendarClock,
    title: "Flexible sessions",
    description: "Online support designed around your schedule.",
    size: "medium",
    accent: "teal",
  },
  {
    icon: Layers,
    title: "Multi-subject support",
    description: "Mathematics, programming, writing, research, data and AI.",
    size: "small",
  },
  {
    icon: MessageSquare,
    title: "Clear explanations",
    description: "Focus on understanding, not just answers.",
    size: "small",
  },
  {
    icon: Smile,
    title: "Student-first experience",
    description: "Simple communication, no unnecessary complexity.",
    size: "small",
  },
];

const accentMap = {
  mint: "bg-[color-mix(in_oklch,var(--brand-mint)_45%,transparent)] text-brand-navy",
  blue: "bg-[color-mix(in_oklch,var(--brand-blue)_18%,transparent)] text-[color-mix(in_oklch,var(--brand-blue)_85%,white)]",
  teal: "bg-[color-mix(in_oklch,var(--brand-teal)_30%,transparent)] text-brand-navy",
  none: "bg-brand-mint text-brand-navy",
} as const;

export function WhySection() {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="bg-secondary/40 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why GetSetGrades"
          number="07"
          headingId="why-heading"
          title="Built around how students actually study."
          subtitle="Smart, simple, human — and built to make a real difference to your understanding."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {reasons.map((reason, idx) => {
            const Icon = reason.icon;
            const isFeature = reason.size === "feature";
            return (
              <ScrollReveal
                key={reason.title}
                as="article"
                delay={idx * 70}
                className={cn(
                  "card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-soft-lg sm:p-6",
                  isFeature && "lg:col-span-2 lg:row-span-2",
                  reason.size === "medium" && "lg:col-span-2",
                )}
              >
                <div
                  className={cn(
                    "inline-flex items-center justify-center rounded-2xl",
                    isFeature ? "size-14" : "size-11",
                    accentMap[reason.accent ?? "none"],
                  )}
                >
                  <Icon className={isFeature ? "size-7" : "size-5"} aria-hidden="true" />
                </div>
                <h3
                  className={cn(
                    "mt-4 font-semibold tracking-tight text-foreground",
                    isFeature ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
                  )}
                >
                  {reason.title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed text-muted-foreground",
                    isFeature && "sm:text-base",
                  )}
                >
                  {reason.description}
                </p>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhySection;
