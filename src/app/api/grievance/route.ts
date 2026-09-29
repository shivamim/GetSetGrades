import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimitAsync } from "@/lib/rate-limit";
import { buildGrievanceEmail, sendNotificationEmail } from "@/lib/email";
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

// 20 KB max — grievances have a description field.
const MAX_BYTES = 20 * 1024;

const PREFERRED_CONTACTS = ["Email", "WhatsApp"] as const;

const grievanceSchema = z
  .object({
    subject: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    reference: z.string().max(100).optional(),
    preferredContact: z.enum(PREFERRED_CONTACTS),
    name: z.string().min(2).max(100),
    email: z.email(),
    company_website: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const endpoint = "/api/grievance";
  const ip = getClientIp(req);
  const ipPrefixVal = ipPrefix(ip);

  if (!isMethodAllowed(req, ["POST"])) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "method" });
    return methodNotAllowedResponse(["POST"]);
  }

  const rl = await rateLimitAsync(`${endpoint}:${ip}`, {
    limit: 5,
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
    return okResponse(generateReference("GDT"));
  }

  const parsed = grievanceSchema.safeParse(body);
  if (!parsed.success) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "validation" });
    return validationErrorResponse(flattenZodError(parsed.error));
  }
  const data = parsed.data;

  const ticketReference = generateReference("GDT");
  const ipHash = hashIp(ip);

  try {
    await db.grievance.create({
      data: {
        ticketReference,
        ipHash,
        subject: sanitizeString(data.subject),
        description: sanitizeString(data.description),
        // `reference` is the user-supplied order/payment reference (optional).
        reference: sanitizeString(data.reference) || null,
        preferredContact: data.preferredContact,
        name: sanitizeString(data.name),
        email: sanitizeString(data.email).toLowerCase(),
        status: "open",
      },
    });
  } catch (err) {
    const logId = newLogId();
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(`[grievance] persistence failed logid=${logId} err=${name}`);
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "error", logId });
    return serverErrorResponse(logId);
  }

  await sendNotificationEmail({
    to: siteConfig.contact.grievanceEmail,
    ...buildGrievanceEmail({
      ticketReference,
      subject: data.subject,
      name: data.name,
      email: data.email,
      preferredContact: data.preferredContact,
      reference: data.reference,
      description: data.description,
    }),
  });

  safeLog({
    endpoint,
    ipPrefix: ipPrefixVal,
    reference: ticketReference,
    result: "ok",
  });
  return okResponse(ticketReference);
}

export async function GET() {
  return methodNotAllowedResponse(["POST"]);
}
