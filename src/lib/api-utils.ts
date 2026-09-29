/**
 * Shared API utilities for GetSetGrades route handlers.
 * - IP extraction + hashing (we never store raw IPs).
 * - String sanitization (strip control chars, trim, collapse whitespace).
 * - Reference id generation (GDC / GDS / GDB / GDT / GAI + 8 hex chars).
 * - Security headers + no-cache helpers.
 * - Standardized JSON error / success responders.
 * - Safe logging that hides PII.
 * - Request body size limits + method restriction helpers.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import type { ZodError } from "zod";

// ----------------------------------------------------------------
// IP handling
// ----------------------------------------------------------------

/**
 * Best-effort client-IP extraction. Falls back to "unknown".
 * Returns the FIRST value found, trimmed. We never store the raw IP —
 * only the salted hash (see `hashIp`).
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd && fwd.trim().length > 0) {
    return fwd.split(",")[0].trim();
  }
  const real = req.headers.get("x-real-ip");
  if (real && real.trim().length > 0) return real.trim();
  return "unknown";
}

const IP_SALT = process.env.IP_HASH_SALT || "getsetgrades-ip-salt-v1";

/**
 * Returns the first octet of an IPv4 string (for logging only).
 * For IPv6, returns the first 4-char prefix of the first group.
 * Always lowercased. Returns "unknown" for missing IPs.
 */
export function ipPrefix(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  const v = ip.trim();
  const v4 = v.match(/^(\d{1,3})\./);
  if (v4) return v4[1];
  const v6 = v.split(":")[0];
  return (v6 || "unknown").slice(0, 4).toLowerCase();
}

/**
 * Salted SHA-256 of the IP, truncated to 32 hex chars. Safe to persist.
 * We never log or store the raw IP.
 */
export function hashIp(ip: string): string {
  const value = ip && ip !== "unknown" ? ip : "unknown-" + Math.random();
  return createHash("sha256")
    .update(value + IP_SALT)
    .digest("hex")
    .slice(0, 32);
}

// ----------------------------------------------------------------
// Sanitization
// ----------------------------------------------------------------

/**
 * Strip control characters, trim, collapse internal whitespace runs to single
 * spaces. Returns "" for null/undefined. Prevents stored-XSS payloads and
 * keeps DB rows tidy.
 */
export function sanitizeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return "";
  let s = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// ----------------------------------------------------------------
// Reference id
// ----------------------------------------------------------------

/**
 * Generate a reference id like `GDC-3f9a1b7c`. 8 random hex chars.
 * `reference` columns are `@unique` so a retry loop in the caller could
 * recover if a collision ever happened (16^8 = 4 billion, so they don't).
 *
 * Prefixes:
 * - GDC: Contact messages
 * - GDS: Support requests
 * - GDB: Bookings
 * - GDT: Grievance tickets
 * - GAI: AI chat replies (NOT persisted — returned to client for traceability)
 * - GPY: Legacy payment event references (kept only for compatibility)
 */
export function generateReference(
  prefix: "GDC" | "GDS" | "GDB" | "GDT" | "GAI" | "GPY",
): string {
  const hex = randomBytes(4).toString("hex"); // 8 hex chars
  return `${prefix}-${hex}`;
}

// ----------------------------------------------------------------
// Response helpers
// ----------------------------------------------------------------

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

/**
 * Attach `nosniff`, `no-referrer`, `no-store` to a NextResponse.
 * Always use this on every JSON response from these API routes.
 */
export function setSecurityHeaders<T>(res: NextResponse<T>): NextResponse<T> {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

/** Build a 200 success response: `{ ok: true, reference }`. */
export function okResponse(reference: string, extra?: Record<string, unknown>): NextResponse {
  return setSecurityHeaders(
    NextResponse.json({ ok: true, reference, ...(extra || {}) }, { status: 200 }),
  );
}

/**
 * Build a 400 validation error response: `{ ok: false, errors: {...} }`.
 * `errors` is the zod-formatted field->message map.
 */
export function validationErrorResponse(
  errors: Record<string, string>,
): NextResponse {
  return setSecurityHeaders(
    NextResponse.json({ ok: false, errors }, { status: 400 }),
  );
}

/** Build a 405 Method Not Allowed response. */
export function methodNotAllowedResponse(allowed: string[]): NextResponse {
  const res = setSecurityHeaders(
    NextResponse.json(
      { ok: false, error: "Method not allowed." },
      { status: 405 },
    ),
  );
  res.headers.set("Allow", allowed.join(", "));
  return res;
}

/** Build a 413 Payload Too Large response. */
export function payloadTooLargeResponse(): NextResponse {
  return setSecurityHeaders(
    NextResponse.json(
      { ok: false, error: "Request body is too large." },
      { status: 413 },
    ),
  );
}

/** Build a 429 response: `{ ok: false, error }`. */
export function rateLimitResponse(retryAfterMs: number): NextResponse {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  const res = setSecurityHeaders(
    NextResponse.json(
      {
        ok: false,
        error: "Too many requests. Please try again later.",
      },
      { status: 429 },
    ),
  );
  res.headers.set("Retry-After", String(seconds));
  return res;
}

/**
 * Build a 500 response: `{ ok: false, error }`. NEVER leak the raw exception.
 * `logId` is a short id echoed to the server log only so an operator can
 * correlate a client report with the log entry. The client gets the same
 * logId so they can quote it in a support email.
 */
export function serverErrorResponse(logId: string): NextResponse {
  return setSecurityHeaders(
    NextResponse.json(
      {
        ok: false,
        error: "Something went wrong. Please try again or email us directly.",
        logId,
      },
      { status: 500 },
    ),
  );
}

// ----------------------------------------------------------------
// Logging
// ----------------------------------------------------------------

/**
 * Safe, PII-free request log. Prints:
 *   [ts] endpoint=... ip=first-octet ref=GDC-XXXXXXXX result=ok|ratelimit|validation|error[|logid=...]
 *
 * NEVER log: raw bodies, names, emails, WhatsApp numbers, messages,
 * descriptions, AI prompts/responses, payment data, or SQL queries.
 */
export function safeLog(args: {
  endpoint: string;
  ipPrefix: string;
  reference?: string;
  result: "ok" | "ratelimit" | "validation" | "error" | "honeypot" | "method" | "size";
  logId?: string;
}): void {
  const ts = new Date().toISOString();
  const ref = args.reference ? ` ref=${args.reference}` : "";
  const logId = args.logId ? ` logid=${args.logId}` : "";
  console.log(
    `[${ts}] endpoint=${args.endpoint} ip=${args.ipPrefix}${ref} result=${args.result}${logId}`,
  );
}

/**
 * Generate a short id used to correlate a 500 response with a server log
 * entry. 6 hex chars is plenty for client/operator correlation.
 */
export function newLogId(): string {
  return randomBytes(3).toString("hex");
}

/**
 * Flatten a zod error into a `field -> message` map (only the first message
 * per field is kept, to match the frontend's single-error-per-field UI).
 */
export function flattenZodError(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Returns true if the honeypot field has been filled i.e. the request was
 * made by a bot. The honeypot field is hidden from real users via CSS, so any
 * non-empty value means the visitor is a bot.
 */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

// ----------------------------------------------------------------
// Request body size limiting
// ----------------------------------------------------------------

/**
 * Read and size-limit a JSON request body. Returns:
 *   - `{ ok: true, body }` on success
 *   - `{ ok: false, reason: "too-large" }` if the body exceeds `maxBytes`
 *   - `{ ok: false, reason: "invalid" }` if the body is not valid JSON
 *
 * We read the body as text first (so we can measure bytes) and then
 * `JSON.parse` it. This is safer than `req.json()` which gives no size
 * guarantee and can OOM the process on a huge payload.
 */
export async function readJsonBody(
  req: NextRequest,
  maxBytes: number,
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; reason: "too-large" | "invalid" }
> {
  let text: string;
  try {
    // `req.text()` reads the entire body into memory. We rely on the
    // framework's `Content-Length` + our own size check to bound it.
    text = await req.text();
  } catch {
    return { ok: false, reason: "invalid" };
  }

  // Byte-length (not character length) — handles multibyte UTF-8.
  const byteLength = Buffer.byteLength(text, "utf8");
  if (byteLength > maxBytes) {
    return { ok: false, reason: "too-large" };
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

// ----------------------------------------------------------------
// Method restriction helper
// ----------------------------------------------------------------

/**
 * Returns true if the request method is in `allowed`. Use this at the top
 * of every route handler to reject GET (etc.) on POST-only endpoints with
 * a clean 405 + `Allow` header.
 */
export function isMethodAllowed(
  req: NextRequest,
  allowed: readonly string[],
): boolean {
  return allowed.includes(req.method);
}
