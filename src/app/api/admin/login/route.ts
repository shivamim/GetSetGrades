import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitAsync } from "@/lib/rate-limit";
import {
  createAdminSessionToken,
  adminConfigReady,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { getClientIp, ipPrefix, readJsonBody, setSecurityHeaders } from "@/lib/api-utils";

const schema = z.object({ password: z.string().min(1).max(256) }).strict();

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimitAsync(`admin-login:${ip}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    const res = NextResponse.json({ ok: false, error: "Too many login attempts. Please try again later." }, { status: 429 });
    res.headers.set("Retry-After", String(Math.max(1, Math.ceil(rl.retryAfterMs / 1000))));
    return setSecurityHeaders(res);
  }

  if (!adminConfigReady()) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Admin authentication is not configured." }, { status: 503 }));
  }

  const body = await readJsonBody(req, 4 * 1024);
  if (!body.ok) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }));
  }

  const parsed = schema.safeParse(body.body);
  if (!parsed.success || !verifyAdminPassword(parsed.data.password)) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid admin password." }, { status: 401 }));
  }

  const token = createAdminSessionToken();
  const response = NextResponse.json({ ok: true }, { status: 200 });
  setSecurityHeaders(response);
  setAdminSessionCookie(response, token);
  console.log(`[admin-auth] login success ip=${ipPrefix(ip)}`);
  return response;
}

export async function GET() {
  return setSecurityHeaders(NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } }));
}
