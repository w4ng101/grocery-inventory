import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { auditService } from '@/services/audit.service';
import { LoginDto } from '@/types';
import { successResponse, errorResponse } from '@/lib/utils';
import { sanitizeString, isValidEmail } from '@/lib/security/sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginDto;

    const email = sanitizeString(body.email ?? '');
    const password = body.password;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return errorResponse('Invalid password', 400);
    }

    const { user, tokens } = await authService.login({ email, password });

    // Set HTTP-only cookie for browser auth
    const response = successResponse({ user, tokens }, 'Login successful');
    response.cookies.set('auth_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expiresIn,
      path: '/',
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600,
      path: '/',
    });

    await auditService.log({
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'users',
      record_id: user.id,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      user_agent: request.headers.get('user-agent') ?? undefined,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return errorResponse(message, 401);
  }
}
