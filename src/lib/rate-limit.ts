type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

function windowToUpstashDuration(windowMs: number): `${number} s` | `${number} m` | `${number} h` {
  if (windowMs >= 3_600_000) {
    return `${Math.round(windowMs / 3_600_000)} h`;
  }
  if (windowMs >= 60_000) {
    return `${Math.round(windowMs / 60_000)} m`;
  }
  return `${Math.max(1, Math.round(windowMs / 1000))} s`;
}

type UpstashChecker = (
  key: string,
  limit: number,
  windowMs: number
) => Promise<RateLimitResult>;

let upstashCheckerPromise: Promise<UpstashChecker | null> | null = null;

async function getUpstashChecker(): Promise<UpstashChecker | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  if (!upstashCheckerPromise) {
    upstashCheckerPromise = (async () => {
      try {
        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({ url, token });
        const limiters = new Map<string, InstanceType<typeof Ratelimit>>();

        return async (key: string, limit: number, windowMs: number) => {
          const cacheKey = `${limit}:${windowMs}`;
          let limiter = limiters.get(cacheKey);
          if (!limiter) {
            limiter = new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(limit, windowToUpstashDuration(windowMs)),
              prefix: 'pd:ratelimit',
            });
            limiters.set(cacheKey, limiter);
          }

          const result = await limiter.limit(key);
          return {
            allowed: result.success,
            retryAfterMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
          };
        };
      } catch (error) {
        console.warn('[rate-limit] Upstash indisponível, usando memória local.', error);
        return null;
      }
    })();
  }

  return upstashCheckerPromise;
}

/**
 * Rate limiter with Upstash Redis when configured, in-memory fallback otherwise.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const upstash = await getUpstashChecker();
  if (upstash) {
    return upstash(key, limit, windowMs);
  }
  return checkMemoryRateLimit(key, limit, windowMs);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}
