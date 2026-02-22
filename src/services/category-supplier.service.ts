import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Category, CreateCategoryDto, Supplier, CreateSupplierDto, Pagination } from '@/types';
import { sanitizeObject } from '@/lib/security/sanitize';

export interface PagedResult<T> {
  data: T[];
  pagination: Pagination;
}

export class CategoryService {
  async getAll(activeOnly = true): Promise<Category[]> {
    let query = supabaseAdmin.from('categories').select('*').order('name');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Category[];
  }

  async getAllPaged(params: {
    page?: number;
    limit?: number;
    search?: string;
    activeOnly?: boolean;
  } = {}): Promise<PagedResult<Category>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact' })
      .order('name');

    if (params.activeOnly !== undefined) query = query.eq('is_active', params.activeOnly);
    if (params.search) query = query.ilike('name', `%${params.search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as Category[],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabaseAdmin
      .from('categories').select('*').eq('id', id).single();
    if (error) return null;
    return data as Category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories').insert(sanitizeObject(dto as unknown as Record<string, unknown>)).select().single();
    if (error) throw new Error(error.message);
    return data as Category;
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories').update(sanitizeObject(dto as unknown as Record<string, unknown>)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Category;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('categories').update({ is_active: false }).eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export class SupplierService {
  async getAll(activeOnly = true): Promise<Supplier[]> {
    let query = supabaseAdmin.from('suppliers').select('*').order('name');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Supplier[];
  }

  async getAllPaged(params: {
    page?: number;
    limit?: number;
    search?: string;
    activeOnly?: boolean;
  } = {}): Promise<PagedResult<Supplier>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('suppliers')
      .select('*', { count: 'exact' })
      .order('name');

    if (params.activeOnly !== undefined) query = query.eq('is_active', params.activeOnly);
    if (params.search) query = query.or(
      `name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
    );
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as Supplier[],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabaseAdmin
      .from('suppliers').select('*').eq('id', id).single();
    if (error) return null;
    return data as Supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const { data, error } = await supabaseAdmin
      .from('suppliers').insert(sanitizeObject(dto as unknown as Record<string, unknown>)).select().single();
    if (error) throw new Error(error.message);
    return data as Supplier;
  }

  async update(id: string, dto: Partial<CreateSupplierDto>): Promise<Supplier> {
    const { data, error } = await supabaseAdmin
      .from('suppliers').update(sanitizeObject(dto as unknown as Record<string, unknown>)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Supplier;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('suppliers').update({ is_active: false }).eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const categoryService = new CategoryService();
export const supplierService = new SupplierService();

