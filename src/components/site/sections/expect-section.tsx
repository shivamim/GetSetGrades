import { Compass, Lightbulb, MessageSquare, type LucideIcon } from "lucide-react";

import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";

type Expectation = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const expectations: Expectation[] = [
  {
    icon: Lightbulb,
    title: "Clear explanations",
    description:
      "Walk away actually understanding the concept, not just the answer.",
  },
  {
    icon: Compass,
    title: "A plan forward",
    description: "Get a clear next-step study plan from your tutor.",
  },
  {
    icon: MessageSquare,
    title: "Real conversation",
    description: "A friendly, human back-and-forth not a confusing bot.",
  },
];

/**
 * "What your session includes" section.
 *
 * v2 (Task 5-c): previously this was the "What students can expect"
 * section with a "Genuine testimonials will be added here as they become
 * available." placeholder line. Per spec §5 / §45, all placeholder /
 * coming-soon copy has been removed from the homepage marketing surface.
 *
 * The section now frames three positive expectations of a GetSetGrades
 * session clearly NOT testimonials, just a small honest "what you'll
 * get from a session" mini-section. Cards are wrapped in ScrollReveal
 * with staggered delays (0 / 80 / 160 ms) so they reveal sequentially
 * when scrolled into view.
 */
export function ExpectSection() {
  return (
    <section
      id="expect"
      aria-labelledby="expect-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What to expect"
          number="04"
          headingId="expect-heading"
          title="What your session includes."
          subtitle="Every GetSetGrades session is built around understanding not just answers."
        />

        <ul
          role="list"
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {expectations.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={item.title}
                as="li"
                delay={idx * 80}
                className="h-full"
              >
                <article className="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-soft-lg">
                  <div
                    className="inline-flex size-12 items-center justify-center rounded-full bg-brand-mint text-brand-navy"
                    aria-hidden="true"
                  >
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm/relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              </ScrollReveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default ExpectSection;
