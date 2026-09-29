"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ScrollReveal
 * ------------
 * A tiny IntersectionObserver-based wrapper that fades + lifts its
 * children into view when they enter the viewport.
 *
 * Why not a library? The site needs exactly one behaviour: reveal once,
 * with a per-element delay. Framer Motion's `whileInView` would also work
 * but adds motion to the bundle for this small use-case. This is ~40 lines
 * and respects `prefers-reduced-motion` out of the box.
 *
 * Behaviour:
 *   - On mount, the element starts with the `.reveal` class (opacity:0,
 *     translateY(16px)) defined in globals.css.
 *   - When the IO callback fires with `isIntersecting`, the `.is-visible`
 *     class is added — the CSS transition handles the rest.
 *   - If `prefers-reduced-motion: reduce`, the wrapper short-circuits to
 *     always-visible (no observer, no transition).
 *   - `once` is true by default (we don't re-hide on scroll-back).
 *
 * The wrapper accepts an `as` prop (string tag name) so it can be a `<li>`,
 * `<div>`, `<article>`, etc. Default is `div`.
 */

type ScrollRevealProps = {
  as?: React.ElementType;
  children: React.ReactNode;
  /** Per-element stagger delay in ms. Default 0. */
  delay?: number;
  className?: string;
  /** Reveal only once (default true). */
  once?: boolean;
  // Allow arbitrary DOM passthrough.
  [key: string]: unknown;
};

export function ScrollReveal({
  as: Tag = "div",
  children,
  delay = 0,
  className,
  once = true,
  ...rest
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // matchMedia is only available client-side; this has to run
      // post-mount, it can't be derived during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  // We use a style transition-delay rather than a CSS class so each
  // instance can have its own delay without generating a class per delay.
  return (
    <Tag
      ref={ref as unknown as React.Ref<HTMLElement>}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default ScrollReveal;
