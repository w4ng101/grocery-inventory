import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { auditService } from '@/services/audit.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { parsePaginationParams } from '@/lib/security/sanitize';
import type { CreateBatchDto, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'inventory:read')) return errorResponse('Forbidden', 403);

  const params = parsePaginationParams(request.nextUrl.searchParams);
  const low_stock = request.nextUrl.searchParams.get('low_stock') ?? undefined;

  const { data, pagination } = await inventoryService.getSummary({ ...params, low_stock });
  return successResponse(data, undefined, pagination);
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;
  if (!hasPermission(role, 'inventory:create')) return errorResponse('Forbidden', 403);

  try {
    const body = await request.json() as CreateBatchDto;

    if (!body.product_id || body.quantity === undefined || body.quantity <= 0) {
      return errorResponse('product_id and positive quantity are required', 400);
    }

    const batch = await inventoryService.addBatch(body, userId);

    await auditService.log({
      user_id: userId,
      action: 'ADD_BATCH',
      table_name: 'inventory_batches',
      record_id: batch.id,
      new_data: batch as unknown as Record<string, unknown>,
    });

    return successResponse(batch, 'Stock batch added', undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to add batch');
  }
}
