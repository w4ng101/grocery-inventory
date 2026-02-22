import { NextRequest } from 'next/server';
import { saleService } from '@/services/sale.service';
import { auditService } from '@/services/audit.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { parsePaginationParams } from '@/lib/security/sanitize';
import type { CreateSaleDto, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'sales:read')) return errorResponse('Forbidden', 403);

  const params = parsePaginationParams(request.nextUrl.searchParams);
  const extraParams = {
    ...params,
    status: request.nextUrl.searchParams.get('status') ?? undefined,
    date_from: request.nextUrl.searchParams.get('date_from') ?? undefined,
    date_to: request.nextUrl.searchParams.get('date_to') ?? undefined,
  };

  const { data, pagination } = await saleService.getAll(extraParams);
  return successResponse(data, undefined, pagination);
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;
  if (!hasPermission(role, 'sales:create')) return errorResponse('Forbidden', 403);

  try {
    const body = await request.json() as CreateSaleDto;

    if (!body.items || body.items.length === 0) {
      return errorResponse('Sale must contain at least one item', 400);
    }

    for (const item of body.items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0 || item.unit_price === undefined) {
        return errorResponse('Each item must have product_id, positive quantity, and unit_price', 400);
      }
    }

    const sale = await saleService.create(body, userId);

    await auditService.log({
      user_id: userId,
      action: 'CREATE_SALE',
      table_name: 'sales',
      record_id: sale.id,
      new_data: { sale_number: sale.sale_number, net_amount: sale.net_amount, items: body.items.length },
    });

    return successResponse(sale, 'Sale recorded', undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to create sale');
  }
}
