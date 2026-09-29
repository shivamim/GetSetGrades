"use client";

/**
 * LegalModal
 * ----------
 * A controlled Dialog that renders one of GetSetGrades's six legal pages.
 *
 * Why controlled + props (instead of reading the URL hash)?
 * ---------------------------------------------------------
 * The single-page constraint means there is only one real route (`/`).
 * Rather than coupling this modal to URL state, the page coordinator owns
 * a `legalPage` state and the `open` state, then passes them in. This
 * keeps the modal reusable and lets the footer / booking dialog trigger
 * it without manipulating the browser history.
 *
 * Props
 * -----
 * - open: boolean                       Dialog visibility
 * - onOpenChange: (open: boolean) => void
 * - page: LegalPageKey                  which legal page to show
 * - onNavigate?: (key: LegalPageKey) => void optional callback so the
 *   footer "switch to another policy" links can update the parent state.
 *
 * The booking dialog relies on `onNavigate` being wired so that the
 * `#legal-terms` / `#legal-refund` / `#legal-privacy` anchors in the
 * payment step actually swap the legal modal content.
 */
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { siteConfig, type LegalPageKey } from "@/lib/site-config";
import {
  legalContentRegistry,
  type LegalContentKey,
} from "@/components/site/legal/legal-content";

export interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: LegalPageKey;
  onNavigate?: (key: LegalPageKey) => void;
}

/* Map the site-config legal page keys to the registry keys.
 * They happen to match 1:1 today; the indirection is here in case the
 * site-config list diverges from the content registry. */
function resolveContent(page: LegalPageKey): LegalContentKey {
  switch (page) {
    case "privacy":
    case "terms":
    case "refund":
    case "cookies":
    case "acceptable-use":
    case "grievance":
      return page;
    default:
      return "privacy";
  }
}

function legalTitle(page: LegalPageKey): string {
  return (
    siteConfig.legalPages.find((p) => p.key === page)?.label ?? "Legal"
  );
}

export function LegalModal({
  open,
  onOpenChange,
  page,
  onNavigate,
}: LegalModalProps) {
  const Content = legalContentRegistry[resolveContent(page)];
  const title = legalTitle(page);

  // Footer links the OTHER legal pages (so users can jump between them).
  const otherPages = siteConfig.legalPages.filter((p) => p.key !== page);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-slim gap-0 p-0 sm:rounded-2xl"
        // shadcn Dialog provides focus trapping and ESC-to-close out of the box.
        aria-describedby="legal-modal-description"
      >
        <DialogHeader className="gap-1 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold">
            <span className="brand-text-gradient">{title}</span>
          </DialogTitle>
          <DialogDescription
            id="legal-modal-description"
            className="text-xs text-muted-foreground"
          >
            Last updated: {siteConfig.lastUpdated}. This information is provided
            for general informational purposes and does not constitute legal
            advice.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
          <Content />
        </div>

        <Separator />

        <DialogFooter className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <nav
            aria-label="Other legal pages"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          >
            {otherPages.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onNavigate?.(p.key)}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {p.label}
              </button>
            ))}
          </nav>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
