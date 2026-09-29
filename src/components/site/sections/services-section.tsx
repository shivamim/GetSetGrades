import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  Code2,
  FlaskConical,
  PenLine,
  type LucideIcon,
} from "lucide-react";

import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

/**
 * Services section — premium bento layout (audit Part 4 / 47).
 *
 * Do NOT use 8 identical cards. Use an asymmetric bento:
 *   - 1 large feature card: Programming & Computer Science (spans 2 cols + 2 rows).
 *   - 6 medium cards for the rest.
 *   - Each card has a subtle visual identity (CSS/UI elements, not screenshots):
 *       Programming -> abstract code lines
 *       Mathematics -> equation grid
 *       Data & AI   -> mini chart
 *       Research    -> document lines
 *       Writing     -> paragraph lines
 *       Homework    -> checkmark list
 *       Quiz & Exam -> Q&A lines
 *       Assignment  -> bullet lines
 *   - Hover: lift + soft light reflection + border transition + icon motion.
 *
 * Layout is responsive: 1 col on mobile, 2 cols on tablet, 4 cols on
 * desktop with the feature card spanning 2x2.
 */

type Service = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Decorative visual element rendered in the card background. */
  visual: React.ReactNode;
  /** Bento size class. */
  size: "feature" | "medium";
};

// ----------------------------------------------------------------
// Decorative visuals (CSS-only, no fake screenshots)
// ----------------------------------------------------------------

function CodeLines() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 top-12 overflow-hidden opacity-[0.18]"
    >
      <div className="flex flex-col gap-1.5 px-4">
        {[80, 55, 70, 40, 65, 50, 75].map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-blue/70" />
            <span
              className="h-1.5 rounded-full bg-foreground/40"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EquationGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.16]"
    >
      <div className="grid grid-cols-4 gap-2 text-foreground/40">
        {["x²", "+bx", "=", "0", "ax²", "bx", "c", "Δ", "√", "±", "x", "y", "f(x)", "∫", "∂", "Σ"].map(
          (s, i) => (
            <span
              key={i}
              className="font-mono text-[0.65rem] font-semibold sm:text-xs"
            >
              {s}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function MiniChart() {
  const bars = [40, 65, 50, 80, 60, 95, 75];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-4 flex h-16 items-end gap-1.5 opacity-[0.22]"
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-gradient-to-t from-brand-blue/30 to-brand-mint/60"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function DocumentLines() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-1.5 opacity-[0.18]"
    >
      {[100, 92, 96, 70, 88, 60].map((w, i) => (
        <span
          key={i}
          className="h-1.5 rounded-full bg-foreground/40"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

function CheckmarkList() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-1.5 opacity-[0.18]"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-mint/70" />
          <span
            className="h-1.5 rounded-full bg-foreground/40"
            style={{ width: `${60 + i * 10}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function QALines() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-1.5 opacity-[0.18]"
    >
      {["Q1", "Q2", "Q3"].map((q, i) => (
        <div key={q} className="flex items-center gap-1.5">
          <span className="font-mono text-[0.6rem] font-semibold text-foreground/50">
            {q}
          </span>
          <span
            className="h-1.5 rounded-full bg-foreground/40"
            style={{ width: `${65 + i * 8}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function BulletLines() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-1.5 opacity-[0.18]"
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-foreground/40" />
          <span
            className="h-1.5 rounded-full bg-foreground/30"
            style={{ width: `${55 + i * 8}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Services data
// ----------------------------------------------------------------

const services: Service[] = [
  {
    icon: Code2,
    title: "Programming & Computer Science",
    description:
      "Get help understanding programming, databases, algorithms, Python, SQL and core computer science concepts. From your first loop to advanced data structures.",
    visual: <CodeLines />,
    size: "feature",
  },
  {
    icon: Calculator,
    title: "Mathematics",
    description:
      "Work through difficult concepts and problems with clear step-by-step explanations.",
    visual: <EquationGrid />,
    size: "medium",
  },
  {
    icon: BarChart3,
    title: "Data & AI",
    description:
      "Get support with data analytics, Python, SQL, machine learning, AI and related topics.",
    visual: <MiniChart />,
    size: "medium",
  },
  {
    icon: FlaskConical,
    title: "Research & Projects",
    description:
      "Get guidance with research ideas, project structure, technical direction and documentation.",
    visual: <DocumentLines />,
    size: "medium",
  },
  {
    icon: PenLine,
    title: "Writing",
    description:
      "Improve structure, grammar, clarity, writing and academic communication.",
    visual: <DocumentLines />,
    size: "medium",
  },
  {
    icon: BookOpen,
    title: "Homework Support",
    description:
      "Work through challenging questions with guided explanations and practical examples.",
    visual: <CheckmarkList />,
    size: "medium",
  },
  {
    icon: ClipboardCheck,
    title: "Quiz & Exam Preparation",
    description:
      "Prepare with focused revision, practice questions and topic-by-topic guidance.",
    visual: <QALines />,
    size: "medium",
  },
  {
    icon: ClipboardList,
    title: "Assignment Guidance",
    description:
      "Break down requirements, understand the task and get clear guidance from start to finish.",
    visual: <BulletLines />,
    size: "medium",
  },
];

export function ServicesSection() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What we help with"
          number="01"
          headingId="services-heading"
          title="Everything you need to move forward."
          subtitle="From tricky concepts to bigger projects, get focused support from someone who actually understands the subject."
        />

        {/* Bento grid: 1 col mobile, 2 col tablet, 4 col desktop.
            The feature card spans 2 cols + 2 rows on desktop. */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {services.map((service, idx) => {
            const Icon = service.icon;
            const isFeature = service.size === "feature";
            return (
              <ScrollReveal
                key={service.title}
                as="article"
                delay={idx * 60}
                className={cn(
                  "card-lift group relative flex h-full min-h-[14rem] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-soft-lg sm:p-6",
                  isFeature && "lg:col-span-2 lg:row-span-2 lg:min-h-[22rem]",
                )}
              >
                {/* Subtle light reflection on hover (top-left to bottom-right). */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 35%, transparent 70%, rgba(167,243,208,0.10) 100%)",
                  }}
                />

                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 inline-flex items-center justify-center rounded-2xl bg-brand-mint text-brand-navy transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3",
                    isFeature ? "size-14" : "size-11",
                  )}
                >
                  <Icon className={isFeature ? "size-7" : "size-5"} aria-hidden="true" />
                </div>

                {/* Title */}
                <h3
                  className={cn(
                    "relative z-10 mt-4 font-semibold tracking-tight text-foreground",
                    isFeature ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
                  )}
                >
                  {service.title}
                </h3>

                {/* Description */}
                <p
                  className={cn(
                    "relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground",
                    isFeature && "sm:text-base",
                  )}
                >
                  {service.description}
                </p>

                {/* CTA + decorative visual at the bottom */}
                <div className="relative z-10 mt-auto pt-5">
                  <a
                    href="#book"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue transition-colors hover:text-brand-teal"
                  >
                    Learn more
                    <ArrowRight
                      className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </a>
                </div>

                {/* Card-specific decorative visual */}
                {service.visual}
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
