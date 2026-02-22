import { NextRequest } from 'next/server';
import { supplierService } from '@/services/category-supplier.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'suppliers:read')) return errorResponse('Forbidden', 403);
  const { id } = await params;
  const supplier = await supplierService.getById(id);
  if (!supplier) return errorResponse('Supplier not found', 404);
  return successResponse(supplier);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'suppliers:update')) return errorResponse('Forbidden', 403);
  const { id } = await params;
  try {
    const body = await request.json();
    const supplier = await supplierService.update(id, body);
    return successResponse(supplier, 'Supplier updated');
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to update supplier');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'suppliers:delete')) return errorResponse('Forbidden', 403);
  const { id } = await params;
  try {
    await supplierService.delete(id);
    return successResponse(null, 'Supplier archived');
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to archive supplier');
  }
}
