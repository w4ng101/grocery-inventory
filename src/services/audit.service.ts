import { supabaseAdmin } from '@/lib/supabase/admin';

export interface AuditLogEntry {
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await supabaseAdmin.from('audit_logs').insert(entry);
    } catch {
      // Audit failures should not break the app
      console.error('[AuditLog] Failed to write audit log:', entry.action);
    }
  }

  async getAll(params: { page?: number; limit?: number; table_name?: string; user_id?: string } = {}) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 50, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*, user:users(id, full_name, email)', { count: 'exact' });

    if (params.table_name) query = query.eq('table_name', params.table_name);
    if (params.user_id) query = query.eq('user_id', params.user_id);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: data ?? [],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }
}

export const auditService = new AuditService();

