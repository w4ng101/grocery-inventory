import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { parsePaginationParams } from '@/lib/security/sanitize';
import type { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'inventory:read')) return errorResponse('Forbidden', 403);

  const params = parsePaginationParams(request.nextUrl.searchParams);
  const status = request.nextUrl.searchParams.get('status') ?? undefined;

  const { data, pagination } = await inventoryService.getExpiringProducts({ ...params, status });
  return successResponse(data, undefined, pagination);
}
