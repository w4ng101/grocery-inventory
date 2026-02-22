import { NextRequest } from 'next/server';
import { productService } from '@/services/product.service';
import { auditService } from '@/services/audit.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { isValidUuid } from '@/lib/security/sanitize';
import type { UpdateProductDto, UserRole } from '@/types';

interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'products:read')) return errorResponse('Forbidden', 403);
  if (!isValidUuid(id)) return errorResponse('Invalid product ID', 400);

  const product = await productService.getById(id);
  if (!product) return errorResponse('Product not found', 404);
  return successResponse(product);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;

  if (!hasPermission(role, 'products:update')) return errorResponse('Forbidden', 403);
  if (!isValidUuid(id)) return errorResponse('Invalid product ID', 400);

  try {
    const body = await request.json() as UpdateProductDto;
    const old = await productService.getById(id);
    const product = await productService.update(id, body);

    await auditService.log({
      user_id: userId,
      action: 'UPDATE_PRODUCT',
      table_name: 'products',
      record_id: id,
      old_data: old as unknown as Record<string, unknown>,
      new_data: product as unknown as Record<string, unknown>,
    });

    return successResponse(product, 'Product updated');
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to update product');
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;

  if (!hasPermission(role, 'products:delete')) return errorResponse('Forbidden', 403);
  if (!isValidUuid(id)) return errorResponse('Invalid product ID', 400);

  try {
    await productService.delete(id);

    await auditService.log({
      user_id: userId,
      action: 'DELETE_PRODUCT',
      table_name: 'products',
      record_id: id,
    });

    return successResponse(null, 'Product deleted');
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to delete product');
  }
}
