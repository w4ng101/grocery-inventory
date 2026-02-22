'use client';

import { useState } from 'react';
import { Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { useExpiringProducts } from '@/hooks/use-inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EXPIRY_STATUS_CONFIG } from '@/lib/constants';
import type { ExpiryStatus } from '@/types';

export default function ExpiryPage() {
  const [filter, setFilter] = useState<string>('');
  const { data, isLoading, pagination, refetch } = useExpiringProducts(
    filter ? { status: filter } : {}
  );

  const expiredCount = data.filter(d => d.expiry_status === 'expired').length;
  const expiringSoonCount = data.filter(d => d.expiry_status === 'expiring_soon').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expiry Monitor</h2>
          <p className="text-sm text-gray-500 mt-1">Track batch expiry dates and take action</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter('')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-all ${
            !filter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Batches
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{pagination.total}</span>
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-all ${
            filter === 'expired' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
          Expired
          <span className="rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-xs font-semibold">{expiredCount}</span>
        </button>
        <button
          onClick={() => setFilter('expiring_soon')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-all ${
            filter === 'expiring_soon' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-700 border-yellow-200 hover:bg-yellow-50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Expiring Soon (7 days)
          <span className="rounded-full bg-yellow-100 text-yellow-700 px-1.5 py-0.5 text-xs font-semibold">{expiringSoonCount}</span>
        </button>
      </div>

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
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No expiring products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const cfg = EXPIRY_STATUS_CONFIG[item.expiry_status as ExpiryStatus];
                  const daysLeft = item.days_until_expiry;
                  return (
                    <TableRow
                      key={item.batch_id}
                      className={item.expiry_status === 'expired' ? 'bg-red-50/40' : item.expiry_status === 'expiring_soon' ? 'bg-yellow-50/30' : ''}
                    >
                      <TableCell className="font-medium text-gray-900">{item.product_name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">{item.sku}</TableCell>
                      <TableCell className="text-xs text-gray-500">{item.batch_number}</TableCell>
                      <TableCell className="font-semibold">
                        {new Intl.NumberFormat('en-PH').format(item.quantity)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{item.unit}</TableCell>
                      <TableCell>
                        {new Date(item.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <span className={
                          daysLeft < 0 ? 'text-red-600 font-bold' :
                          daysLeft <= 3 ? 'text-red-500 font-semibold' :
                          daysLeft <= 7 ? 'text-yellow-600 font-semibold' :
                          'text-gray-500'
                        }>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
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
    </div>
  );
}
