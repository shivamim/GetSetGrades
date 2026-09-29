import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasAdminSession, isSameOrigin } from "@/lib/admin-auth";
import { rateLimitAsync } from "@/lib/rate-limit";
import { readJsonBody, setSecurityHeaders } from "@/lib/api-utils";

const updateSchema = z.object({
  type: z.enum(["booking", "contact", "support", "grievance"]),
  reference: z.string().min(3).max(100),
  action: z.enum(["mark_paid", "set_status"]),
  status: z.string().min(1).max(40).optional(),
  paymentReference: z.string().max(200).optional(),
  amount: z.number().positive().finite().optional(),
  currency: z.string().length(3).optional(),
}).strict();

const STATUS_BY_TYPE: Record<string, string[]> = {
  contact: ["new", "reviewed", "archived"],
  support: ["new", "reviewing", "matched", "closed"],
  grievance: ["open", "in_review", "resolved", "closed"],
};

function assertSameOrigin(req: NextRequest): boolean {
  return isSameOrigin(req);
}

export async function POST(req: NextRequest) {
  if (!(await hasAdminSession())) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }));
  }
  if (!assertSameOrigin(req)) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 }));
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const rl = await rateLimitAsync(`admin-update:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 }));
  }

  const body = await readJsonBody(req, 8 * 1024);
  if (!body.ok) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 }));
  }

  const parsed = updateSchema.safeParse(body.body);
  if (!parsed.success) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid update." }, { status: 400 }));
  }

  const data = parsed.data;

  try {
    if (data.action === "mark_paid") {
      if (data.type !== "booking") {
        return setSecurityHeaders(NextResponse.json({ ok: false, error: "mark_paid is only valid for bookings." }, { status: 400 }));
      }
      if (!data.paymentReference?.trim() || !data.amount || data.amount <= 0) {
        return setSecurityHeaders(NextResponse.json({ ok: false, error: "Transaction ID and paid amount are required." }, { status: 400 }));
      }

      const amountCents = Math.round(data.amount * 100);
      if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
        return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid payment amount." }, { status: 400 }));
      }

      const booking = await db.booking.findUnique({ where: { reference: data.reference }, select: { reference: true } });
      if (!booking) {
        return setSecurityHeaders(NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 }));
      }

      await db.booking.update({
        where: { reference: data.reference },
        data: {
          status: "paid",
          paymentStatus: "paid",
          paymentReference: data.paymentReference.trim(),
          paymentAmount: amountCents,
          paymentCurrency: (data.currency || "USD").toUpperCase(),
          paidAt: new Date(),
          provider: "paypal",
        },
      });

      return setSecurityHeaders(NextResponse.json({ ok: true }));
    }

    if (data.type === "booking") {
      return setSecurityHeaders(NextResponse.json({ ok: false, error: "Use payment reconciliation for booking status changes." }, { status: 400 }));
    }

    const allowedStatuses = STATUS_BY_TYPE[data.type];
    if (!data.status || !allowedStatuses.includes(data.status)) {
      return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 }));
    }

    if (data.type === "contact") {
      await db.contactMessage.update({ where: { reference: data.reference }, data: { status: data.status } });
    } else if (data.type === "support") {
      await db.supportRequest.update({ where: { reference: data.reference }, data: { status: data.status } });
    } else {
      await db.grievance.update({ where: { ticketReference: data.reference }, data: { status: data.status } });
    }

    return setSecurityHeaders(NextResponse.json({ ok: true }));
  } catch (error) {
    console.error(`[admin-update] update failed err=${error instanceof Error ? error.name : "UnknownError"}`);
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Unable to update record." }, { status: 500 }));
  }
}

export async function GET() {
  return setSecurityHeaders(NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } }));
}
