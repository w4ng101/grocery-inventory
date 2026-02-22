import { NextRequest } from 'next/server';
import { alertService } from '@/services/alert.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { isValidUuid } from '@/lib/security/sanitize';
import type { UserRole } from '@/types';

interface Params { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;

  if (!hasPermission(role, 'alerts:read')) return errorResponse('Forbidden', 403);
  if (!isValidUuid(id)) return errorResponse('Invalid alert ID', 400);

  try {
    const body = await request.json() as { action: 'read' | 'resolve' | 'read_all' };

    if (body.action === 'read') {
      await alertService.markAsRead(id);
      return successResponse(null, 'Alert marked as read');
    } else if (body.action === 'read_all') {
      await alertService.markAllAsRead();
      return successResponse(null, 'All alerts marked as read');
    } else if (body.action === 'resolve') {
      if (!hasPermission(role, 'alerts:resolve')) return errorResponse('Forbidden', 403);
      await alertService.resolve(id, userId);
      return successResponse(null, 'Alert resolved');
    } else {
      return errorResponse('Invalid action. Use "read", "read_all", or "resolve"', 400);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to update alert');
  }
}
