import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Sale, CreateSaleDto, QueryParams, Pagination } from '@/types';

export class SaleService {
  async getAll(params: QueryParams = {}): Promise<{ data: Sale[]; pagination: Pagination }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('sales')
      .select(`
        *,
        seller:users(id, full_name, email),
        items:sale_items(
          *,
          product:products(id, name, sku, unit)
        )
      `, { count: 'exact' });

    if (params.search) {
      query = query.ilike('sale_number', `%${params.search}%`);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.date_from) {
      query = query.gte('sold_at', params.date_from as string);
    }

    if (params.date_to) {
      query = query.lte('sold_at', params.date_to as string);
    }

    query = query
      .order('sold_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as Sale[],
      pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getById(id: string): Promise<Sale | null> {
    const { data, error } = await supabaseAdmin
      .from('sales')
      .select(`
        *,
        seller:users(id, full_name, email),
        items:sale_items(
          *,
          product:products(id, name, sku, unit)
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Sale;
  }

  async create(dto: CreateSaleDto, userId: string): Promise<Sale> {
    // Generate sale number
    const { data: saleNumber } = await supabaseAdmin.rpc('generate_sale_number');

    // Calculate totals
    const itemsTotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const discount = dto.discount ?? 0;
    const tax = dto.tax ?? 0;
    const netAmount = itemsTotal - discount + tax;

    // Insert sale
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        sale_number: saleNumber,
        sold_by: userId,
        total_amount: itemsTotal,
        discount,
        tax,
        net_amount: netAmount,
        notes: dto.notes ?? null,
      })
      .select()
      .single();

    if (saleError || !sale) throw new Error(saleError?.message ?? 'Failed to create sale');

    // Insert sale items (triggers auto-deduct stock)
    const saleItems = dto.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      batch_id: item.batch_id ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabaseAdmin.from('sale_items').insert(saleItems);

    if (itemsError) {
      // Rollback sale
      await supabaseAdmin.from('sales').delete().eq('id', sale.id);
      throw new Error(itemsError.message);
    }

    const fullSale = await this.getById(sale.id);
    if (!fullSale) throw new Error('Failed to retrieve created sale');
    return fullSale;
  }

  async void(id: string, userId: string): Promise<Sale> {
    const { data, error } = await supabaseAdmin
      .from('sales')
      .update({ status: 'voided' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Sale;
  }

  async refund(id: string): Promise<Sale> {
    const { data, error } = await supabaseAdmin
      .from('sales')
      .update({ status: 'refunded' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Sale;
  }
}

export const saleService = new SaleService();

