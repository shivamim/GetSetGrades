/**
 * Transactional email helper for GetSetGrades.
 *
 * Production provider: Resend (https://resend.com). The integration is a
 * thin `fetch` wrapper around `https://api.resend.com/emails` using a
 * server-only Bearer token.
 *
 * Design rules (audit Part 15):
 *   - NEVER throw if email fails. The DB submission is the source of truth;
 *     email is a best-effort notification. A failure here MUST NOT lose the
 *     user's request.
 *   - NEVER expose the API key, the email body, or the recipient address in
 *     logs. We log only the provider's HTTP status (or error name).
 *   - If env vars are missing, return `{ ok: false, reason: "not-configured" }`
 *     and DO NOT throw. Callers treat this the same as success (DB-first).
 *   - `EMAIL_FROM` MUST be an address authorized by the Resend account.
 *     We do not pretend `noreply@getsetgrades.example` works.
 */

export type EmailResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "send-failed" };

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  /** Optional short label used in the operator log line (never the body). */
  logLabel?: string;
};

const RESEND_URL = "https://api.resend.com/emails";
const PROVIDER_KEY = process.env.EMAIL_PROVIDER_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_TO_FALLBACK = process.env.EMAIL_TO;

/**
 * Whether a real provider is configured. Exposed so route handlers can
 * include a small `emailNotConfigured` flag in their safe log line without
 * having to re-check env vars themselves.
 */
export function isEmailConfigured(): boolean {
  return Boolean(PROVIDER_KEY && EMAIL_FROM);
}

/**
 * Send a transactional notification email.
 *
 * Always resolves (never throws). Failures return `{ ok: false, reason }`.
 * Callers MUST treat a non-throwing result the same regardless of `ok`:
 * the DB submission already happened and is the durable record.
 */
export async function sendNotificationEmail(args: SendArgs): Promise<EmailResult> {
  const { to, subject, text, logLabel = "notification" } = args;

  // No provider configured — graceful no-op.
  if (!PROVIDER_KEY || !EMAIL_FROM) {
    // Single, privacy-safe line. We do NOT log `to` / `subject` / body.
    console.log(`[email] skipped (not-configured) label=${logLabel}`);
    return { ok: false, reason: "not-configured" };
  }

  // If the caller passed an empty recipient, fall back to the env default.
  const recipient = to || EMAIL_TO_FALLBACK || "";
  if (!recipient) {
    console.log(`[email] skipped (no-recipient) label=${logLabel}`);
    return { ok: false, reason: "not-configured" };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PROVIDER_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: recipient,
        subject,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // Log only the status — NEVER the body (could leak provider diagnostics
      // or echoed PII).
      console.error(
        `[email] provider non-2xx label=${logLabel} status=${res.status}`,
      );
      return { ok: false, reason: "send-failed" };
    }

    return { ok: true };
  } catch (err) {
    // Log only the error NAME (never the message, which can leak URL/headers).
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(`[email] send failed label=${logLabel} err=${name}`);
    return { ok: false, reason: "send-failed" };
  }
}

// ----------------------------------------------------------------
// Convenience builders for the three notification templates.
// These keep email subjects / bodies consistent across routes and
// centralise the "what is safe to include" decision.
// ----------------------------------------------------------------

export function buildContactEmail(args: {
  reference: string;
  name: string;
  email: string;
  service: string;
  whatsapp: string;
  message: string;
}): { subject: string; text: string; logLabel: string } {
  return {
    subject: `New GetSetGrades enquiry — ${args.reference}`,
    logLabel: "contact",
    text: [
      `New GetSetGrades enquiry received.`,
      ``,
      `Reference: ${args.reference}`,
      `Name: ${args.name}`,
      `Email: ${args.email}`,
      `WhatsApp: ${args.whatsapp}`,
      `Service: ${args.service}`,
      ``,
      `Message:`,
      args.message,
    ].join("\n"),
  };
}

export function buildSupportRequestEmail(args: {
  reference: string;
  fullName: string;
  email: string;
  subject: string;
  supportType: string;
  educationLevel: string;
  country?: string;
  deadline?: string;
  budget?: string;
  description?: string;
}): { subject: string; text: string; logLabel: string } {
  return {
    subject: `New GetSetGrades support request — ${args.reference}`,
    logLabel: "support-request",
    text: [
      `New GetSetGrades support request received.`,
      ``,
      `Reference: ${args.reference}`,
      `Name: ${args.fullName}`,
      `Email: ${args.email}`,
      `Subject: ${args.subject}`,
      `Support type: ${args.supportType}`,
      `Education level: ${args.educationLevel}`,
      args.country ? `Country: ${args.country}` : "",
      args.deadline ? `Deadline: ${args.deadline}` : "",
      args.budget ? `Budget: ${args.budget}` : "",
      ``,
      `Description:`,
      args.description ?? "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildBookingEmail(args: {
  reference: string;
  service: string;
  fullName: string;
  email: string;
  supportType: string;
  educationLevel: string;
  sessionLength?: string;
  preferredTiming?: string;
  timezone?: string;
  country?: string;
  subject?: string;
  description?: string;
}): { subject: string; text: string; logLabel: string } {
  return {
    subject: `New GetSetGrades booking — ${args.reference}`,
    logLabel: "booking",
    text: [
      `New GetSetGrades booking received.`,
      ``,
      `Reference: ${args.reference}`,
      `Service: ${args.service}`,
      `Name: ${args.fullName}`,
      `Email: ${args.email}`,
      `Support type: ${args.supportType}`,
      `Education level: ${args.educationLevel}`,
      args.sessionLength ? `Session length: ${args.sessionLength}` : "",
      args.preferredTiming ? `Preferred timing: ${args.preferredTiming}` : "",
      args.timezone ? `Timezone: ${args.timezone}` : "",
      args.country ? `Country: ${args.country}` : "",
      args.subject ? `Subject: ${args.subject}` : "",
      ``,
      `Description:`,
      args.description ?? "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildGrievanceEmail(args: {
  ticketReference: string;
  subject: string;
  name: string;
  email: string;
  preferredContact: string;
  reference?: string;
  description: string;
}): { subject: string; text: string; logLabel: string } {
  return {
    subject: `New grievance received — ${args.ticketReference}`,
    logLabel: "grievance",
    text: [
      `New grievance received.`,
      ``,
      `Ticket: ${args.ticketReference}`,
      `Subject: ${args.subject}`,
      `From: ${args.name} <${args.email}>`,
      `Preferred contact: ${args.preferredContact}`,
      args.reference ? `Order/payment ref: ${args.reference}` : "",
      ``,
      `Description:`,
      args.description,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
