'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, UserCheck, UserX, Plus, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import type { User } from '@/types';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/auth/rbac';

export default function UsersPage() {
  const { can } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
      });
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users ?? []);
        setTotal(data.data.pagination?.total ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userId: string, active: boolean) => {
    const endpoint = active ? 'deactivate' : 'activate';
    await fetch(`/api/users/${userId}/${endpoint}`, { method: 'PATCH' });
    fetchUsers();
  };

  const roleColor: Record<string, string> = {
    superadmin: 'purple',
    admin: 'destructive',
    manager: 'warning',
    staff: 'info',
    viewer: 'secondary',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Users
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage team members and their roles</p>
        </div>
        {can('users:create') && (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email…"
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
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Name</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Email</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Role</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
              {can('users:update') && (
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">Loading users…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                        {user.full_name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-gray-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{user.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={(roleColor[user.role] as Parameters<typeof Badge>[0]['variant']) ?? 'secondary'} dot>
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={user.is_active ? 'success' : 'secondary'} dot>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  {can('users:update') && (
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
                        className={user.is_active ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'}
                      >
                        {user.is_active ? (
                          <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                        ) : (
                          <><UserCheck className="h-3.5 w-3.5" /> Activate</>
                        )}
                      </Button>
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
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
