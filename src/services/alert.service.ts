import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Alert, QueryParams, Pagination } from '@/types';

export class AlertService {
  async getAll(params: QueryParams = {}): Promise<{ data: Alert[]; pagination: Pagination }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 50, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('alerts')
      .select(`
        *,
        product:products(id, name, sku, unit)
      `, { count: 'exact' });

    if (params.type) query = query.eq('type', params.type);
    if (params.severity) query = query.eq('severity', params.severity);
    if (params.is_resolved !== undefined) query = query.eq('is_resolved', params.is_resolved);
    if (params.is_read !== undefined) query = query.eq('is_read', params.is_read);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as Alert[],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('is_resolved', false);

    if (error) return 0;
    return count ?? 0;
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async markAllAsRead(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('alerts')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw new Error(error.message);
  }

  async resolve(id: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('alerts')
      .update({
        is_resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async generateAlerts(): Promise<number> {
    const { data, error } = await supabaseAdmin.rpc('generate_expiry_alerts');
    if (error) throw new Error(error.message);
    return data as number;
  }
}

export const alertService = new AlertService();

