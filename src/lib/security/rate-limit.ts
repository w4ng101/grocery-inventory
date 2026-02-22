import { NextRequest, NextResponse } from 'next/server';

interface RateEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter (use Redis in production for distributed apps)
const rateLimitStore = new Map<string, RateEntry>();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);

// Stricter limit for auth endpoints (anti-brute-force)
const AUTH_RATE_LIMIT_MAX = 10;
const AUTH_RATE_LIMIT_WINDOW = 60000; // 1 minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return ip;
}

function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }
}

export function rateLimiter(
  request: NextRequest,
  maxRequests = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW
): { limited: boolean; remaining: number; resetAt: number } {
  cleanExpiredEntries();

  const key = getRateLimitKey(request);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return { limited: false, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function authRateLimiter(request: NextRequest) {
  return rateLimiter(request, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW);
}

export function rateLimitResponse(resetAt: number): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(resetAt).toISOString(),
      },
    }
  );
}
