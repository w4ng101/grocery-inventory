import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { applySecurityHeaders, handleCors, corsPreflightResponse } from '@/lib/security/headers';
import { rateLimiter, authRateLimiter, rateLimitResponse } from '@/lib/security/rate-limit';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/refresh', '/'];
const AUTH_ROUTES = ['/api/auth/login', '/api/auth/refresh'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight
  const preflightRes = corsPreflightResponse(request);
  if (preflightRes) return preflightRes;

  // Apply rate limiting
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const rateResult = authRateLimiter(request);
    if (rateResult.limited) {
      return rateLimitResponse(rateResult.resetAt);
    }
  } else if (pathname.startsWith('/api/')) {
    const rateResult = rateLimiter(request);
    if (rateResult.limited) {
      return rateLimitResponse(rateResult.resetAt);
    }
  }

  // Auth check for protected API routes
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute && !isPublicRoute) {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth_token')?.value;
    const token = extractTokenFromHeader(authHeader) ?? cookieToken ?? null;

    if (!token) {
      const response = NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
      return applySecurityHeaders(handleCors(request, response));
    }

    try {
      const payload = await verifyAccessToken(token);
      // Attach user info to request headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.sub);
      requestHeaders.set('x-user-email', payload.email);
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-user-name', payload.full_name);

      const response = NextResponse.next({ request: { headers: requestHeaders } });
      return applySecurityHeaders(handleCors(request, response));
    } catch (err) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
      return applySecurityHeaders(handleCors(request, response));
    }
  }

  // Dashboard auth redirect
  if (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/inventory') ||
      pathname.startsWith('/sales') ||
      pathname.startsWith('/expiry') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/users')) {
    // Check for auth cookie (set on login)
    const authCookie = request.cookies.get('auth_token');
    if (!authCookie?.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      await verifyAccessToken(authCookie.value);
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Redirect authenticated users away from login
  if (pathname === '/login') {
    const authCookie = request.cookies.get('auth_token');
    if (authCookie?.value) {
      try {
        await verifyAccessToken(authCookie.value);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Token invalid, allow login page
      }
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(handleCors(request, response));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)',
  ],
};
