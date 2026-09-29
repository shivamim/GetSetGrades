import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasAdminSession } from "@/lib/admin-auth";
import { rateLimitAsync } from "@/lib/rate-limit";
import { getClientIp, setSecurityHeaders } from "@/lib/api-utils";

const querySchema = z.object({
  type: z.enum(["summary", "bookings", "contacts", "support", "grievances"]),
  q: z.string().max(120).optional(),
  status: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export async function GET(req: NextRequest) {
  if (!(await hasAdminSession())) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }));
  }

  const ip = getClientIp(req);
  const rl = await rateLimitAsync(`admin-data:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 }));
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Invalid query." }, { status: 400 }));
  }

  const { type, q, status, limit } = parsed.data;
  const needle = q?.trim();

  try {
    if (type === "summary") {
      const [bookings, contacts, support, grievances, paidBookings, pendingPayments] = await Promise.all([
        db.booking.count(),
        db.contactMessage.count(),
        db.supportRequest.count(),
        db.grievance.count(),
        db.booking.count({ where: { paymentStatus: "paid" } }),
        db.booking.count({ where: { paymentStatus: { in: ["none", "pending"] } } }),
      ]);
      return setSecurityHeaders(NextResponse.json({ ok: true, summary: { bookings, contacts, support, grievances, paidBookings, pendingPayments } }));
    }

    if (type === "bookings") {
      const items = await db.booking.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(needle ? {
            OR: [
              { reference: { contains: needle } },
              { fullName: { contains: needle } },
              { email: { contains: needle } },
              { service: { contains: needle } },
            ],
          } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true, reference: true, service: true, fullName: true, email: true,
          whatsapp: true, supportType: true, educationLevel: true, sessionLength: true,
          status: true, paymentStatus: true, paymentReference: true, paymentAmount: true,
          paymentCurrency: true, paidAt: true, provider: true, createdAt: true,
        },
      });
      return setSecurityHeaders(NextResponse.json({ ok: true, items }));
    }

    if (type === "contacts") {
      const items = await db.contactMessage.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(needle ? { OR: [
            { reference: { contains: needle } },
            { name: { contains: needle } },
            { email: { contains: needle } },
            { service: { contains: needle } },
          ] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return setSecurityHeaders(NextResponse.json({ ok: true, items }));
    }

    if (type === "support") {
      const items = await db.supportRequest.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(needle ? { OR: [
            { reference: { contains: needle } },
            { fullName: { contains: needle } },
            { email: { contains: needle } },
            { subject: { contains: needle } },
          ] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return setSecurityHeaders(NextResponse.json({ ok: true, items }));
    }

    const items = await db.grievance.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(needle ? { OR: [
          { ticketReference: { contains: needle } },
          { name: { contains: needle } },
          { email: { contains: needle } },
          { subject: { contains: needle } },
        ] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return setSecurityHeaders(NextResponse.json({ ok: true, items }));
  } catch (error) {
    console.error(`[admin-data] read failed err=${error instanceof Error ? error.name : "UnknownError"}`);
    return setSecurityHeaders(NextResponse.json({ ok: false, error: "Unable to load admin data." }, { status: 500 }));
  }
}
