"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

/**
 * BackToTopButton — audit Part 44.
 *
 * Appears after the user has scrolled past ~400px. Smooth-scrolls to the
 * top of the page. Accessible label, glass styling, keyboard-focusable,
 * respects reduced motion (the smooth-scroll is handled by the browser,
 * which already respects `prefers-reduced-motion` via the global CSS rule
 * in globals.css).
 */
export function BackToTopButton() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onClick() {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll back to top"
      className="liquid-glass-pill fixed bottom-20 left-5 z-40 inline-flex size-11 items-center justify-center rounded-full text-foreground transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:bottom-24 sm:left-auto sm:right-24"
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}

export default BackToTopButton;
