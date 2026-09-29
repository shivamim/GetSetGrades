/**
 * Rate limiter for GetSetGrades API routes.
 *
 * Two backends:
 *   1. Upstash Redis REST (production). Activated when BOTH
 *      `RATE_LIMIT_REDIS_URL` and `RATE_LIMIT_REDIS_TOKEN` are set.
 *      Distributed across all Vercel instances.
 *   2. In-memory Map (dev / single-instance). Per-process only.
 *
 * We DO NOT claim distributed rate limiting when only the in-memory backend
 * is active. The `backend()` helper lets operators see which one is in use
 * for a given deployment.
 *
 * Sliding-window semantics: a request is allowed if the count of timestamps
 * within the last `windowMs` is under `limit`. Blocked requests do NOT
 * consume a slot (a flood of blocked requests can't push out the legitimate
 * window).
 */

type RateLimitOpts = {
  /** Max number of requests allowed within the window. Default 5. */
  limit?: number;
  /** Window size in ms. Default 60_000 (60s). */
  windowMs?: number;
};

type RateLimitResult = {
  ok: boolean;
  /** ms until the next slot opens up (only meaningful when ok === false). */
  retryAfterMs: number;
};

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60_000;

// ----------------------------------------------------------------
// Backend selection
// ----------------------------------------------------------------

const REDIS_URL = process.env.RATE_LIMIT_REDIS_URL;
const REDIS_TOKEN = process.env.RATE_LIMIT_REDIS_TOKEN;
export const RATE_LIMIT_BACKEND: "redis" | "memory" =
  REDIS_URL && REDIS_TOKEN ? "redis" : "memory";

export function rateLimitBackend(): "redis" | "memory" {
  return RATE_LIMIT_BACKEND;
}

// ----------------------------------------------------------------
// In-memory backend (dev / single-instance)
// ----------------------------------------------------------------

const buckets = new Map<string, number[]>();
const SWEEP_INTERVAL_MS = 5 * 60_000;
let lastSweep = Date.now();

function sweepStale(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, ts] of buckets.entries()) {
    const fresh = ts.filter((t) => now - t < DEFAULT_WINDOW_MS);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweepStale(now);
  const safeKey = key || "anonymous";
  const raw = buckets.get(safeKey) ?? [];
  const fresh = raw.filter((t) => now - t < windowMs);

  if (fresh.length >= limit) {
    const oldest = fresh[0];
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    buckets.set(safeKey, fresh);
    return { ok: false, retryAfterMs: Math.ceil(retryAfterMs) };
  }

  fresh.push(now);
  buckets.set(safeKey, fresh);
  return { ok: true, retryAfterMs: 0 };
}

// ----------------------------------------------------------------
// Upstash Redis REST backend (production)
// ----------------------------------------------------------------

/**
 * Upstash Redis REST pipeline call. We use a pipeline of two commands:
 *   1. ZREMRANGEBYSCORE key 0 (now-windowMs)  -> drop expired entries
 *   2. ZCARD key                              -> count entries in window
 *   3. (only if under limit) ZADD key now now -> add this request
 *   4. PEXPIRE key windowMs                   -> keep TTL bounded
 *
 * To keep this single-call and atomic-ish, we run the first two always,
 * then conditionally run the add + expire. The whole pipeline is one HTTP
 * round-trip. Idempotency of the "add" step is not strictly required for
 * rate limiting (worst case: we count one extra hit).
 */
async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    // Should not reach here (we only call this when backend is redis).
    return { ok: true, retryAfterMs: 0 };
  }

  const now = Date.now();
  const cutoff = now - windowMs;
  const redisKey = `rl:${key}`;

  try {
    // Pipeline: clean -> count -> (conditionally) add + expire.
    // We run clean + count first.
    const countRes = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", redisKey, "-inf", cutoff.toString()],
        ["ZCARD", redisKey],
      ]),
      signal: AbortSignal.timeout(2000),
    });

    if (!countRes.ok) {
      // If Redis is down, FAIL OPEN (allow the request) so the user is not
      // punished for infra issues. Log a short marker.
      console.error(`[rate-limit] redis count failed status=${countRes.status}`);
      return { ok: true, retryAfterMs: 0 };
    }

    const countJson = (await countRes.json()) as unknown;
    // Upstash returns [[null, count], ...]. Defensive parsing.
    let count = 0;
    if (Array.isArray(countJson) && Array.isArray(countJson[1])) {
      const inner = countJson[1] as unknown[];
      count = typeof inner[1] === "number" ? inner[1] : 0;
    }

    if (count >= limit) {
      // Over quota — do NOT add. Compute retryAfter from the oldest entry.
      // We don't fetch the oldest entry to keep this cheap; use the full
      // window as a conservative upper bound.
      return { ok: false, retryAfterMs: windowMs };
    }

    // Under quota — add this hit and refresh TTL.
    await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZADD", redisKey, now.toString(), `${now}:${Math.random().toString(36).slice(2, 8)}`],
        ["PEXPIRE", redisKey, windowMs.toString()],
      ]),
      signal: AbortSignal.timeout(2000),
    });

    return { ok: true, retryAfterMs: 0 };
  } catch (err) {
    // Network / timeout / DNS — fail open.
    const name = err instanceof Error ? err.name : "UnknownError";
    console.error(`[rate-limit] redis error err=${name}`);
    return { ok: true, retryAfterMs: 0 };
  }
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Returns `{ ok: true }` and records a hit when the caller is within the
 * allowed quota; returns `{ ok: false, retryAfterMs }` when over quota and
 * DOES NOT record a new hit.
 */
export function rateLimit(
  key: string,
  opts: RateLimitOpts = {},
): RateLimitResult {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  // Memory backend is synchronous.
  return memoryRateLimit(key, limit, windowMs);
}

/**
 * Async rate limiter that uses Redis when configured, falling back to the
 * in-memory implementation otherwise. Use this from `await`-able route
 * handlers so the Redis HTTP call can happen when configured.
 */
export async function rateLimitAsync(
  key: string,
  opts: RateLimitOpts = {},
): Promise<RateLimitResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;

  if (RATE_LIMIT_BACKEND === "redis") {
    return redisRateLimit(key, limit, windowMs);
  }
  return memoryRateLimit(key, limit, windowMs);
}

/** Test-only helper: clears all in-memory buckets. Not used in production. */
export function __resetRateLimiterForTests() {
  buckets.clear();
}
