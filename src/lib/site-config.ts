/**
 * Centralized site configuration for GetSetGrades.
 * Anything that may change later (contact, payment links, etc.) lives here.
 * No secrets are stored in this file.
 *
 * Production URL handling (audit Part 28):
 *   - In production, `NEXT_PUBLIC_SITE_URL` MUST be set to the real canonical
 *     URL. If it is missing or still pointing at the placeholder, we warn
 *     loudly at module load (and the value falls back to a clearly-marked
 *     placeholder so the site still renders locally).
 *   - In development / test, the placeholder is acceptable.
 */

const RAW_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";

const PLACEHOLDER_URL = "https://getsetgrades.example";

function resolveSiteUrl(): string {
  const isProd = process.env.NODE_ENV === "production";
  if (RAW_URL && RAW_URL !== PLACEHOLDER_URL) return RAW_URL;
  if (isProd && (!RAW_URL || RAW_URL === PLACEHOLDER_URL)) {
    // Loud, explicit warning. We do NOT throw — the build should still
    // succeed so the operator can deploy and then set the env var. The
    // warning makes the missing-config state impossible to miss.
    console.warn(
      "[site-config] NEXT_PUBLIC_SITE_URL is not set in production. " +
        "Canonical URLs, sitemap and OpenGraph tags will use a placeholder. " +
        "Set NEXT_PUBLIC_SITE_URL to your real domain in your deployment env.",
    );
  }
  return RAW_URL || PLACEHOLDER_URL;
}

export const siteConfig = {
  name: "GetSetGrades",
  tagline: "Academic support, without the stress.",
  altTagline: "Learn it. Understand it. GetSetGrades.",
  url: resolveSiteUrl(),
  description:
    "GetSetGrades connects students with personalized online tutoring and academic support across programming, mathematics, writing, research, data, AI and more.",
  lastUpdated: "September 2026",

  contact: {
    // Verified Sept 2026 per owner instruction.
    email: "heygetsetgrades@zohomail.in",
    whatsappDisplay: "+91 92176 14813",
    whatsappNumber: "919217614813", // digits only for wa.me
    whatsappPrefill:
      "Hi GetSetGrades, I would like to know more about your academic support services.",
    privacyEmail: "heygetsetgrades@zohomail.in",
    grievanceEmail: "heygetsetgrades@zohomail.in",
    grievanceOfficerName: "Nishtha Pandey",
  },

  offer: {
    // Top announcement strip (audit: referral offer).
    enabled: true,
    text:
      "Refer a friend — once they complete their first session with us, we'll do one of your sessions absolutely free.",
    ctaLabel: "Refer now",
  },

  payment: {
    // Configurable hosted-checkout link. Loaded from env so it can be swapped
    // without code changes. Never store secrets here. This URL is INTENTIONALLY
    // public — it is the hosted checkout page, not a payment secret.
    hostedCheckoutUrl:
      process.env.NEXT_PUBLIC_PAYMENT_LINK ||
      "https://www.paypal.com/ncp/payment/K79KML66T654L",
    currency: "USD",
  },

  social: {
    // Only populated if real accounts exist. Left empty otherwise.
    // Do NOT render social icons in the footer/header when these are empty.
    instagram: "",
    linkedin: "",
    twitter: "",
    youtube: "",
  },

  nav: [
    { label: "Services", href: "#services" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ] as const,

  legalPages: [
    { key: "privacy", label: "Privacy Policy", href: "#legal-privacy" },
    { key: "terms", label: "Terms & Conditions", href: "#legal-terms" },
    { key: "refund", label: "Refund Policy", href: "#legal-refund" },
    { key: "cookies", label: "Cookie Policy", href: "#legal-cookies" },
    { key: "acceptable-use", label: "Acceptable Use", href: "#legal-acceptable-use" },
    { key: "grievance", label: "Grievance Redressal", href: "#legal-grievance" },
  ] as const,
} as const;

export type SiteConfig = typeof siteConfig;
export type LegalPageKey = (typeof siteConfig.legalPages)[number]["key"];
