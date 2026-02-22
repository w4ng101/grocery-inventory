'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tag, Plus, Pencil, Trash2, X, Loader2, AlertCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import type { Category } from '@/types';

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

function CategoryModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void; }) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch(category ? `/api/categories/${category.id}` : '/api/categories', {
        method: category ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to save');
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{category ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dairy & Eggs" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description" className={inputCls + ' resize-none'} />
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} loading={saving}>{category ? 'Save changes' : 'Add category'}</Button>
        </div>
      </div>
    </div>
  );
}

const LIMIT = 10;

export default function CategoriesPage() {
  const { can } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCategories = useCallback(async (s: string, f: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (s) params.set('search', s);
      if (f === 'archived') params.set('active', 'false');
      else if (f === 'active') params.set('active', 'true');
      const res = await fetch(`/api/categories?${params}`);
      const data = await res.json();
      if (data.success) { setCategories(data.data ?? []); setTotal(data.pagination?.total ?? 0); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCategories(search, filter, page), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, filter, page, fetchCategories]);

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this category?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchCategories(search, filter, page);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Tag className="h-6 w-6 text-emerald-600" />Categories</h1>
            <p className="text-sm text-gray-500 mt-0.5">Organise products into categories</p>
          </div>
          {can('categories:create') && (
            <Button size="sm" onClick={() => { setEditing(null); setShowModal(true); }}><Plus className="h-4 w-4" />Add Category</Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search categories..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
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
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Description</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                {(can('categories:update') || can('categories:delete')) && <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-gray-400">{search ? `No categories matching "${search}"` : 'No categories yet'}</td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{c.description ?? ''}</td>
                    <td className="px-5 py-4"><Badge variant={c.is_active ? 'success' : 'secondary'} dot>{c.is_active ? 'Active' : 'Archived'}</Badge></td>
                    {(can('categories:update') || can('categories:delete')) && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {can('categories:update') && <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(c); setShowModal(true); }}><Pencil className="h-3.5 w-3.5" /></Button>}
                          {can('categories:delete') && <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
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
              <span>Showing {(page - 1) * LIMIT + 1}{Math.min(page * LIMIT, total)} of {total}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const n = start + i;
                  if (n > totalPages) return null;
                  return <Button key={n} variant={n === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(n)}>{n}</Button>;
                })}
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CategoryModal
          category={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchCategories(search, filter, page); }}
        />
      )}
    </>
  );
}