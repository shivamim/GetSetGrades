import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimitAsync } from "@/lib/rate-limit";
import { buildBookingEmail, sendNotificationEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";
import {
  flattenZodError,
  generateReference,
  getClientIp,
  hashIp,
  ipPrefix,
  isHoneypotFilled,
  isMethodAllowed,
  methodNotAllowedResponse,
  newLogId,
  okResponse,
  payloadTooLargeResponse,
  rateLimitResponse,
  readJsonBody,
  safeLog,
  sanitizeString,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// 20 KB max — booking has many fields but no file uploads.
const MAX_BYTES = 20 * 1024;

const BOOKING_SERVICES = [
  "Assignment Guidance",
  "Programming & Computer Science",
  "Mathematics",
  "Research & Projects",
  "Homework Support",
  "Quiz & Exam Preparation",
  "English & Writing Support",
  "Data & AI",
] as const;

const SUPPORT_TYPES = [
  "Tutoring",
  "Assignment Guidance",
  "Homework Support",
  "Quiz Preparation",
  "Exam Preparation",
  "Programming Help",
  "Mathematics Help",
  "Research / Project Guidance",
  "Data / AI Support",
  "English / Writing Support",
  "Other",
] as const;

const EDUCATION_LEVELS = [
  "High School",
  "Undergraduate",
  "Postgraduate",
  "Other",
] as const;

const SESSION_LENGTHS = ["30 min", "60 min", "90 min", "Custom"] as const;

const bookingSchema = z
  .object({
    service: z.enum(BOOKING_SERVICES),
    fullName: z.string().min(2).max(100),
    email: z.email(),
    whatsapp: z.string().regex(/^[+\d][\d\s-]{6,20}$/),
    country: z.string().max(80).optional(),
    subject: z.string().max(200).optional(),
    supportType: z.enum(SUPPORT_TYPES),
    educationLevel: z.enum(EDUCATION_LEVELS),
    description: z.string().max(5000).optional(),
    preferredTiming: z.string().max(100).optional(),
    timezone: z.string().max(80).optional(),
    sessionLength: z.enum(SESSION_LENGTHS).optional(),
    acknowledged: z.literal(true),
    company_website: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const endpoint = "/api/booking";
  const ip = getClientIp(req);
  const ipPrefixVal = ipPrefix(ip);

  if (!isMethodAllowed(req, ["POST"])) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "method" });
    return methodNotAllowedResponse(["POST"]);
  }

  // Booking is the heaviest flow (multi-step) — allow 10 / 60s.
  const rl = await rateLimitAsync(`${endpoint}:${ip}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "ratelimit" });
    return rateLimitResponse(rl.retryAfterMs);
  }

  const bodyRes = await readJsonBody(req, MAX_BYTES);
  if (!bodyRes.ok) {
    if (bodyRes.reason === "too-large") {
      safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "size" });
      return payloadTooLargeResponse();
    }
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "validation" });
    return validationErrorResponse({ _: "Invalid request body." });
  }
  const body = bodyRes.body;

  if (isHoneypotFilled((body as Record<string, unknown>)?.company_website)) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "honeypot" });
    return okResponse(generateReference("GDB"));
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "validation" });
    return validationErrorResponse(flattenZodError(parsed.error));
  }
  const data = parsed.data;

  const reference = generateReference("GDB");
  const ipHash = hashIp(ip);

  try {
    await db.booking.create({
      data: {
        reference,
        ipHash,
        service: data.service,
        fullName: sanitizeString(data.fullName),
        email: sanitizeString(data.email).toLowerCase(),
        whatsapp: sanitizeString(data.whatsapp),
        country: sanitizeString(data.country) || null,
        subject: sanitizeString(data.subject) || null,
        supportType: data.supportType,
        educationLevel: data.educationLevel,
        description: sanitizeString(data.description) || null,
        preferredTiming: sanitizeString(data.preferredTiming) || null,
        timezone: sanitizeString(data.timezone) || null,
        sessionLength: data.sessionLength ?? null,
        acknowledged: true,
        // This endpoint is called when the user submits the request and
        // proceeds to the hosted PayPal page, so the booking is explicitly
        // waiting for payment. It is never marked paid here.
        status: "pending_payment",
        paymentStatus: "pending",
      },
    });
  } catch (err) {
    const logId = newLogId();
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(`[booking] persistence failed logid=${logId} err=${name}`);
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "error", logId });
    return serverErrorResponse(logId);
  }

  await sendNotificationEmail({
    to: siteConfig.contact.email,
    ...buildBookingEmail({
      reference,
      service: data.service,
      fullName: data.fullName,
      email: data.email,
      supportType: data.supportType,
      educationLevel: data.educationLevel,
      sessionLength: data.sessionLength,
      preferredTiming: data.preferredTiming,
      timezone: data.timezone,
      country: data.country,
      subject: data.subject,
      description: data.description,
    }),
  });

  safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "ok" });
  // We return the hosted checkout URL too so the dialog can open it in a
  // new tab. This is a PUBLIC hosted-checkout URL — not a secret.
  return okResponse(reference, {
    paymentLink: siteConfig.payment.hostedCheckoutUrl,
    paymentStatus: "pending_payment",
  });
}

export async function GET() {
  return methodNotAllowedResponse(["POST"]);
}
