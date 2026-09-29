"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OfferStrip } from "@/components/site/offer-strip";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { AiChatFab } from "@/components/site/ai-chat-fab";
import { CookieConsent } from "@/components/site/cookie-consent";
import { BackToTopButton } from "@/components/site/back-to-top-button";
import { HeroSection } from "@/components/site/sections/hero-section";
import { TrustSection } from "@/components/site/sections/trust-section";
import { AiSection } from "@/components/site/sections/ai-section";
import { ServicesSection } from "@/components/site/sections/services-section";
import { HowItWorksSection } from "@/components/site/sections/how-it-works-section";
import { TutorMatchingSection } from "@/components/site/sections/tutor-matching-section";
import { WhySection } from "@/components/site/sections/why-section";
import { AboutSection } from "@/components/site/sections/about-section";
import { StudentJourneySection } from "@/components/site/sections/student-journey-section";
import { ExpectSection } from "@/components/site/sections/expect-section";
import { FaqSection } from "@/components/site/sections/faq-section";
import { ContactSection } from "@/components/site/sections/contact-section";
import { FinalCtaSection } from "@/components/site/sections/final-cta-section";
import { BookingDialog } from "@/components/site/booking-dialog";
import { LegalModal } from "@/components/site/legal-modal";
import { GrievanceDialog } from "@/components/site/grievance-dialog";
import { siteConfig, type LegalPageKey } from "@/lib/site-config";

/**
 * Home page coordinator.
 *
 * Composition order (audit Part 47 — avoid "generic SaaS template"):
 *   1. Hero (the centerpiece — Part 1 redesign)
 *   2. Trust strip (thin, honest, no fake stats)
 *   3. Services (bento — Part 4)
 *   4. How It Works (connected line — Part 6)
 *   5. Tutor Matching (timeline — Part 5)
 *   6. Why GetSetGrades (bento — Part 7)
 *   7. About (Part: about)
 *   8. What to expect (3 cards — no testimonials placeholder)
 *   9. AI section (kept but subtle — Part 12, NOT the main focus)
 *  10. FAQ (positive only — Part 9)
 *  11. Contact (two-column glass — Part 8)
 *  12. Final CTA
 *
 * The "academic-integrity" section (integrity-section.tsx) is intentionally
 * NOT rendered here per audit Part 11 — academic-integrity rules belong in
 * the Acceptable Use / Terms legal pages, not on the marketing homepage.
 *
 * The testimonials placeholder ("Genuine testimonials will be added here…")
 * is intentionally NOT rendered per audit Part 10.
 *
 * The page is wrapped in `<main>` so the footer can sit at the bottom of
 * the viewport when content is short (sticky footer rule). The root
 * layout's `<body>` is `min-h-screen flex flex-col` and the footer uses
 * `mt-auto`.
 */
export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPageKey>("privacy");
  const [grievanceOpen, setGrievanceOpen] = useState(false);

  const legalKeys = useMemo(
    () => new Set<string>(siteConfig.legalPages.map((p) => p.key)),
    [],
  );

  const openBooking = useCallback(() => setBookingOpen(true), []);
  const openGrievance = useCallback(() => setGrievanceOpen(true), []);
  const openLegal = useCallback((key: LegalPageKey) => {
    setLegalPage(key);
    setLegalOpen(true);
  }, []);

  // Global click capture for in-page anchors that should open dialogs/modals
  // instead of scrolling (#book → booking, #grievance → grievance form,
  // #legal-* → legal modal).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement | null)?.closest(
        "a",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (href === "#book") {
        e.preventDefault();
        setBookingOpen(true);
      } else if (href === "#grievance") {
        e.preventDefault();
        setGrievanceOpen(true);
      } else if (href.startsWith("#legal-")) {
        const key = href.replace("#legal-", "") as LegalPageKey;
        if (legalKeys.has(key)) {
          e.preventDefault();
          setLegalPage(key);
          setLegalOpen(true);
        }
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [legalKeys]);

  // On first mount, honour any hash in the URL (e.g. a direct link to
  // /#book or /#legal-privacy).
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash === "book") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookingOpen(true);
    } else if (hash === "grievance") {
      setGrievanceOpen(true);
    } else if (hash.startsWith("legal-")) {
      const key = hash.replace("legal-", "") as LegalPageKey;
      if (legalKeys.has(key)) {
        setLegalPage(key);
        setLegalOpen(true);
      }
    }
  }, [legalKeys]);

  return (
    <>
      <OfferStrip />
      <SiteHeader onGetStarted={openBooking} />
      <main id="main" className="flex-1">
        <HeroSection onGetStarted={openBooking} />
        <TrustSection />
        <ServicesSection />
        <HowItWorksSection />
        <TutorMatchingSection />
        <WhySection />
        <AboutSection />
        <ExpectSection />
        <StudentJourneySection />
        <AiSection />
        <FaqSection />
        <ContactSection />
        <FinalCtaSection />
      </main>
      <SiteFooter onOpenLegal={openLegal} onOpenGrievance={openGrievance} />
      <WhatsAppFab />
      <AiChatFab />
      <BackToTopButton />
      <CookieConsent />
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onOpenLegal={openLegal}
      />
      <LegalModal
        open={legalOpen}
        onOpenChange={setLegalOpen}
        page={legalPage}
        onNavigate={setLegalPage}
      />
      <GrievanceDialog open={grievanceOpen} onOpenChange={setGrievanceOpen} />
    </>
  );
}
