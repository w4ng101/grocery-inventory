'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Search, TrendingUp, X, AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Sale } from '@/types';
import { SALE_STATUS_CONFIG } from '@/lib/constants';

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

interface ProductOption {
  product_id: string;
  name: string;
  sku: string;
  unit: string;
  selling_price: number;
  total_quantity: number;
}

interface CartItem {
  product_id: string;
  name: string;
  unit: string;
  unit_price: number;
  quantity: number;
  available: number;
}

interface AddSaleModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddSaleModal({ onClose, onCreated }: AddSaleModalProps) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/inventory?limit=500&is_active=true');
        const json = await res.json();
        if (json.success) {
          setProducts((json.data as ProductOption[]).filter((p) => p.total_quantity > 0));
        }
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const addProductToCart = useCallback((product: ProductOption) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === product.product_id);
      if (existing) {
        return prev.map((c) =>
          c.product_id === product.product_id
            ? { ...c, quantity: Math.min(c.quantity + 1, c.available) }
            : c
        );
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          name: product.name,
          unit: product.unit,
          unit_price: product.selling_price,
          quantity: 1,
          available: product.total_quantity,
        },
      ];
    });
    setProductSearch('');
  }, []);

  const removeFromCart = (product_id: string) => {
    setCart((prev) => prev.filter((c) => c.product_id !== product_id));
  };

  const updateCart = (product_id: string, field: 'quantity' | 'unit_price', value: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product_id !== product_id) return c;
        if (field === 'quantity') return { ...c, quantity: Math.max(1, Math.min(value, c.available)) };
        return { ...c, unit_price: Math.max(0, value) };
      })
    );
  };

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);
  const discountVal = parseFloat(discount) || 0;
  const taxableAmount = subtotal - discountVal;
  const taxVal = Math.round(taxableAmount * 0.12 * 100) / 100;
  const netTotal = taxableAmount + taxVal;

  const handleSubmit = async () => {
    setError('');
    if (cart.length === 0) { setError('Add at least one product to the sale.'); return; }
    if (cart.some((c) => c.unit_price <= 0)) { setError('All items must have a price greater than 0.'); return; }
    setSaving(true);
    try {
      const body = {
        items: cart.map((c) => ({
          product_id: c.product_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
        })),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(discountVal > 0 ? { discount: discountVal } : {}),
        tax: taxVal,
      };
      const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to create sale');
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setSaving(false);
    }
  };

  const phpFmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Sale</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add products and complete the transaction</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Add Product</label>
            <div className="relative">
              <input
                className={inputCls}
                placeholder={loadingProducts ? 'Loading products…' : 'Search by name or SKU…'}
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); }}
                disabled={loadingProducts}
              />
              {productSearch && filteredProducts.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-52 overflow-y-auto z-20">
                  {filteredProducts.slice(0, 10).map((p) => (
                    <button
                      key={p.product_id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-emerald-50 flex justify-between items-center gap-3"
                      onMouseDown={(e) => { e.preventDefault(); addProductToCart(p); }}
                    >
                      <span className="font-medium text-gray-900 truncate">{p.name}</span>
                      <span className="text-gray-400 text-xs whitespace-nowrap shrink-0">{p.sku} · {phpFmt(p.selling_price)} · {p.total_quantity} {p.unit}</span>
                    </button>
                  ))}
                </div>
              )}
              {productSearch && !loadingProducts && filteredProducts.length === 0 && (
                <div className="absolute left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-20 px-3 py-4 text-sm text-gray-400 text-center">
                  No products found
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Items ({cart.length})</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2 w-24">Unit Price</th>
                      <th className="text-right px-3 py-2 w-20">Qty</th>
                      <th className="text-right px-3 py-2 w-24">Subtotal</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map((item) => (
                      <tr key={item.product_id}>
                        <td className="px-3 py-2 text-gray-900 font-medium">
                          {item.name}
                          <span className="ml-1 text-xs text-gray-400">/{item.unit}</span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateCart(item.product_id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full text-right rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            max={item.available}
                            value={item.quantity}
                            onChange={(e) => updateCart(item.product_id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full text-right rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {phpFmt(item.quantity * item.unit_price)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeFromCart(item.product_id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals + optional fields */}
          {cart.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount (₱)</label>
                  <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" className={inputCls + ' resize-none'} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{phpFmt(subtotal)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>− {phpFmt(discountVal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>VAT (12%)</span>
                  <span>+ {phpFmt(taxVal)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
                  <span>Net Total</span>
                  <span className="text-emerald-700">{phpFmt(netTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {cart.length === 0 && !loadingProducts && (
            <div className="py-8 text-center text-gray-400 text-sm">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              Search for a product above to add it to the cart.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || cart.length === 0} className="gap-2">
            {saving ? 'Processing…' : 'Complete Sale'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [showSaleModal, setShowSaleModal] = useState(false);

  const loadSales = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sales?page=${page}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setSales(json.data);
        setPagination(json.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSales(); }, [loadSales]);

  return (
    <div className="space-y-6">
      {showSaleModal && (
        <AddSaleModal
          onClose={() => setShowSaleModal(false)}
          onCreated={() => { setShowSaleModal(false); loadSales(); }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales</h2>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} total transactions</p>
          </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadSales()}>Refresh</Button>
          <Button size="sm" className="gap-2" onClick={() => setShowSaleModal(true)}>
            <Plus className="h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No sales yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Sold By</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const statusCfg = SALE_STATUS_CONFIG[sale.status];
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs font-medium text-emerald-600">
                        {sale.sale_number}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(sale.sold_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-sm">{(sale as any).seller?.full_name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{sale.items?.length ?? 0} items</TableCell>
                      <TableCell className="text-sm">
                        {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(sale.total_amount)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(sale.net_amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {pagination.page} of {pagination.total_pages} pages</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1}
              onClick={() => loadSales(pagination.page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.total_pages}
              onClick={() => loadSales(pagination.page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
