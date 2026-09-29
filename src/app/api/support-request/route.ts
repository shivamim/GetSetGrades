import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimitAsync } from "@/lib/rate-limit";
import { buildSupportRequestEmail, sendNotificationEmail } from "@/lib/email";
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

// 20 KB max — support requests can have a longer description.
const MAX_BYTES = 20 * 1024;

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

const supportRequestSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    email: z.email(),
    whatsapp: z.string().regex(/^[+\d][\d\s-]{6,20}$/),
    country: z.string().max(80).optional(),
    subject: z.string().max(200),
    supportType: z.enum(SUPPORT_TYPES),
    educationLevel: z.enum(EDUCATION_LEVELS),
    description: z.string().max(5000).optional(),
    deadline: z.string().max(100).optional(),
    budget: z.string().max(100).optional(),
    company_website: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const endpoint = "/api/support-request";
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
    return okResponse(generateReference("GDS"));
  }

  const parsed = supportRequestSchema.safeParse(body);
  if (!parsed.success) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "validation" });
    return validationErrorResponse(flattenZodError(parsed.error));
  }
  const data = parsed.data;

  const reference = generateReference("GDS");
  const ipHash = hashIp(ip);

  try {
    await db.supportRequest.create({
      data: {
        reference,
        ipHash,
        fullName: sanitizeString(data.fullName),
        email: sanitizeString(data.email).toLowerCase(),
        whatsapp: sanitizeString(data.whatsapp),
        country: sanitizeString(data.country) || null,
        subject: sanitizeString(data.subject),
        supportType: data.supportType,
        educationLevel: data.educationLevel,
        description: sanitizeString(data.description) || null,
        deadline: sanitizeString(data.deadline) || null,
        budget: sanitizeString(data.budget) || null,
        status: "new",
      },
    });
  } catch (err) {
    const logId = newLogId();
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(`[support-request] persistence failed logid=${logId} err=${name}`);
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "error", logId });
    return serverErrorResponse(logId);
  }

  await sendNotificationEmail({
    to: siteConfig.contact.email,
    ...buildSupportRequestEmail({
      reference,
      fullName: data.fullName,
      email: data.email,
      subject: data.subject,
      supportType: data.supportType,
      educationLevel: data.educationLevel,
      country: data.country,
      deadline: data.deadline,
      budget: data.budget,
      description: data.description,
    }),
  });

  safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "ok" });
  return okResponse(reference);
}

export async function GET() {
  return methodNotAllowedResponse(["POST"]);
}
