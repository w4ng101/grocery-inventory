import { NextRequest } from 'next/server';
import { productService } from '@/services/product.service';
import { authService } from '@/services/auth.service';
import { auditService } from '@/services/audit.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import { parsePaginationParams } from '@/lib/security/sanitize';
import type { CreateProductDto, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'products:read')) return errorResponse('Forbidden', 403);

  const params = parsePaginationParams(request.nextUrl.searchParams);
  const extraParams = {
    ...params,
    category_id: request.nextUrl.searchParams.get('category_id') ?? undefined,
    is_active: request.nextUrl.searchParams.has('is_active')
      ? request.nextUrl.searchParams.get('is_active') === 'true'
      : undefined,
  };

  const { data, pagination } = await productService.getAll(extraParams);
  return successResponse(data, undefined, pagination);
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  const userId = request.headers.get('x-user-id')!;

  if (!hasPermission(role, 'products:create')) return errorResponse('Forbidden', 403);

  try {
    const body = await request.json() as CreateProductDto;

    if (!body.name || !body.unit || body.selling_price === undefined) {
      return errorResponse('name, unit, and selling_price are required', 400);
    }

    const product = await productService.create(body, userId);

    await auditService.log({
      user_id: userId,
      action: 'CREATE_PRODUCT',
      table_name: 'products',
      record_id: product.id,
      new_data: product as unknown as Record<string, unknown>,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    });

    return successResponse(product, 'Product created', undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to create product');
  }
}
