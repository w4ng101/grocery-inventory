import { NextRequest } from 'next/server';
import { authService } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const refreshToken =
      request.cookies.get('refresh_token')?.value ??
      (await request.json().catch(() => ({}))).refreshToken;

    if (!refreshToken) return errorResponse('Refresh token required', 400);

    const tokens = await authService.refreshToken(refreshToken);

    const response = successResponse(tokens, 'Token refreshed');
    response.cookies.set('auth_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expiresIn,
      path: '/',
    });
    return response;
  } catch (err) {
    return errorResponse('Invalid refresh token', 401);
  }
}
