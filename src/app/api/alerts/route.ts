import { NextRequest } from 'next/server';
import { alertService } from '@/services/alert.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { parsePaginationParams } from '@/lib/security/sanitize';
import type { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'alerts:read')) return errorResponse('Forbidden', 403);

  const params = parsePaginationParams(request.nextUrl.searchParams);
  const extraParams = {
    ...params,
    type: request.nextUrl.searchParams.get('type') ?? undefined,
    severity: request.nextUrl.searchParams.get('severity') ?? undefined,
    is_resolved: request.nextUrl.searchParams.has('is_resolved')
      ? request.nextUrl.searchParams.get('is_resolved') === 'true'
      : false,
  };

  const { data, pagination } = await alertService.getAll(extraParams);
  const unreadCount = await alertService.getUnreadCount();

  return successResponse({ alerts: data, unread_count: unreadCount }, undefined, pagination);
}

export async function POST(request: NextRequest) {
  // Manually trigger alert generation (admin/manager)
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'alerts:resolve')) return errorResponse('Forbidden', 403);

  const count = await alertService.generateAlerts();
  return successResponse({ generated: count }, `${count} alerts generated`);
}
