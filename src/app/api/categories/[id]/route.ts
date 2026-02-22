import { NextRequest } from 'next/server';
import { categoryService } from '@/services/category-supplier.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'categories:read')) return errorResponse('Forbidden', 403);
  const { id } = await params;
  const category = await categoryService.getById(id);
  if (!category) return errorResponse('Category not found', 404);
  return successResponse(category);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'categories:update')) return errorResponse('Forbidden', 403);
  const { id } = await params;
  try {
    const body = await request.json();
    const category = await categoryService.update(id, body);
    return successResponse(category, 'Category updated');
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to update category');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'categories:delete')) return errorResponse('Forbidden', 403);
  const { id } = await params;
  try {
    await categoryService.delete(id);
    return successResponse(null, 'Category archived');
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to archive category');
  }
}
