import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const response = successResponse(null, 'Logged out successfully');
  response.cookies.delete('auth_token');
  response.cookies.delete('refresh_token');
  return response;
}
