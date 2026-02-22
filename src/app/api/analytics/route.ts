import { NextRequest } from 'next/server';
import { analyticsService } from '@/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') as UserRole;
  if (!hasPermission(role, 'analytics:read')) return errorResponse('Forbidden', 403);

  const type = request.nextUrl.searchParams.get('type') ?? 'summary';
  const startDate = request.nextUrl.searchParams.get('start_date') ?? undefined;
  const endDate = request.nextUrl.searchParams.get('end_date') ?? undefined;
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10);
  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '30', 10);

  try {
    switch (type) {
      case 'summary':
        return successResponse(await analyticsService.getSummary());
      case 'daily_revenue':
        return successResponse(await analyticsService.getDailyRevenue(startDate, endDate));
      case 'monthly_revenue':
        return successResponse(await analyticsService.getMonthlyRevenue());
      case 'top_products':
        return successResponse(await analyticsService.getTopProducts(limit, startDate, endDate));
      case 'slow_moving':
        return successResponse(await analyticsService.getSlowMovingProducts(days));
      default:
        return errorResponse('Invalid analytics type. Use: summary, daily_revenue, monthly_revenue, top_products, slow_moving', 400);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Failed to fetch analytics');
  }
}
