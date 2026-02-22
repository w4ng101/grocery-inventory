import { supabaseAdmin } from '@/lib/supabase/admin';
import type { DailyRevenue, TopProduct, SlowMovingProduct, AnalyticsSummary } from '@/types';

export class AnalyticsService {
  async getSummary(): Promise<AnalyticsSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [
      { data: currentRevData },
      { data: lastRevData },
      { count: productCount },
      { count: lowStockCount },
      { count: expiringCount },
      { count: expiredCount },
    ] = await Promise.all([
      // Current month revenue
      supabaseAdmin
        .from('sales')
        .select('net_amount')
        .eq('status', 'completed')
        .gte('sold_at', startOfMonth),
      // Last month revenue
      supabaseAdmin
        .from('sales')
        .select('net_amount')
        .eq('status', 'completed')
        .gte('sold_at', startOfLastMonth)
        .lte('sold_at', endOfLastMonth),
      // Total active products
      supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      // Low stock (approximate)
      supabaseAdmin
        .from('inventory_summary')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('total_quantity', 10),
      // Expiring soon
      supabaseAdmin
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'expiring_soon')
        .eq('is_resolved', false),
      // Expired
      supabaseAdmin
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'expired')
        .eq('is_resolved', false),
    ]);

    const currentRevenue = (currentRevData ?? []).reduce((s: number, r: { net_amount: number }) => s + Number(r.net_amount), 0);
    const lastRevenue = (lastRevData ?? []).reduce((s: number, r: { net_amount: number }) => s + Number(r.net_amount), 0);
    const revChangePct = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    const currentSalesCount = currentRevData?.length ?? 0;
    const lastSalesCount = lastRevData?.length ?? 0;
    const salesChangePct = lastSalesCount > 0 ? ((currentSalesCount - lastSalesCount) / lastSalesCount) * 100 : 0;

    return {
      total_revenue: currentRevenue,
      total_sales: currentSalesCount,
      total_products: productCount ?? 0,
      low_stock_count: lowStockCount ?? 0,
      expiring_count: expiringCount ?? 0,
      expired_count: expiredCount ?? 0,
      revenue_change_pct: revChangePct,
      sales_change_pct: salesChangePct,
    };
  }

  async getDailyRevenue(startDate?: string, endDate?: string): Promise<DailyRevenue[]> {
    const { data, error } = await supabaseAdmin.rpc('get_daily_revenue', {
      p_start_date: startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      p_end_date: endDate ?? new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as DailyRevenue[];
  }

  async getTopProducts(limit = 10, startDate?: string, endDate?: string): Promise<TopProduct[]> {
    const { data, error } = await supabaseAdmin.rpc('get_top_products', {
      p_limit: limit,
      p_start_date: startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      p_end_date: endDate ?? new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as TopProduct[];
  }

  async getSlowMovingProducts(days = 30): Promise<SlowMovingProduct[]> {
    const { data, error } = await supabaseAdmin.rpc('get_slow_moving_products', {
      p_days: days,
    });
    if (error) throw new Error(error.message);
    // DB function returns `total_quantity`; map to expected `total_stock`
    return ((data ?? []) as Array<Record<string, unknown>>).map(row => ({
      product_id: row.product_id as string,
      product_name: row.product_name as string,
      unit: row.unit as string,
      total_stock: Number(row.total_quantity ?? row.total_stock ?? 0),
      last_sold: (row.last_sold ?? null) as string | null,
    })) as SlowMovingProduct[];
  }

  async getMonthlyRevenue(): Promise<DailyRevenue[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    return this.getDailyRevenue(
      startDate.toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10)
    );
  }
}

export const analyticsService = new AnalyticsService();

