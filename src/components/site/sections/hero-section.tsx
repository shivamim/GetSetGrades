"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsappUrl, WhatsAppIcon } from "@/components/site/whatsapp";

/**
 * HeroSection — Part 1 redesign.
 *
 * The visual is ONE cohesive liquid-glass session panel:
 *   - "Your GetSetGrades session" panel containing:
 *       Mathematics / Quadratic Equations
 *       Tutor assigned  •  Today · 4:30 PM
 *       Session progress bar (66%)
 *       Next: Practice set →
 *   - ONE small floating status card "Tutor matched ✓" (top-right of panel).
 *   - ONE smaller contextual notification "Study plan updated" (below panel).
 *
 * Three depth layers:
 *   1. Ambient glow behind the panel (`.liquid-glass-ambient`).
 *   2. The main liquid-glass panel (`.liquid-glass`).
 *   3. The foreground floating status card (`.liquid-glass-floating`).
 *
 * Motion:
 *   - Main card: slow vertical float, 7s, ~4px (`.animate-glass-float`).
 *   - Status card: slightly different float, 9s (`.animate-glass-float-alt`).
 *   - Ambient glow: slow drift, 14s (`.animate-ambient-drift`).
 *   - Progress bar: animates 0 → 66% once on load (Framer Motion).
 *   - Status dot: subtle pulse (`.animate-status-pulse`).
 *   - All wrapped in `prefers-reduced-motion` guards.
 *
 * Desktop-only mouse parallax (2–5px) on glow + card + status. Disabled on
 * touch / mobile / reduced-motion.
 *
 * Visual hierarchy (audit Part 48):
 *   1. Headline (Academic support that actually gets things done.)
 *   2. Description
 *   3. Get Started CTA
 *   4. Tutor/session visual (the glass panel)
 *   5. Trust indicators (small glass pills near CTA)
 */

export interface HeroSectionProps {
  onGetStarted?: () => void;
}

const trustPills = [
  "One-to-one support",
  "Flexible sessions",
  "Students worldwide",
] as const;

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const whatsappUrl = getWhatsappUrl();
  const reduceMotion = useReducedMotion();

  // Desktop-only mouse parallax. Disabled on touch / mobile / reduced motion.
  const [parallax, setParallax] = React.useState({ x: 0, y: 0 });
  const [parallaxEnabled, setParallaxEnabled] = React.useState(false);

  React.useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === "undefined") return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    if (coarse || narrow) return;

    // matchMedia/pointer capability checks only resolve client-side, so
    // enabling parallax has to happen post-mount, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParallaxEnabled(true);

    function onMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      // Map cursor offset to a small ±5px shift. Very subtle.
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      setParallax({ x: dx * 5, y: dy * 5 });
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion]);

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative overflow-x-clip overflow-y-visible"
    >
      {/* Soft ambient mesh behind everything. Clipped by the section. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="mesh-gradient-bg absolute inset-0 opacity-80" />
        <div className="blob animate-drift-slow animate-breathe -left-24 -top-24 size-72 bg-brand-mint" />
        <div className="blob animate-drift-slower animate-breathe -right-32 top-0 size-80 bg-[color-mix(in_oklch,var(--brand-blue)_35%,transparent)]" />
      </div>

      {/* Hero container */}
      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 md:py-20 lg:px-10 lg:py-24">
        <div className="grid min-w-0 grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,580px)] lg:gap-16 xl:gap-20">

          {/* ============================================================ */}
          {/* LEFT — copy column. max-width 600px per audit Part 1.        */}
          {/* ============================================================ */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="flex min-w-0 flex-col items-start gap-6"
          >
            {/* Eyebrow glass badge with mint/blue dot. */}
            <motion.span variants={fadeUpVariants} className="eyebrow-glass">
              <span
                aria-hidden="true"
                className="relative flex size-2"
              >
                <span className="animate-status-pulse absolute inline-flex size-2 rounded-full bg-brand-mint" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-blue" />
              </span>
              Personalized academic support
            </motion.span>

            {/* Headline — desktop 64–76px (max ~82), tablet 52–60, mobile 40–50.
                Weight 650–750. No hard-coded line breaks. */}
            <motion.h1
              id="hero-heading"
              variants={fadeUpVariants}
              className="max-w-[600px] text-foreground"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
                fontWeight: 680,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
              }}
            >
              <motion.span variants={lineVariants} className="block">
                Academic support
              </motion.span>
              <motion.span variants={lineVariants} className="block">
                that actually gets
              </motion.span>
              <motion.span
                variants={lineVariants}
                className="brand-text-gradient-animated block"
              >
                things done.
              </motion.span>
            </motion.h1>

            {/* Description — max-width 500px per audit Part 1. */}
            <motion.p
              variants={fadeUpVariants}
              className="max-w-[500px] text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Personalized online tutoring and academic support built around
              your subject, goals and schedule. We&apos;ll match you with a
              suitable tutor and get your session moving.
            </motion.p>

            {/* CTAs. */}
            <motion.div
              variants={fadeUpVariants}
              className="flex w-full max-w-[600px] flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap"
            >
              {onGetStarted ? (
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="group cta-magnetic rounded-full bg-brand-navy text-white hover:bg-brand-blue"
                >
                  Get Started
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="group cta-magnetic rounded-full bg-brand-navy text-white hover:bg-brand-blue"
                >
                  <a href="#book">
                    Get Started
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="group liquid-glass-pill rounded-full border-transparent text-foreground transition-colors hover:border-[color-mix(in_oklch,var(--brand-mint)_60%,transparent)] hover:text-emerald-700"
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
            </motion.div>

            {/* Trust chips — subtle glass pills close to CTA. */}
            <motion.ul
              variants={fadeUpVariants}
              className="flex max-w-[600px] flex-wrap gap-2"
            >
              {trustPills.map((pill) => (
                <li
                  key={pill}
                  className="liquid-glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-foreground/80"
                >
                  <Check className="size-3.5 text-brand-blue" aria-hidden="true" />
                  {pill}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* ============================================================ */}
          {/* RIGHT — premium liquid-glass session panel.                  */}
          {/* max-width 580px per audit Part 1.                            */}
          {/* ============================================================ */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mt-8 w-full max-w-[580px] min-w-0 lg:mt-0"
            style={{
              transform: parallaxEnabled
                ? `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)`
                : undefined,
            }}
          >
            {/* Layer 1: ambient glow behind the panel. */}
            <div
              aria-hidden="true"
              className="liquid-glass-ambient animate-ambient-drift"
              style={{
                transform: parallaxEnabled
                  ? `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)`
                  : undefined,
              }}
            />

            {/* Layer 2: main liquid-glass panel.
                relative + z-10 so it sits above the ambient glow. */}
            <div
              className={reduceMotion ? "liquid-glass relative z-10 w-full rounded-3xl p-6 sm:p-7" : "liquid-glass animate-glass-float relative z-10 w-full rounded-3xl p-6 sm:p-7"}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Your GetSetGrades session
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--brand-mint)_45%,transparent)] px-2.5 py-1 text-[0.7rem] font-medium text-brand-navy">
                  <span className="relative flex size-1.5">
                    <span className="animate-status-pulse absolute inline-flex size-1.5 rounded-full bg-brand-blue" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-brand-navy" />
                  </span>
                  Live
                </span>
              </div>

              {/* Subject + topic */}
              <div className="mt-5">
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  Mathematics
                </p>
                <p className="text-sm text-muted-foreground">
                  Quadratic Equations
                </p>
              </div>

              {/* Tutor assigned + timing row */}
              <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand-blue" aria-hidden="true" />
                  Tutor assigned
                </span>
                <span aria-hidden="true" className="text-muted-foreground/40">•</span>
                <span>Today · 4:30 PM</span>
              </div>

              {/* Session progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium uppercase tracking-wider">
                    Session progress
                  </span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="font-mono text-sm font-medium text-foreground"
                  >
                    66%
                  </motion.span>
                </div>
                <div
                  className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--brand-mint)_55%,transparent)]"
                  role="progressbar"
                  aria-valuenow={66}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Session progress"
                >
                  <motion.div
                    className="relative h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-teal to-brand-mint"
                    initial={{ width: "0%" }}
                    animate={{ width: "66%" }}
                    transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              {/* Next row */}
              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                    Next
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    Practice set
                  </p>
                </div>
                <a
                  href="#book"
                  className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-blue transition-colors hover:text-brand-teal"
                >
                  <span>Start</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Layer 3: foreground floating status card (top-right of panel).
                ONE only — no duplicates, no random badges. */}
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.92 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              className={reduceMotion
                ? "liquid-glass-floating absolute -right-3 -top-5 z-20 inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-foreground sm:-right-6"
                : "liquid-glass-floating animate-glass-float-alt absolute -right-3 -top-5 z-20 inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-foreground sm:-right-6"}
              style={{
                transform: parallaxEnabled
                  ? `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)`
                  : undefined,
              }}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-brand-mint text-brand-navy">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              Tutor matched
              <span className="text-brand-blue" aria-hidden="true">✓</span>
            </motion.div>

            {/* Contextual notification below the panel (smaller, subtle). */}
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
              className="liquid-glass-pill absolute -bottom-4 left-6 z-20 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/80"
            >
              <span className="size-1.5 rounded-full bg-brand-mint" aria-hidden="true" />
              Study plan updated
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
