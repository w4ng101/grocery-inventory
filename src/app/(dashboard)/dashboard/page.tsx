'use client';

import {
  DollarSign, ShoppingCart, Package, AlertTriangle, Clock,
  TrendingUp, Boxes, Users
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart, TopProductsChart } from '@/components/dashboard/charts';
import { useAnalyticsSummary, useDailyRevenue, useTopProducts } from '@/hooks/use-analytics';
import { formatCurrency, formatNumber, timeAgo } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExpiringProducts } from '@/hooks/use-inventory';
import { EXPIRY_STATUS_CONFIG } from '@/lib/constants';

function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

function formatNumberValue(value: number): string {
  return new Intl.NumberFormat('en-PH').format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}

export default function DashboardPage() {
  const { data: summary, isLoading: sumLoading } = useAnalyticsSummary();
  const { data: dailyRevenue, isLoading: revLoading } = useDailyRevenue();
  const { data: topProducts, isLoading: topLoading } = useTopProducts(8);
  const { data: expiringItems, isLoading: expLoading } = useExpiringProducts({ limit: '5' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (This Month)"
          value={summary ? formatCurrencyValue(summary.total_revenue) : '—'}
          change={summary?.revenue_change_pct}
          description="vs last month"
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          loading={sumLoading}
        />
        <StatCard
          label="Total Sales"
          value={summary ? formatNumberValue(summary.total_sales) : '—'}
          change={summary?.sales_change_pct}
          description="vs last month"
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          loading={sumLoading}
        />
        <StatCard
          label="Total Products"
          value={summary ? formatNumberValue(summary.total_products) : '—'}
          icon={Boxes}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          description="active products"
          loading={sumLoading}
        />
        <StatCard
          label="Low Stock Alerts"
          value={summary ? formatNumberValue(summary.low_stock_count) : '—'}
          icon={AlertTriangle}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          description={summary?.expired_count ? `${summary.expired_count} expired` : undefined}
          loading={sumLoading}
        />
      </div>

      {/* Alert summary row */}
      {summary && (summary.expiring_count > 0 || summary.expired_count > 0) && (
        <div className="flex flex-wrap gap-3">
          {summary.expired_count > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-700">
                {summary.expired_count} batch{summary.expired_count > 1 ? 'es' : ''} expired
              </span>
            </div>
          )}
          {summary.expiring_count > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-yellow-50 border border-yellow-100 px-4 py-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">
                {summary.expiring_count} expiring within 7 days
              </span>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RevenueChart data={dailyRevenue} loading={revLoading} />
        <TopProductsChart data={topProducts} loading={topLoading} />
      </div>

      {/* Expiring Soon Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expiring Soon</CardTitle>
          <a href="/expiry" className="text-xs text-emerald-600 hover:underline font-medium">View all →</a>
        </CardHeader>
        <CardContent className="p-0">
          {expLoading ? (
            <div className="px-6 py-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : expiringItems.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No expiring products found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {expiringItems.map((item) => {
                const cfg = EXPIRY_STATUS_CONFIG[item.expiry_status as keyof typeof EXPIRY_STATUS_CONFIG];
                return (
                  <div key={item.batch_id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400">{item.batch_number} · {item.quantity} {item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(item.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
