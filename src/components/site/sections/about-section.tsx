import { CalendarCheck } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { siteConfig } from "@/lib/site-config";

/**
 * About section v2 (Task 5-c).
 *
 * Per spec §29:
 *  - Headline: "Academic support, made simpler." (the word "simpler"
 *    highlighted with the `.brand-text-gradient` utility).
 *  - Subheading: "GetSetGrades connects students with practical,
 *    personalized academic support when they need it."
 *
 * Reorganised into a two-column layout:
 *  - LEFT: SectionHeading (`eyebrow="About"`, `number="05"`,
 *    `align="left"`) + two short, warm narrative paragraphs (no
 *    corporate jargon).
 *  - RIGHT: Mission/Vision card (kept from the previous version,
 *    unchanged content).
 *
 * No invented stats, fake testimonials, fake partnerships or fake
 * success rates the page remains honest per spec §29.
 *
 * The `Last updated: ${siteConfig.lastUpdated}` line is preserved at
 * the bottom of the Mission/Vision card.
 */
export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Left column: heading + narrative */}
          <div className="space-y-6">
            <SectionHeading
              eyebrow="About"
              number="05"
              align="left"
              headingId="about-heading"
              title={
                <>
                  Academic support, made{" "}
                  <span className="brand-text-gradient">simpler</span>.
                </>
              }
              subtitle="GetSetGrades connects students with practical, personalized academic support when they need it."
            />

            <div className="space-y-4 text-base/relaxed text-muted-foreground">
              <p>
                GetSetGrades started with a simple idea academic support
                should feel human, clear and genuinely useful. Not
                confusing. Not transactional. Just real help from someone
                who understands the topic.
              </p>
              <p>
                Today, we connect students with online tutoring across
                programming, mathematics, writing, research, data and AI
                built around how each student actually learns.
              </p>
            </div>
          </div>

          {/* Right column: Mission & Vision stacked card */}
          <aside
            aria-label="Our mission and vision"
            className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
                Mission
              </p>
              <p className="mt-2 text-base/relaxed text-foreground">
                Make learning support more accessible, understandable and
                student-friendly.
              </p>
            </div>

            <div className="h-px bg-border" aria-hidden="true" />

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
                Vision
              </p>
              <p className="mt-2 text-base/relaxed text-foreground">
                Build a trusted global platform where students can access
                reliable academic guidance whenever they need it.
              </p>
            </div>

            <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <CalendarCheck className="size-4" aria-hidden="true" />
              <span>
                Last updated:{" "}
                <time dateTime={siteConfig.lastUpdated}>
                  {siteConfig.lastUpdated}
                </time>
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
