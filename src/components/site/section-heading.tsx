"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionHeading
 * --------------
 * A shared, premium section header used across GetSetGrades sections.
 *
 * Layout:
 *   - Eyebrow row: a small uppercase label (e.g. "Tutor matching"), a
 *     brand-colored dot, and an optional mono section number on the right.
 *   - Title: large, semibold, tight tracking. Accepts ReactNode so callers
 *     can wrap a word in `<span className="brand-text-gradient">`.
 *   - Subtitle: muted, relaxed leading.
 *
 * Alignment:
 *   - `align="center"` (default) — center-aligned, used for section
 *     intros above a grid of cards.
 *   - `align="left"` — left-aligned, used in two-column layouts where the
 *     heading sits next to a card.
 *
 * Accessibility:
 *   - The title is rendered as an `<h2>` with the caller-supplied
 *     `headingId` so sibling sections can use `aria-labelledby`.
 *   - The eyebrow is a `<p>` (NOT a heading) to avoid heading-level spam.
 *   - The section number is `aria-hidden` — decorative only.
 */

type SectionHeadingProps = {
  /** Small uppercase eyebrow label. Optional. */
  eyebrow?: string;
  /** Optional mono section number like "01" / "AI". Decorative. */
  number?: string;
  /** Title — accepts ReactNode so callers can apply `.brand-text-gradient`. */
  title: React.ReactNode;
  /** Optional muted subtitle below the title. */
  subtitle?: React.ReactNode;
  /** Alignment. Defaults to "center". */
  align?: "center" | "left";
  /** id for the `<h2>` so the section can use `aria-labelledby`. */
  headingId?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  number,
  title,
  subtitle,
  align = "center",
  headingId,
  className,
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isCenter ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {/* Eyebrow row */}
      {(eyebrow || number) && (
        <div
          className={cn(
            "flex w-full items-center gap-3",
            isCenter ? "justify-center" : "justify-start",
          )}
        >
          {eyebrow && (
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-brand-blue"
              />
              {eyebrow}
            </p>
          )}
          {number && (
            <span
              aria-hidden="true"
              className="ml-auto font-mono text-xs text-muted-foreground/70"
            >
              {number}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h2
        id={headingId}
        className={cn(
          "font-semibold tracking-tight text-foreground",
          "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
          isCenter ? "mx-auto max-w-2xl" : "max-w-xl",
        )}
      >
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p
          className={cn(
            "text-base leading-relaxed text-muted-foreground sm:text-lg",
            isCenter ? "mx-auto max-w-2xl" : "max-w-xl",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
