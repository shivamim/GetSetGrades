import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitAsync } from "@/lib/rate-limit";
import { siteConfig } from "@/lib/site-config";
import {
  flattenZodError,
  generateReference,
  getClientIp,
  ipPrefix,
  isHoneypotFilled,
  isMethodAllowed,
  methodNotAllowedResponse,
  newLogId,
  payloadTooLargeResponse,
  rateLimitResponse,
  readJsonBody,
  safeLog,
  setSecurityHeaders,
  validationErrorResponse,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// 30 KB max for AI chat (conversations can be longer).
const MAX_BYTES = 30 * 1024;

// Groq OpenAI-compatible chat-completions endpoint.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Hard server-side timeout. Groq should respond well within 20s; if it
// doesn't, we abort and return a 502 so the client can retry.
const GROQ_TIMEOUT_MS = 20_000;

/**
 * SERVER-OWNED system prompt. The client is NEVER allowed to override or
 * append to this — any `system` role in the incoming `messages` array is
 * rejected by the schema below.
 *
 * The prompt uses the canonical production URL when available so the model
 * does not reference the dev placeholder.
 */
function buildSystemPrompt(): string {
  const url = siteConfig.url;
  return `You are GetSetGrades AI, a friendly, knowledgeable academic-support assistant on the GetSetGrades website (${url}). You help students understand concepts, explain topics clearly, suggest study approaches, and gently guide them toward booking a one-to-one session with a human tutor for deeper, personalized help.

Voice: warm, encouraging, concise. Prefer short paragraphs and bullet points. Never use corporate jargon. Never say "as an AI language model".

Capabilities: explain academic concepts in programming (Python/SQL/data structures/algorithms), mathematics (algebra/calculus/statistics), English/writing/grammar, research methods, data/AI fundamentals, study planning, revision strategies, exam-prep tactics.

Hard limits — be friendly but firm:
- You NEVER complete graded assessments, take exams, or impersonate students.
- You NEVER produce work the student can submit as their own.
- If a student asks you to "do my assignment" or "take my exam", politely decline and reframe toward learning ("Happy to help you understand it — let's break it down together.").
- You never give legal, medical, or financial advice. Suggest professional help.

You don't know the student's identity. Don't store or recall personal information across conversations — every request is independent. Do not request personal data (email, phone, payment info). If a user volunteers PII, do not repeat or store it.

When the student's question is broad or could benefit from a one-to-one session, end with a soft suggestion like "Want to dive deeper with a one-to-one tutor? You can book a session on the homepage." (only once per reply, never pushy).

Keep replies under ~250 words unless the concept really needs more.`;
}

/** Canned reply returned when the honeypot is filled. NEVER calls Groq. */
const CANNED_HONEYPOT_REPLY =
  "Hi there! For personalized help, please share what you're working on.";

/** Generic upstream-error message shown to the client (no secret leakage). */
const UPSTREAM_ERROR_MESSAGE =
  "The AI service is unavailable. Please try again or chat with us on WhatsApp.";

// ----------------------------------------------------------------
// Validation
// ----------------------------------------------------------------

const messageSchema = z.object({
  // Only `user` and `assistant` roles are accepted. `system` is rejected
  // so the client can never override our server-owned system prompt.
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const aiChatSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(30),
    company_website: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // The last message MUST be from the user.
    const last = data.messages[data.messages.length - 1];
    if (!last || last.role !== "user") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The last message must be from the user.",
        path: ["messages"],
      });
    }
    // Total content cap across the whole conversation.
    const total = data.messages.reduce(
      (sum, m) => sum + (m.content?.length ?? 0),
      0,
    );
    if (total > 20_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total message content is too long (max 20000 characters).",
        path: ["messages"],
      });
    }
  });

// ----------------------------------------------------------------
// Handler
// ----------------------------------------------------------------

export async function POST(req: NextRequest) {
  const endpoint = "/api/ai-chat";
  const ip = getClientIp(req);
  const ipPrefixVal = ipPrefix(ip);

  if (!isMethodAllowed(req, ["POST"])) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "method" });
    return methodNotAllowedResponse(["POST"]);
  }

  // 0. Server-side config check. NEVER leak whether the env var name exists -
  //    just say AI isn't available.
  if (!process.env.GROQ_API_KEY) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "error" });
    return setSecurityHeaders(
      NextResponse.json(
        { ok: false, error: "AI is not configured on this server." },
        { status: 503 },
      ),
    );
  }

  // 1. Rate limit: 12 / 60s per ip+endpoint.
  const rl = await rateLimitAsync(`${endpoint}:${ip}`, {
    limit: 12,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "ratelimit" });
    return rateLimitResponse(rl.retryAfterMs);
  }

  // 2. Read + size-limit body.
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

  // 3. Honeypot — silently return a canned reply, do NOT call Groq,
  //    do NOT persist anything.
  if (isHoneypotFilled((body as Record<string, unknown>)?.company_website)) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "honeypot" });
    const reference = generateReference("GAI");
    return setSecurityHeaders(
      NextResponse.json(
        { ok: true, reply: CANNED_HONEYPOT_REPLY, reference },
        { status: 200 },
      ),
    );
  }

  // 4. Validate.
  const parsed = aiChatSchema.safeParse(body);
  if (!parsed.success) {
    safeLog({ endpoint, ipPrefix: ipPrefixVal, result: "validation" });
    return validationErrorResponse(flattenZodError(parsed.error));
  }
  const data = parsed.data;

  // 5. Call Groq. We do NOT store IPs or conversations in the DB —
  //    `reference` is returned to the client for traceability only.
  const reference = generateReference("GAI");

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        max_tokens: 1024,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...data.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      // Hard timeout. Never let a stuck Groq call hold a request forever.
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
    });

    // Groq 429 -> 503 with a friendlier message (no logId needed).
    if (groqResponse.status === 429) {
      safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "error" });
      return setSecurityHeaders(
        NextResponse.json(
          {
            ok: false,
            error: "AI is busy right now. Please try again in a moment.",
          },
          { status: 503 },
        ),
      );
    }

    // Any other non-2xx -> 502 with a logId. We DO NOT log the response body
    // (audit Part 12 / Part 23). Only log status + logId.
    if (!groqResponse.ok) {
      const logId = newLogId();
      console.error(
        `[ai-chat] groq non-2xx logid=${logId} status=${groqResponse.status}`,
      );
      safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "error", logId });
      return setSecurityHeaders(
        NextResponse.json(
          { ok: false, error: UPSTREAM_ERROR_MESSAGE, logId },
          { status: 502 },
        ),
      );
    }

    // 2xx — extract choices[0].message.content. We do NOT log the reply
    // body (audit Part 12 / Part 23).
    const json = (await groqResponse.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string } }>;
    } | null;
    const reply = json?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply) {
      const logId = newLogId();
      console.error(
        `[ai-chat] groq empty reply logid=${logId} status=${groqResponse.status}`,
      );
      safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "error", logId });
      return setSecurityHeaders(
        NextResponse.json(
          { ok: false, error: UPSTREAM_ERROR_MESSAGE, logId },
          { status: 502 },
        ),
      );
    }

    safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "ok" });
    return setSecurityHeaders(
      NextResponse.json({ ok: true, reply, reference }, { status: 200 }),
    );
  } catch (err) {
    // Network / timeout / DNS — same 502 + logId envelope. NEVER leak the
    // raw exception name to the client (we do log it server-side, but
    // only the name, never the message which could leak URL/headers).
    const logId = newLogId();
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(`[ai-chat] groq fetch failed logid=${logId} err=${name}`);
    safeLog({ endpoint, ipPrefix: ipPrefixVal, reference, result: "error", logId });
    return setSecurityHeaders(
      NextResponse.json(
        { ok: false, error: UPSTREAM_ERROR_MESSAGE, logId },
        { status: 502 },
      ),
    );
  }
}

export async function GET() {
  return methodNotAllowedResponse(["POST"]);
}
