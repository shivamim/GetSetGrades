import {
  GraduationCap,
  Globe,
  HeartHandshake,
  Laptop,
  MessageSquare,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

interface TrustSignal {
  label: string;
  icon: LucideIcon;
}

const trustSignals: TrustSignal[] = [
  { label: "Personalized support", icon: HeartHandshake },
  { label: "Secure payments", icon: ShieldCheck },
  { label: "Online sessions", icon: Laptop },
  { label: "Clear communication", icon: MessageSquare },
  { label: "Student-first approach", icon: GraduationCap },
  { label: "Worldwide support", icon: Globe },
];

/**
 * Thin strip of honest trust signals (no fake stats).
 * On mobile the row scrolls horizontally with a slim scrollbar; on desktop it
 * becomes a 6-up grid.
 */
export function TrustSection() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="border-y border-border bg-card/40"
    >
      <h2 id="trust-heading" className="sr-only">
        Why students choose GetSetGrades
      </h2>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <ul
          className="scrollbar-slim flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:pb-0"
          role="list"
        >
          {trustSignals.map((signal) => {
            const Icon = signal.icon;
            return (
              <li
                key={signal.label}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft md:shrink md:flex-col md:items-center md:gap-2 md:px-3 md:py-4 md:text-center"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--brand-mint)_45%,transparent)] text-[var(--brand-navy)]">
                  <Icon className="size-5" />
                </span>
                <span className="whitespace-nowrap text-sm font-medium text-foreground">
                  {signal.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default TrustSection;
