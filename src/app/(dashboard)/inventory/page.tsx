'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useInventory } from '@/hooks/use-inventory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { UNIT_LABEL } from '@/lib/constants';
import type { UnitType, InventorySummary } from '@/types';

function formatNum(n: number) {
  return new Intl.NumberFormat('en-PH').format(n);
}

function formatPhp(n: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
}

interface Product { id: string; name: string; sku: string; unit: string; cost_price: number; }
interface Preselect { id: string; name: string; sku: string; unit: string; cost_price: number; }

function AddStockModal({ onClose, onSuccess, preselect }: { onClose: () => void; onSuccess: () => void; preselect?: Preselect }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(!preselect);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    product_id: preselect?.id ?? '',
    quantity: '',
    cost_price: preselect ? String(preselect.cost_price ?? '') : '',
    expires_at: '',
    notes: '',
  });

  useEffect(() => {
    if (preselect) return; // no need to load list if product is already chosen
    fetch('/api/products?limit=200&is_active=true')
      .then(r => r.json())
      .then(j => { if (j.success) setProducts(j.data); })
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoadingProducts(false));
  }, [preselect]);

  const selectedProduct = preselect ?? products.find(p => p.id === form.product_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.product_id) { setError('Please select a product'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Quantity must be greater than 0'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: form.product_id,
          quantity: Number(form.quantity),
          cost_price: form.cost_price ? Number(form.cost_price) : undefined,
          expires_at: form.expires_at || undefined,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to add stock');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add Stock</h2>
              <p className="text-xs text-gray-400">Add a new inventory batch</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product <span className="text-red-500">*</span>
            </label>
            {preselect ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Package className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{preselect.name}</p>
                  <p className="text-xs text-gray-500">{preselect.sku} &middot; {preselect.unit}</p>
                </div>
              </div>
            ) : loadingProducts ? (
              <div className="h-9 rounded-lg bg-gray-100 animate-pulse" />
            ) : (
              <select
                value={form.product_id}
                onChange={e => {
                  const p = products.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, product_id: e.target.value, cost_price: p ? String(p.cost_price) : f.cost_price }));
                }}
                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity <span className="text-red-500">*</span>
              {selectedProduct && <span className="text-gray-400 font-normal ml-1">({selectedProduct.unit})</span>}
            </label>
            <input
              type="number"
              min="0.001"
              step="any"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="0"
              className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cost Price per Unit <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">&#8369;</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost_price}
                onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                placeholder="0.00"
                className="w-full h-9 rounded-lg border border-gray-200 bg-white pl-6 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Supplier, PO number, etc."
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [stockTarget, setStockTarget] = useState<Preselect | null | undefined>(undefined);
  // undefined = closed, null = open without preselect, Preselect = open with preselect
  const { data, isLoading, pagination, setParams, refetch } = useInventory();

  const openAddStock = (item?: InventorySummary) => {
    setStockTarget(item ? { id: item.product_id, name: item.name, sku: item.sku, unit: item.unit, cost_price: item.cost_price } : null);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setParams(prev => ({ ...prev, search: value, page: '1' }));
  };

  return (
    <div className="space-y-6">
      {stockTarget !== undefined && (
        <AddStockModal
          preselect={stockTarget ?? undefined}
          onClose={() => setStockTarget(undefined)}
          onSuccess={() => { refetch(); }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} products tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
          <Button size="sm" className="gap-2" onClick={() => openAddStock()}>
            <Plus className="h-4 w-4" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="flex h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button
          variant={lowStockOnly ? 'warning' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => {
            const next = !lowStockOnly;
            setLowStockOnly(next);
            setParams(prev => ({ ...prev, low_stock: next ? 'true' : '', page: '1' }));
          }}
        >
          <AlertTriangle className="h-4 w-4" />
          Low Stock Only
          {lowStockOnly && <Badge variant="warning" className="ml-1 text-[10px] py-0 px-1.5">ON</Badge>}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No products found</p>
              <Button size="sm" className="mt-4 gap-2" onClick={() => openAddStock()}>
                <Plus className="h-4 w-4" /> Add Stock
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const isLow = item.total_quantity <= item.low_stock_threshold;
                  const isOut = item.total_quantity === 0;
                  return (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>
                        {item.category_name ? (
                          <Badge variant="secondary">{item.category_name}</Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={isOut ? 'text-red-600 font-bold' : isLow ? 'text-yellow-600 font-semibold' : 'text-gray-900'}>
                          {formatNum(item.total_quantity)}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">
                          / {item.low_stock_threshold} min
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        {UNIT_LABEL[item.unit as UnitType]?.split(' ')[0] ?? item.unit}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPhp(item.selling_price)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {item.earliest_expiry
                          ? new Date(item.earliest_expiry).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge variant="destructive" dot>Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning" dot>Low Stock</Badge>
                        ) : (
                          <Badge variant="success" dot>In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => openAddStock(item)}
                        >
                          <Plus className="h-3 w-3" /> Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setParams(p => ({ ...p, page: String(pagination.page - 1) }))}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setParams(p => ({ ...p, page: String(pagination.page + 1) }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
