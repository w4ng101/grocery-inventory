import { supabaseAdmin } from '@/lib/supabase/admin';
import type { InventoryBatch, InventorySummary, CreateBatchDto, QueryParams, Pagination } from '@/types';
import { sanitizeObject } from '@/lib/security/sanitize';

export class InventoryService {
  private readonly batchTable = 'inventory_batches';

  // ---- Summary (view) ----
  async getSummary(params: QueryParams = {}): Promise<{ data: InventorySummary[]; pagination: Pagination }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('inventory_summary')
      .select('*', { count: 'exact' });

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }

    if (params.low_stock === 'true') {
      // Filter using the computed is_low_stock column in the view
      query = query.eq('is_low_stock', true);
    }

    const VALID_SORT = new Set(['name', 'sku', 'total_quantity', 'selling_price', 'cost_price', 'earliest_expiry', 'category_name']);
    const sortCol = VALID_SORT.has(params.sort_by ?? '') ? params.sort_by! : 'name';
    query = query
      .order(sortCol, { ascending: params.sort_order !== 'desc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as InventorySummary[],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  // ---- Batches ----
  async getBatchesByProduct(productId: string): Promise<InventoryBatch[]> {
    const { data, error } = await supabaseAdmin
      .from(this.batchTable)
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('received_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as InventoryBatch[];
  }

  async getBatchById(id: string): Promise<InventoryBatch | null> {
    const { data, error } = await supabaseAdmin
      .from(this.batchTable)
      .select(`*, product:products(id, name, sku, unit)`)
      .eq('id', id)
      .single();

    if (error) return null;
    return data as InventoryBatch;
  }

  async addBatch(dto: CreateBatchDto, userId: string): Promise<InventoryBatch> {
    // Generate batch number (no args required)
    const { data: batchNum, error: rpcErr } = await supabaseAdmin.rpc('generate_batch_number');
    if (rpcErr) throw new Error('Failed to generate batch number: ' + rpcErr.message);

    const sanitized = sanitizeObject(dto as unknown as Record<string, unknown>);
    // Remove frontend-only or non-existent columns
    delete sanitized['initial_qty'];
    delete sanitized['received_by'];

    const { data, error } = await supabaseAdmin
      .from(this.batchTable)
      .insert({
        ...sanitized,
        batch_number: batchNum ?? `BT-${Date.now()}`,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as InventoryBatch;
  }

  async updateBatch(id: string, dto: Partial<CreateBatchDto>): Promise<InventoryBatch> {
    const { data, error } = await supabaseAdmin
      .from(this.batchTable)
      .update(sanitizeObject(dto as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as InventoryBatch;
  }

  async deleteBatch(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.batchTable)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // ---- Expiry ----
  async getExpiringProducts(params: QueryParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 50, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('expiring_products')
      .select('*', { count: 'exact' });

    if (params.status) {
      query = query.eq('expiry_status', params.status);
    }

    if (params.search) {
      query = query.or(`product_name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }

    query = query.order('days_until_expiry', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: data ?? [],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  // ---- Low Stock ----
  async getLowStockProducts() {
    const { data, error } = await supabaseAdmin
      .from('inventory_summary')
      .select('*')
      .filter('total_quantity', 'lte', supabaseAdmin.from('inventory_summary').select('low_stock_threshold'))
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    return (data ?? []) as InventorySummary[];
  }

  // Low stock via RPC workaround using a raw query approach
  async getLowStock(): Promise<InventorySummary[]> {
    const { data, error } = await supabaseAdmin
      .from('inventory_summary')
      .select('*')
      .eq('is_active', true)
      .order('total_quantity', { ascending: true });

    if (error) throw new Error(error.message);
    return ((data ?? []) as InventorySummary[]).filter(
      (item) => item.total_quantity <= item.low_stock_threshold
    );
  }
}

export const inventoryService = new InventoryService();

