import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton for GetSetGrades.
 *
 * Logging:
 *   - In development: ["error", "warn"] (no query logs, which can leak PII).
 *   - In production: ["error"] only.
 *
 * The previous implementation used `log: ['query']` which logs the raw SQL
 * of every query — including submitted user data (names, emails, messages).
 * That is a privacy violation per the audit (Part 13). It is removed here.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logLevels: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
