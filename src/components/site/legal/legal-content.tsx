"use client";

import * as React from "react";
import { siteConfig } from "@/lib/site-config";

/**
 * Legal content registry.
 * -----------------------
 * One component per legal page. Each is rendered inside the LegalModal
 * dialog body. The content is intentionally written to MATCH THE ACTUAL
 * IMPLEMENTATION (audit Parts 25 / 26 / 11):
 *
 *   - Brand: "GetSetGrades" (we do NOT invent a company / GSTIN / office
 *     address / legal entity / certification).
 *   - Grievance Officer: Nishtha Pandey.
 *   - Contact: heygetsetgrades@zohomail.in / +91 92176 14813.
 *   - Third-party processors actually used:
 *       * Database (PostgreSQL in production; SQLite in local dev).
 *       * Resend (transactional email).
 *       * Groq (AI chat, server-side only, opt-in).
 *       * PayPal (hosted Payment Link).
 *       * Upstash Redis (rate limiting, optional).
 *   - AI processing: prompts are sent to Groq; conversations are NOT
 *     stored by GetSetGrades; PII should not be included in prompts.
 *   - Payment: bookings start as `pending`, move to `pending_payment`
 *     when the user clicks the hosted-checkout link, and only become
 *     `paid` only after an authenticated admin manually verifies the PayPal transaction.
 *   - Cookies: only essential cookies + localStorage preferences. No
 *     analytics / marketing scripts.
 *   - We do NOT claim "fully DPDP compliant" / "GDPR compliant" — we
 *     describe what we actually do.
 *
 * Last updated: September 2026 (kept stable per audit unless content
 * materially changes).
 */

export type LegalContentKey =
  | "privacy"
  | "terms"
  | "refund"
  | "cookies"
  | "acceptable-use"
  | "grievance";

const LAST_UPDATED = siteConfig.lastUpdated;
const EMAIL = siteConfig.contact.email;
const WHATSAPP = siteConfig.contact.whatsappDisplay;

/* ------------------------------------------------------------------ */
/* Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 text-lg font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
      {children}
    </ul>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

function Updated() {
  return (
    <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
      Last updated: {LAST_UPDATED}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Privacy Policy                                                     */
/* ------------------------------------------------------------------ */

function PrivacyPolicy() {
  return (
    <div>
      <P>
        GetSetGrades (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates an online
        academic-support and tutoring website at{" "}
        <Strong>{siteConfig.url}</Strong>. This Privacy Policy explains what
        information we collect, how we use it, and the choices you have.
      </P>

      <H2>Information we collect</H2>
      <P>
        When you submit a contact, support, booking, or grievance request, we
        collect the information you provide: your name, email address,
        WhatsApp number, subject, education level, a description of what you
        need help with, and (for bookings) timing, timezone, and session
        preferences.
      </P>
      <P>
        We also collect a salted hash of your IP address for abuse
        prevention. We do <Strong>not</Strong> store raw IP addresses.
      </P>
      <P>
        We do <Strong>not</Strong> collect or store payment card details.
        Payment is handled entirely by our payment provider&rsquo;s hosted
        checkout page.
      </P>

      <H2>How we use your information</H2>
      <UL>
        <li>To review your request and assign a suitable tutor.</li>
        <li>To respond to you by email or WhatsApp.</li>
        <li>To send you a notification when your booking is confirmed.</li>
        <li>To prevent abuse and rate-limit automated requests.</li>
        <li>To respond to grievance and refund requests.</li>
      </UL>

      <H2>Third-party processors</H2>
      <P>
        We rely on the following third-party services to operate. Each
        processor receives only the data necessary for its function:
      </P>
      <UL>
        <li>
          <Strong>Database hosting.</Strong> Your request data is stored in a
          database (PostgreSQL in production; SQLite in local development).
        </li>
        <li>
          <Strong>Transactional email (Resend).</Strong> When you submit a
          request, we send a notification email to{" "}
          <a
            className="font-medium text-foreground underline-offset-2 hover:underline"
            href={`mailto:${EMAIL}`}
          >
            {EMAIL}
          </a>{" "}
          via Resend. The email contains your name, email, subject, and
          message — it does <Strong>not</Strong> contain payment data.
        </li>
        <li>
          <Strong>Payment provider.</Strong> When you proceed to payment, you
          are redirected to our payment provider&rsquo;s hosted checkout. The
          provider processes your card. For this PayPal Payment Link, we verify the transaction manually in the admin dashboard. We never see or store your card.
        </li>
        <li>
          <Strong>Rate-limiting (Upstash Redis, optional).</Strong> If
          enabled, a hashed identifier is sent to Upstash to enforce
          per-IP rate limits across all server instances.
        </li>
      </UL>

      <H2>AI chat (optional)</H2>
      <P>
        If you use the optional GetSetGrades AI chat, the messages you send are
        forwarded to our AI provider (<Strong>Groq</Strong>) on the server.
        Please read this carefully:
      </P>
      <UL>
        <li>
          Your prompts are sent to Groq for processing. Groq may process them
          in accordance with its own privacy policy.
        </li>
        <li>
          GetSetGrades does <Strong>not</Strong> persist your conversations.
          Each request is processed and discarded; no chat history is stored
          in our database.
        </li>
        <li>
          Do not include unnecessary personal information (such as your
          email, phone number, payment data, or government IDs) in AI
          prompts. We do not need it and you should not share it.
        </li>
        <li>
          The server injects its own system prompt; you cannot override it.
        </li>
        <li>
          We log only the endpoint, timestamp, reference, and result status.
          We do <Strong>not</Strong> log your prompts or the AI&rsquo;s
          responses.
        </li>
      </UL>

      <H2>Data retention</H2>
      <P>
        We retain request data (contact, support, booking, grievance) for as
        long as needed to provide the service and respond to follow-up
        questions, and afterwards for a reasonable period to handle any
        disputes or grievance redressal. Bookings retain their payment
        status and reference for accounting and refund purposes.
      </P>
      <P>
        We do not currently run an automated deletion scheduler. If you want
        your data deleted sooner, email us at{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${EMAIL}`}
        >
          {EMAIL}
        </a>{" "}
        and we will action it within a reasonable time.
      </P>

      <H2>Cookies and local storage</H2>
      <P>
        We use only essential cookies and browser localStorage preferences
        (such as whether you have dismissed the cookie banner). We do{" "}
        <Strong>not</Strong> load analytics, marketing, or advertising
        scripts. See the Cookie Policy for details.
      </P>

      <H2>Your choices</H2>
      <UL>
        <li>You may decline to submit a request at any time.</li>
        <li>
          You may email us to request access to, correction of, or deletion
          of your data.
        </li>
        <li>
          You may use the site without using the AI chat feature. The core
          tutoring service does not depend on AI.
        </li>
      </UL>

      <H2>Children&rsquo;s privacy</H2>
      <P>
        GetSetGrades is intended for students aged 16 and above. If you are
        under 18, please use the service with a parent or guardian&rsquo;s
        involvement.
      </P>

      <H2>International transfers</H2>
      <P>
        Your information may be processed by our third-party providers in
        countries other than your own. By using GetSetGrades, you acknowledge
        that your data may be transferred and processed in those
        jurisdictions.
      </P>

      <H2>Contact</H2>
      <P>
        For privacy questions or requests, email{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${EMAIL}`}
        >
          {EMAIL}
        </a>{" "}
        or message us on WhatsApp at {WHATSAPP}.
      </P>

      <P>
        We have written this policy to accurately describe what we do. We do
        not claim formal compliance with any specific privacy framework
        unless and until a legal review confirms it.
      </P>

      <Updated />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Terms & Conditions                                                 */
/* ------------------------------------------------------------------ */

function TermsConditions() {
  return (
    <div>
      <P>
        These Terms &amp; Conditions govern your use of the GetSetGrades
        website and our academic-support services. By using the site or
        submitting a request, you agree to these terms.
      </P>

      <H2>1. The service we provide</H2>
      <P>
        GetSetGrades provides online, one-to-one tutoring and academic support.
        We help you understand concepts, work through problems, plan study
        schedules, prepare for exams, and improve your writing and research.
      </P>
      <P>
        We agree a time, assign a suitable tutor for your subject, and
        deliver the session online. Tutor assignment is done by our team
        based on your subject and requirements — it is not an automated
        process.
      </P>

      <H2>2. What GetSetGrades will not do</H2>
      <P>
        We will not impersonate students, take exams on behalf of students,
        complete proctored or graded assessments for submission as your own
        work, or facilitate plagiarism or academic fraud. Our service is
        educational support, not a substitute for your own honest academic
        effort.
      </P>
      <P>
        Detailed rules are in the Acceptable Use / Academic Integrity
        policy. Misuse of the service may result in refusal or termination
        without refund.
      </P>

      <H2>3. Booking and payment</H2>
      <P>
        When you submit a booking, we create a record with status{" "}
        <Strong>pending</Strong>. When you proceed to the hosted checkout,
        the status moves to <Strong>pending_payment</Strong>. The booking
        becomes <Strong>paid</Strong> only after our authenticated admin
        verifies the PayPal transaction — not merely because you clicked the
        payment link.
      </P>
      <P>
        We reserve the right to refuse a booking before payment is
        confirmed. In that case, any payment you have made will be refunded
        per the Refund Policy.
      </P>
      <P>
        We never store your card details. All card processing is handled by
        our payment provider.
      </P>

      <H2>4. Session conduct</H2>
      <UL>
        <li>Sessions are online and one-to-one.</li>
        <li>Be on time. If you cannot attend, tell us in advance so we can reschedule.</li>
        <li>Treat your tutor with respect. Abusive behaviour may end the session without refund.</li>
        <li>Session materials are for your own learning. Do not redistribute them.</li>
      </UL>

      <H2>5. Rescheduling and cancellation</H2>
      <P>
        See the Refund Policy for the full rescheduling and cancellation
        rules. In short: tell us as early as possible by email or WhatsApp.
      </P>

      <H2>6. Limitation of liability</H2>
      <P>
        GetSetGrades provides educational support. We do not guarantee any
        specific academic outcome, grade, or result. To the maximum extent
        permitted by law, our liability is limited to the amount you paid
        for the session in dispute.
      </P>

      <H2>7. Third-party services</H2>
      <P>
        The site uses third-party services for email delivery, payment
        processing, AI chat (optional), and rate-limiting. Each operates
        under its own terms and privacy policy. We are not responsible for
        their separate practices.
      </P>

      <H2>8. Changes to these terms</H2>
      <P>
        We may update these terms from time to time. Material changes will
        be reflected by updating the &ldquo;Last updated&rdquo; date at the
        bottom of this page.
      </P>

      <H2>9. Contact</H2>
      <P>
        Questions about these terms? Email{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${EMAIL}`}
        >
          {EMAIL}
        </a>{" "}
        or WhatsApp {WHATSAPP}.
      </P>

      <Updated />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Refund Policy                                                      */
/* ------------------------------------------------------------------ */

function RefundPolicy() {
  return (
    <div>
      <P>
        We want you to be happy with GetSetGrades. This Refund Policy explains
        when refunds are available and how they are processed.
      </P>

      <H2>1. Before the session starts</H2>
      <P>
        If you cancel <Strong>before</Strong> a session has started and we
        cannot find a mutually convenient time to reschedule, you are
        eligible for a full refund. Email us at{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${EMAIL}`}
        >
          {EMAIL}
        </a>{" "}
        with your booking reference (GDB-XXXXXXXX) and we will process it.
      </P>

      <H2>2. After the session has started</H2>
      <P>
        If a session has already started, refunds are evaluated case by
        case. If the session could not be delivered (for example, the tutor
        did not attend, or the platform failed and we could not
        reschedule), you are eligible for a full refund or a rescheduled
        session at your choice.
      </P>
      <P>
        If the session was delivered and you simply changed your mind, a
        refund is not guaranteed. Email us and we will review.
      </P>

      <H2>3. Rescheduling</H2>
      <P>
        You can reschedule a session by emailing or WhatsApp-ing us at
        least 24 hours before the scheduled start. We will find another
        time. Rescheduling is free.
      </P>

      <H2>4. Service not delivered</H2>
      <P>
        If we fail to deliver a paid session (tutor no-show, platform
        outage, or we cannot match you with a tutor), you receive a full
        refund or a rescheduled session at your choice.
      </P>

      <H2>5. Duplicate payment</H2>
      <P>
        If you were charged twice for the same booking, email us with both
        payment references and we will refund the duplicate in full.
      </P>

      <H2>6. Unauthorized payment</H2>
      <P>
        If you believe a charge was unauthorized, email us immediately and
        also contact your card issuer. We will cooperate with the
        provider&rsquo;s chargeback process.
      </P>

      <H2>7. Refund processing time</H2>
      <P>
        Approved refunds are processed back to the original payment method.
        Depending on your bank and the payment provider, refunds typically
        take 5&ndash;10 business days to appear on your statement. We do
        not promise shorter timelines than the banking system allows.
      </P>

      <H2>8. How to request a refund</H2>
      <P>
        Email{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${EMAIL}`}
        >
          {EMAIL}
        </a>{" "}
        with your booking reference (GDB-XXXXXXXX), the date of the session,
        and a short description of the issue. You can also raise a formal
        grievance via the Grievance Redressal policy.
      </P>

      <Updated />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cookie Policy                                                      */
/* ------------------------------------------------------------------ */

function CookiePolicy() {
  return (
    <div>
      <P>
        GetSetGrades uses only <Strong>essential</Strong> cookies and browser
        localStorage preferences. We do <Strong>not</Strong> use analytics,
        marketing, or advertising cookies. We do not load third-party
        tracking scripts.
      </P>

      <H2>What we use</H2>
      <UL>
        <li>
          <Strong>localStorage preference.</Strong> When you dismiss the
          cookie banner, we record that decision in your browser&rsquo;s
          localStorage so we do not show it again. This never leaves your
          device.
        </li>
        <li>
          <Strong>Essential session cookies.</Strong> If we add login or
          session features in the future, essential cookies will be required
          for the site to function. They are not used for tracking.
        </li>
      </UL>

      <H2>What we do not use</H2>
      <UL>
        <li>No Google Analytics, Mixpanel, or similar.</li>
        <li>No Meta Pixel, LinkedIn Insight, or ad-platform scripts.</li>
        <li>No third-party chat widgets that set tracking cookies.</li>
      </UL>

      <H2>Third-party embedded content</H2>
      <P>
        Links to WhatsApp open <code>wa.me</code> in a new tab. WhatsApp&rsquo;s
        own cookies may apply on their site; we do not control them. We do
        not embed third-party iframes on the homepage.
      </P>

      <H2>Changes to this policy</H2>
      <P>
        If we add non-essential cookies in the future, we will update this
        policy, request your consent before loading them, and provide a way
        to opt out.
      </P>

      <Updated />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Acceptable Use / Academic Integrity                               */
/* ------------------------------------------------------------------ */

function AcceptableUse() {
  return (
    <div>
      <P>
        GetSetGrades is an academic-support service. This page describes how
        you may and may not use it. Academic integrity belongs here and in
        the Terms &amp; Conditions — not on the homepage marketing surface.
      </P>

      <H2>What GetSetGrades will help with</H2>
      <UL>
        <li>Understanding concepts you struggle with.</li>
        <li>Working through problems step by step.</li>
        <li>Planning study schedules and revision.</li>
        <li>Practising with sample questions.</li>
        <li>Improving the clarity, structure, and grammar of your writing.</li>
        <li>Research guidance, project direction, and documentation help.</li>
        <li>Feedback on your own work.</li>
      </UL>

      <H2>What GetSetGrades will not do</H2>
      <UL>
        <li>Impersonate you in a live class, exam, or proctored assessment.</li>
        <li>Take exams or complete graded assessments on your behalf.</li>
        <li>Produce work for you to submit as your own without disclosure.</li>
        <li>Facilitate plagiarism or academic fraud.</li>
        <li>Share credentials, write entire dissertations, or otherwise substitute for your own honest effort.</li>
      </UL>

      <H2>Your responsibility</H2>
      <P>
        You are responsible for complying with your own institution&rsquo;s
        academic-integrity policies. If you are unsure whether a particular
        use is allowed, ask your instructor first. We are happy to help you
        understand material; we will not help you misrepresent someone
        else&rsquo;s work as your own.
      </P>

      <H2>Consequences of misuse</H2>
      <P>
        If we learn that you have used the service to facilitate academic
        dishonesty, we may refuse future sessions and, where a session has
        not yet been delivered, refund the relevant payment minus any
        non-refundable platform fees.
      </P>

      <H2>AI chat</H2>
      <P>
        If you use the optional GetSetGrades AI chat, the same rules apply. The
        AI will refuse to complete graded assessments, take exams, or
        produce work intended for submission as your own. It is intended for
        explanation and learning support only.
      </P>

      <Updated />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grievance Redressal                                                */
/* ------------------------------------------------------------------ */

function GrievanceRedressal() {
  return (
    <div>
      <P>
        If you have a complaint about a GetSetGrades session, payment, or any
        other aspect of the service, we want to hear from you. This page
        explains how to raise a grievance and what to expect.
      </P>

      <H2>How to raise a grievance</H2>
      <P>
        Send an email to{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${siteConfig.contact.grievanceEmail}`}
        >
          {siteConfig.contact.grievanceEmail}
        </a>{" "}
        with the subject &ldquo;Grievance&rdquo; and the following details:
      </P>
      <UL>
        <li>Your name and email.</li>
        <li>Your booking reference (GDB-XXXXXXXX) if relevant.</li>
        <li>A short description of the issue.</li>
        <li>Whether you prefer to be contacted by email or WhatsApp.</li>
      </UL>
      <P>
        You can also use the grievance form (linked from the homepage footer
        under &ldquo;File a Grievance&rdquo;) which creates a ticket
        reference (GDT-XXXXXXXX).
      </P>

      <H2>Acknowledgement</H2>
      <P>
        We acknowledge every grievance within 1&ndash;2 business days. The
        acknowledgement will include your ticket reference and the channel
        we will use to follow up.
      </P>

      <H2>Resolution timeline</H2>
      <P>
        We aim to resolve grievances within 7 business days. Complex cases
        (for example, those requiring input from a payment provider) may
        take longer; we will keep you updated.
      </P>

      <H2>Grievance Officer</H2>
      <P>
        <strong className="text-foreground">{siteConfig.contact.grievanceOfficerName}</strong>{" "}
        is GetSetGrades&apos;s designated Grievance Officer and is responsible
        for reviewing and resolving complaints raised through this policy.
      </P>
      <P>
        Email:{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${siteConfig.contact.grievanceEmail}`}
        >
          {siteConfig.contact.grievanceEmail}
        </a>
      </P>

      <H2>Escalation</H2>
      <P>
        If you are not satisfied with the resolution, you may reply to the
        ticket and ask for it to be reviewed again by the Grievance Officer
        named above.
      </P>

      <H2>Refunds during grievance</H2>
      <P>
        If your grievance is about a charge you believe was wrong, see the
        Refund Policy. We will not delay refund processing while a
        grievance is open if the refund is clearly owed.
      </P>

      <H2>Contact</H2>
      <P>
        Email:{" "}
        <a
          className="font-medium text-foreground underline-offset-2 hover:underline"
          href={`mailto:${siteConfig.contact.grievanceEmail}`}
        >
          {siteConfig.contact.grievanceEmail}
        </a>
        <br />
        WhatsApp: {WHATSAPP}
      </P>

      <Updated />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Registry                                                           */
/* ------------------------------------------------------------------ */

export const legalContentRegistry: Record<
  LegalContentKey,
  React.ComponentType
> = {
  privacy: PrivacyPolicy,
  terms: TermsConditions,
  refund: RefundPolicy,
  cookies: CookiePolicy,
  "acceptable-use": AcceptableUse,
  grievance: GrievanceRedressal,
};
