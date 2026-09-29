import type { NextConfig } from "next";

/**
 * Strict, production-safe Next.js configuration for GetSetGrades.
 *
 * - TypeScript errors FAIL the build (no ignoreBuildErrors).
 * - ESLint errors FAIL the build (no ignoreDuringBuilds).
 * - reactStrictMode is on (surfaces lifecycle bugs in dev).
 * - A focused Content-Security-Policy + security headerset is applied to
 *   every route via the `headers()` callback.
 * - `output: "standalone"` is kept so the project can be deployed as a
 *   self-contained server when needed (Vercel ignores this for its own
 *   build pipeline; it is harmless there).
 */

const cspDirectives = [
  "default-src 'self'",
  // Next.js (HMR, RSC payloads, inline scripts) + the inlined runtime
  // require 'unsafe-inline' on scripts. We DO NOT allow 'unsafe-eval'.
  "script-src 'self' 'unsafe-inline'",
  // Inline styles from Next.js + Tailwind + Framer Motion require
  // 'unsafe-inline' here. No 'unsafe-eval'.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Images may come from our own origin, the user's data: URIs, and
  // common image CDNs that Next.js Image uses.
  "img-src 'self' data: blob: https:",
  // Fonts: self + Google Fonts.
  "font-src 'self' data: https://fonts.gstatic.com",
  // Connect: same origin (API + RSC) + the third-party providers we use.
  // - api.groq.com  -> server-side only, but pre-listed for transparency.
  // - api.resend.com-> server-side only, but pre-listed for transparency.
  // (Browsers never call these directly because all requests go through
  //  our own /api routes; listing them is belt-and-suspenders.)
  "connect-src 'self'",
  // Frames: deny by default (we don't embed third-party iframes).
  "frame-src 'none'",
  "frame-ancestors 'none'",
  // Forms: only submit to our own origin.
  "form-action 'self'",
  // No plugins / legacy media.
  "object-src 'none'",
  "base-uri 'self'",
  // Restrict which origins can use sensitive browser features.
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  // HSTS: 1 year, include subdomains, preload-ready.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), payment=(self)",
  },
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // NEVER silence TS errors. Build MUST fail on type errors.
    ignoreBuildErrors: false,
  },
  // Note: in Next.js 16, ESLint during build is configured via
  // eslint.config.mjs (flat config). We do NOT pass `eslint.ignoreDuringBuilds`
  // here because (a) the property name was removed from NextConfig types in
  // Next 16, and (b) we want lint to FAIL the build on real errors.
  // Kept for non-Vercel deployments (Docker / bare metal). Vercel ignores it.
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
