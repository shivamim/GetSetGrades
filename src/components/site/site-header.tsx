"use client";

import * as React from "react";
import { Menu, X, Mail, ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { getWhatsappUrl, WhatsAppIcon } from "@/components/site/whatsapp";

/**
 * SiteHeader — floating glass navbar (audit Part 3).
 *
 * Desktop:
 *   - max-width ~1400px, centred, rounded 20–24px, liquid glass.
 *   - On scroll: smaller, more opaque, stronger shadow (the
 *     `.liquid-glass-nav-scrolled` class is swapped in).
 *   - Nav links: Services, How It Works, About, FAQ, Contact.
 *   - Right: WhatsApp, Email, Get Started.
 *
 * Mobile:
 *   - Compact brand + Get Started button.
 *   - Hamburger opens a glass Dialog menu (full focus management,
 *     keyboard-accessible, ESC to close — handled by shadcn Dialog).
 *   - No horizontal overflow.
 *
 * Accessibility:
 *   - `<header>` semantic.
 *   - Nav has `aria-label`.
 *   - Mobile menu toggle has `aria-expanded` + `aria-controls`.
 *   - Mobile dialog uses shadcn Dialog (Radix) for focus trap + restore.
 */

export interface SiteHeaderProps {
  onGetStarted?: () => void;
}

export function SiteHeader({ onGetStarted }: SiteHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const whatsappUrl = getWhatsappUrl();

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleGetStarted() {
    setMobileOpen(false);
    onGetStarted?.();
  }

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto w-full max-w-[1400px]">
        <nav
          aria-label="Primary"
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl px-3 py-2 transition-all duration-300 sm:px-4 sm:py-2.5",
            "liquid-glass-nav",
            scrolled && "liquid-glass-nav-scrolled py-1.5 sm:py-2",
          )}
        >
          {/* Brand */}
          <a
            href="#top"
            className="flex shrink-0 items-center gap-2 rounded-full px-1.5 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="GetSetGrades home"
          >
            <img
              src="/brand/getsetgrades-icon-32.png"
              srcSet="/brand/getsetgrades-icon-32.png 1x, /brand/getsetgrades-icon-192.png 2x"
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className="size-8 shrink-0"
            />
            <span className="text-base font-semibold tracking-tight text-foreground">
              GetSetGrades
            </span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 lg:flex">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop right cluster */}
          <div className="hidden items-center gap-1.5 lg:flex">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">WhatsApp</span>
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <a href={`mailto:${siteConfig.contact.email}`}>
                <Mail className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Email</span>
              </a>
            </Button>
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="group ml-1 rounded-full bg-brand-navy text-white hover:bg-brand-blue"
            >
              Get Started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>

          {/* Mobile: hamburger + compact Get Started */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="rounded-full bg-brand-navy px-3 text-white hover:bg-brand-blue"
            >
              Start
              <ArrowRight className="size-3.5" />
            </Button>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu — shadcn Dialog (focus trap + restore + ESC). */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          className="max-w-[90vw] gap-0 rounded-3xl p-0 sm:max-w-md"
          aria-describedby="mobile-nav-description"
        >
          <DialogTitle className="sr-only">GetSetGrades navigation</DialogTitle>
          <DialogDescription id="mobile-nav-description" className="sr-only">
            Site navigation menu. Use the links below to jump to a section,
            or close this dialog with the Escape key.
          </DialogDescription>

          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="flex items-center gap-2">
              <img
                src="/brand/getsetgrades-icon-32.png"
                srcSet="/brand/getsetgrades-icon-32.png 1x, /brand/getsetgrades-icon-192.png 2x"
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
                className="size-8 shrink-0"
              />
              <span className="text-base font-semibold tracking-tight">
                GetSetGrades
              </span>
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="size-5" />
            </button>
          </div>

          <ul className="flex flex-col gap-1 px-3 py-4">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
            <Button
              asChild
              variant="outline"
              className="rounded-full"
            >
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
              >
                <WhatsAppIcon className="size-4" />
                Chat on WhatsApp
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full"
            >
              <a
                href={`mailto:${siteConfig.contact.email}`}
                onClick={() => setMobileOpen(false)}
              >
                <Mail className="size-4" />
                {siteConfig.contact.email}
              </a>
            </Button>
            <Button
              onClick={handleGetStarted}
              className="group rounded-full bg-brand-navy text-white hover:bg-brand-blue"
            >
              Get Started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export default SiteHeader;
