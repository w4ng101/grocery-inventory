'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Truck, Plus, Pencil, Trash2, X, Loader2, AlertCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import type { Supplier } from '@/types';

function SupplierModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contact_name: supplier?.contact_name ?? '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
    address: supplier?.address ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]));
      const res = await fetch(supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers', {
        method: supplier ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, name: form.name }),
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {[
            { key: 'name', label: 'Supplier Name', required: true, placeholder: 'e.g. Fresh Farm Co.' },
            { key: 'contact_name', label: 'Contact Person', placeholder: 'Full name' },
            { key: 'email', label: 'Email', placeholder: 'supplier@example.com' },
            { key: 'phone', label: 'Phone', placeholder: '+1 234 567 8900' },
          ].map(({ key, label, required, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {label}{required && ' *'}
              </label>
              <input
                required={required}
                value={(form as Record<string, string>)[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Address</label>
            <textarea value={form.address} onChange={set('address')} rows={2} className={inputCls + ' resize-none'} />
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} loading={saving}>
            {supplier ? 'Save changes' : 'Add supplier'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

const LIMIT = 10;

export default function SuppliersPage() {
  const { can } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuppliers = useCallback(async (s: string, f: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (s) params.set('search', s);
      if (f === 'archived') params.set('active', 'false');
      else if (f === 'active') params.set('active', 'true');
      const res = await fetch(`/api/suppliers?${params}`);
      const data = await res.json();
      if (data.success) { setSuppliers(data.data ?? []); setTotal(data.pagination?.total ?? 0); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuppliers(search, filter, page), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, filter, page, fetchSuppliers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this supplier?')) return;
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    fetchSuppliers(search, filter, page);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-6 w-6 text-emerald-600" />
              Suppliers
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your product suppliers</p>
          </div>
          {can('suppliers:create') && (
            <Button size="sm" onClick={() => { setEditing(null); setShowModal(true); }}>
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
              <option value="all">All statuses</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Contact</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Phone</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                {(can('suppliers:update') || can('suppliers:delete')) && (
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">{search ? `No suppliers matching "${search}"` : 'No suppliers yet'}</td></tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{s.name}</td>
                    <td className="px-5 py-4 text-gray-600">{s.contact_name ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.email ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.phone ?? '—'}</td>
                    <td className="px-5 py-4"><Badge variant={s.is_active ? 'success' : 'secondary'} dot>{s.is_active ? 'Active' : 'Archived'}</Badge></td>
                    {(can('suppliers:update') || can('suppliers:delete')) && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {can('suppliers:update') && (
                            <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(s); setShowModal(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {can('suppliers:delete') && (
                            <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-500" onClick={() => handleDelete(s.id)}>
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

          {total > LIMIT && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const n = start + i;
                  if (n > totalPages) return null;
                  return <Button key={n} variant={n === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(n)}>{n}</Button>;
                })}
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>»</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <SupplierModal
          supplier={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchSuppliers(search, filter, page); }}
        />
      )}
    </>
  );
}
