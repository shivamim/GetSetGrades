import { NextResponse } from "next/server";
import { setSecurityHeaders } from "@/lib/api-utils";

/**
 * PayPal Payment Links used by GetSetGrades do not feed this application a
 * verified webhook. Payment reconciliation is therefore performed manually
 * by an authenticated admin after checking the PayPal transaction.
 *
 * This route is intentionally dormant so the app does not imply that a
 * generic webhook is connected to PayPal.
 */
export async function POST() {
  return setSecurityHeaders(
    NextResponse.json(
      {
        ok: false,
        error: "Payment webhooks are not configured for this PayPal Payment Link. Use the admin reconciliation flow.",
      },
      { status: 410 },
    ),
  );
}

export async function GET() {
  const response = NextResponse.json(
    { ok: false, error: "Method not allowed." },
    { status: 405, headers: { Allow: "POST" } },
  );
  return setSecurityHeaders(response);
}
