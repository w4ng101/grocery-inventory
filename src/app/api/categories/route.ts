import { NextRequest } from 'next/server';
import { categoryService } from '@/services/category-supplier.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import type { CreateCategoryDto, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'categories:read')) return errorResponse('Forbidden', 403);

  const sp = request.nextUrl.searchParams;
  const limit = parseInt(sp.get('limit') ?? '20');

  // If a high limit is requested without pagination (e.g. for dropdowns), use getAll
  if (limit >= 100 && !sp.has('page')) {
    const activeOnly = sp.get('active') !== 'false';
    const data = await categoryService.getAll(activeOnly);
    return successResponse(data);
  }

  const page = parseInt(sp.get('page') ?? '1');
  const search = sp.get('search') ?? undefined;
  const activeParam = sp.get('active');
  const activeOnly = activeParam === null ? undefined : activeParam === 'true' ? true : false;

  const { data, pagination } = await categoryService.getAllPaged({ page, limit, search, activeOnly });
  return successResponse(data, undefined, pagination);
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'categories:create')) return errorResponse('Forbidden', 403);

  try {
    const body = await request.json() as CreateCategoryDto;
    if (!body.name) return errorResponse('name is required', 400);
    const category = await categoryService.create(body);
    return successResponse(category, 'Category created', undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to create category');
  }
}
