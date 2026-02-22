import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateSku } from '@/lib/utils';
import type { Product, CreateProductDto, UpdateProductDto, QueryParams, ApiResponse, Pagination } from '@/types';
import { sanitizeObject } from '@/lib/security/sanitize';

export class ProductService {
  private readonly table = 'products';

  async getAll(params: QueryParams = {}): Promise<{ data: Product[]; pagination: Pagination }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from(this.table)
      .select(`
        *,
        category:categories(id, name, color, icon),
        supplier:suppliers(id, name)
      `, { count: 'exact' });

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%,barcode.ilike.%${params.search}%`);
    }

    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    }

    if (params.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    } else {
      query = query.eq('is_active', true);
    }

    const sortBy = params.sort_by ?? 'created_at';
    const sortOrder = params.sort_order === 'asc';
    query = query.order(sortBy as string, { ascending: sortOrder });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as Product[],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select(`
        *,
        category:categories(id, name, color, icon),
        supplier:suppliers(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Product;
  }

  async getBySku(sku: string): Promise<Product | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) return null;
    return data as Product;
  }

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    const sanitized = sanitizeObject(dto as unknown as Record<string, unknown>);

    if (!sanitized.sku) {
      sanitized.sku = generateSku(sanitized.name as string);
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert({ ...sanitized, created_by: userId })
      .select(`
        *,
        category:categories(id, name, color, icon),
        supplier:suppliers(id, name)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const sanitized = sanitizeObject(dto as unknown as Record<string, unknown>);

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(sanitized)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, color, icon),
        supplier:suppliers(id, name)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.table)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async hardDelete(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from(this.table).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const productService = new ProductService();

