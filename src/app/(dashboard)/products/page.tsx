'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package, Search, Plus, Pencil, Trash2, X, Loader2, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import type { Product, Category, Supplier } from '@/types';
import { UNITS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────── */
interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  category_id: string;
  supplier_id: string;
  unit: string;
  unit_size: string;
  cost_price: string;
  selling_price: string;
  low_stock_threshold: string;
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  category_id: '',
  supplier_id: '',
  unit: 'pcs',
  unit_size: '1',
  cost_price: '',
  selling_price: '',
  low_stock_threshold: '10',
};

/* ─── Modal ─────────────────────────────────────────────── */
function ProductModal({
  product,
  categories,
  suppliers,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(
    product
      ? {
          name: product.name,
          sku: product.sku ?? '',
          barcode: product.barcode ?? '',
          description: product.description ?? '',
          category_id: product.category_id ?? '',
          supplier_id: product.supplier_id ?? '',
          unit: product.unit,
          unit_size: String(product.unit_size ?? 1),
          cost_price: String(product.cost_price),
          selling_price: String(product.selling_price),
          low_stock_threshold: String(product.low_stock_threshold ?? 10),
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        unit_size: parseFloat(form.unit_size) || 1,
        cost_price: parseFloat(form.cost_price),
        selling_price: parseFloat(form.selling_price),
        low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        barcode: form.barcode || null,
        description: form.description || null,
      };
      const res = await fetch(product ? `/api/products/${product.id}` : '/api/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to save');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Product Name *</label>
              <input required value={form.name} onChange={set('name')} placeholder="e.g. Whole Milk" className={inputCls} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">SKU</label>
              <input value={form.sku} onChange={set('sku')} placeholder="Auto-generated if blank" className={inputCls} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Barcode</label>
              <input value={form.barcode} onChange={set('barcode')} placeholder="Scan or type" className={inputCls} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</label>
              <select value={form.category_id} onChange={set('category_id')} className={inputCls}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Supplier</label>
              <select value={form.supplier_id} onChange={set('supplier_id')} className={inputCls}>
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Unit *</label>
              <select required value={form.unit} onChange={set('unit')} className={inputCls}>
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Unit Size</label>
              <input type="number" min="0" step="any" value={form.unit_size} onChange={set('unit_size')} className={inputCls} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cost Price *</label>
              <input required type="number" min="0" step="0.01" value={form.cost_price} onChange={set('cost_price')} placeholder="0.00" className={inputCls} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Selling Price *</label>
              <input required type="number" min="0" step="0.01" value={form.selling_price} onChange={set('selling_price')} placeholder="0.00" className={inputCls} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Low Stock Threshold</label>
              <input type="number" min="1" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} className={inputCls} />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Optional description" className={inputCls + ' resize-none'} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} loading={saving}>
            {saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

/* ─── Page ──────────────────────────────────────────────── */
export default function ProductsPage() {
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const limit = 20;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, supRes] = await Promise.all([
        fetch(`/api/products?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
        fetch('/api/categories?limit=100'),
        fetch('/api/suppliers?limit=100'),
      ]);
      const [prod, cat, sup] = await Promise.all([prodRes.json(), catRes.json(), supRes.json()]);
      if (prod.success) { setProducts(prod.data ?? []); setTotal(prod.pagination?.total ?? 0); }
      if (cat.success) setCategories(cat.data ?? []);
      if (sup.success) setSuppliers(sup.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };
  const saved = () => { closeModal(); fetchAll(); };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-emerald-600" />
              Products
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your product catalogue</p>
          </div>
          {can('products:create') && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Product</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">SKU</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Unit</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Price</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                {(can('products:update') || can('products:delete')) && (
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">No products found</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.barcode && <p className="text-xs text-gray-400">{p.barcode}</p>}
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{p.sku ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{(p as Product & { categories?: { name: string } }).categories?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{p.unit_size} {p.unit}</td>
                    <td className="px-5 py-4 text-right text-gray-900 font-medium">{formatCurrency(p.selling_price)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={p.is_active ? 'success' : 'secondary'} dot>
                        {p.is_active ? 'Active' : 'Archived'}
                      </Badge>
                    </td>
                    {(can('products:update') || can('products:delete')) && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {can('products:update') && (
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {can('products:delete') && (
                            <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-500" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {total > limit && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={editing}
          categories={categories}
          suppliers={suppliers}
          onClose={closeModal}
          onSaved={saved}
        />
      )}
    </>
  );
}
