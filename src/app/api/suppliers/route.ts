import { NextRequest } from 'next/server';
import { supplierService } from '@/services/category-supplier.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import type { CreateSupplierDto, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'suppliers:read')) return errorResponse('Forbidden', 403);

  const sp = request.nextUrl.searchParams;
  const limit = parseInt(sp.get('limit') ?? '20');

  // High limit without page = dropdown usage, return flat list
  if (limit >= 100 && !sp.has('page')) {
    const activeOnly = sp.get('active') !== 'false';
    const data = await supplierService.getAll(activeOnly);
    return successResponse(data);
  }

  const page = parseInt(sp.get('page') ?? '1');
  const search = sp.get('search') ?? undefined;
  const activeParam = sp.get('active');
  const activeOnly = activeParam === null ? undefined : activeParam === 'true' ? true : false;

  const { data, pagination } = await supplierService.getAllPaged({ page, limit, search, activeOnly });
  return successResponse(data, undefined, pagination);
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'suppliers:create')) return errorResponse('Forbidden', 403);

  try {
    const body = await request.json() as CreateSupplierDto;
    if (!body.name) return errorResponse('name is required', 400);
    const supplier = await supplierService.create(body);
    return successResponse(supplier, 'Supplier created', undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to create supplier');
  }
}
