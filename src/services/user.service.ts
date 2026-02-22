import { supabaseAdmin } from '@/lib/supabase/admin';
import type { User, CreateUserDto, UpdateUserDto, QueryParams, Pagination } from '@/types';
import { sanitizeObject } from '@/lib/security/sanitize';

export class UserService {
  async getAll(params: QueryParams = {}): Promise<{ data: User[]; pagination: Pagination }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    if (params.search) {
      query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    if (params.role) query = query.eq('role', params.role);
    if (params.is_active !== undefined) query = query.eq('is_active', params.is_active);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as User[],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as User;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const sanitized = sanitizeObject(dto as unknown as Record<string, unknown>);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async activate(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

export const userService = new UserService();

