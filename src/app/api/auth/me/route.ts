import { NextRequest } from 'next/server';
import { authService } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return errorResponse('Unauthorized', 401);

  const user = await authService.getUserById(userId);
  if (!user) return errorResponse('User not found', 404);

  return successResponse(user);
}
