import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimitAsync } from "@/lib/rate-limit";
import { buildContactEmail, sendNotificationEmail } from "@/lib/email";
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

// 10 KB max for contact (name + email + whatsapp + 2000-char message).
const MAX_BYTES = 10 * 1024;

const CONTACT_SERVICES = [
  "Tutoring",
  "Assignment Guidance",
  "Homework Support",
  "Programming Help",
  "Mathematics Help",
  "Research / Project Guidance",
  "English / Writing Support",
  "Other",
] as const;

const contactSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.email(),
    whatsapp: z.string().regex(/^[+\d][\d\s-]{6,20}$/),
    service: z.enum(CONTACT_SERVICES),
    message: z.string().min(10).max(2000),
    company_website: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const endpoint = "/api/contact";
  const ip = getClientIp(req);
  const ipPrefixVal = ipPrefix(ip);

  // 1. Method guard (reject GET etc. on this POST-only endpoint).
  if (!isMethodAllowed(req, ["POST"])) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "method" });
    return methodNotAllowedResponse(["POST"]);
  }

  // 2. Rate limit: 5 / 60s per ip+endpoint.
  const rl = await rateLimitAsync(`${endpoint}:${ip}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "ratelimit" });
    return rateLimitResponse(rl.retryAfterMs);
  }

  // 3. Read + size-limit the body.
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

  // 4. Honeypot — silently accept bots, return a real-looking reference,
  //    but do NOT persist or email anything.
  if (isHoneypotFilled((body as Record<string, unknown>)?.company_website)) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "honeypot" });
    return okResponse(generateReference("GDC"));
  }

  // 5. Validate.
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "validation" });
    return validationErrorResponse(flattenZodError(parsed.error));
  }
  const data = parsed.data;

  // 6. Generate reference, persist, send email (best-effort).
  const reference = generateReference("GDC");
  const ipHash = hashIp(ip);

  try {
    await db.contactMessage.create({
      data: {
        reference,
        ipHash,
        name: sanitizeString(data.name),
        email: sanitizeString(data.email).toLowerCase(),
        whatsapp: sanitizeString(data.whatsapp),
        service: data.service,
        message: sanitizeString(data.message),
        status: "new",
      },
    });
  } catch (err) {
    const logId = newLogId();
    // Log only the error NAME — never the message (could leak connection
    // strings or PII from Prisma's error text).
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(`[contact] persistence failed logid=${logId} err=${name}`);
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "error", logId });
    return serverErrorResponse(logId);
  }

  // Best-effort notification. NEVER throws; NEVER blocks the response.
  // We pass the operator's notification email from siteConfig (which itself
  // reads the canonical heygetsetgrades@zohomail.in).
  await sendNotificationEmail({
    to: siteConfig.contact.email,
    ...buildContactEmail({
      reference,
      name: data.name,
      email: data.email,
      service: data.service,
      whatsapp: data.whatsapp,
      message: data.message,
    }),
  });

  safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "ok" });
  return okResponse(reference);
}

// Reject any non-POST method at the route level too (belt-and-suspenders).
export async function GET() {
  return methodNotAllowedResponse(["POST"]);
}
