import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, isSameOrigin } from "@/lib/admin-auth";
import { setSecurityHeaders } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 }));
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  setSecurityHeaders(response);
  clearAdminSessionCookie(response);
  return response;
}

export async function GET() {
  return setSecurityHeaders(NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } }));
}
