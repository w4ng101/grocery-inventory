import { NextRequest } from 'next/server';
import { saleService } from '@/services/sale.service';
import { auditService } from '@/services/audit.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { isValidUuid } from '@/lib/security/sanitize';
import type { UserRole } from '@/types';

interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'sales:read')) return errorResponse('Forbidden', 403);
  if (!isValidUuid(id)) return errorResponse('Invalid sale ID', 400);

  const sale = await saleService.getById(id);
  if (!sale) return errorResponse('Sale not found', 404);
  return successResponse(sale);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;

  if (!hasPermission(role, 'sales:update')) return errorResponse('Forbidden', 403);
  if (!isValidUuid(id)) return errorResponse('Invalid sale ID', 400);

  try {
    const body = await request.json() as { action: 'void' | 'refund' };

    let sale;
    if (body.action === 'void') {
      sale = await saleService.void(id, userId);
    } else if (body.action === 'refund') {
      sale = await saleService.refund(id);
    } else {
      return errorResponse('Invalid action. Use "void" or "refund"', 400);
    }

    await auditService.log({
      user_id: userId,
      action: `SALE_${body.action.toUpperCase()}`,
      table_name: 'sales',
      record_id: id,
    });

    return successResponse(sale, `Sale ${body.action}ed`);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to update sale');
  }
}
