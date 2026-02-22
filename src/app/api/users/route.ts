import { NextRequest } from 'next/server';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { auditService } from '@/services/audit.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { parsePaginationParams, isValidEmail, sanitizeString } from '@/lib/security/sanitize';
import type { CreateUserDto, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'users:read')) return errorResponse('Forbidden', 403);

  const params = parsePaginationParams(request.nextUrl.searchParams);
  const { data, pagination } = await userService.getAll(params);
  return successResponse(data, undefined, pagination);
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;
  if (!hasPermission(role, 'users:create')) return errorResponse('Forbidden', 403);

  try {
    const body = await request.json() as CreateUserDto;

    if (!body.email || !body.password || !body.full_name || !body.role) {
      return errorResponse('email, password, full_name, and role are required', 400);
    }

    if (!isValidEmail(body.email)) return errorResponse('Invalid email format', 400);
    if (body.password.length < 8) return errorResponse('Password must be at least 8 characters', 400);

    const user = await authService.register(body);

    await auditService.log({
      user_id: userId,
      action: 'CREATE_USER',
      table_name: 'users',
      record_id: user.id,
      new_data: { email: user.email, role: user.role },
    });

    return successResponse(user, 'User created', undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to create user');
  }
}
