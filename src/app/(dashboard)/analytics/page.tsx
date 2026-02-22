'use client';

import { BarChart3, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { RevenueChart, TopProductsChart } from '@/components/dashboard/charts';
import { useAnalyticsSummary, useDailyRevenue, useTopProducts, useSlowMovingProducts } from '@/hooks/use-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DollarSign, ShoppingCart, Boxes, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function formatPhp(n: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
}
function formatNum(n: number) {
  return new Intl.NumberFormat('en-PH').format(n);
}

export default function AnalyticsPage() {
  const { data: summary, isLoading: sumLoading } = useAnalyticsSummary();
  const { data: dailyRevenue, isLoading: revLoading } = useDailyRevenue();
  const { data: topProducts, isLoading: topLoading } = useTopProducts(10);
  const { data: slowMoving, isLoading: slowLoading } = useSlowMovingProducts(30);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Sales performance, top products, and inventory insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (This Month)"
          value={summary ? formatPhp(summary.total_revenue) : '—'}
          change={summary?.revenue_change_pct}
          description="vs last month"
          icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50"
          loading={sumLoading}
        />
        <StatCard
          label="Total Sales"
          value={summary ? formatNum(summary.total_sales) : '—'}
          change={summary?.sales_change_pct}
          description="vs last month"
          icon={ShoppingCart} iconColor="text-blue-600" iconBg="bg-blue-50"
          loading={sumLoading}
        />
        <StatCard
          label="Active Products"
          value={summary ? formatNum(summary.total_products) : '—'}
          icon={Boxes} iconColor="text-violet-600" iconBg="bg-violet-50"
          loading={sumLoading}
        />
        <StatCard
          label="Low Stock Items"
          value={summary ? formatNum(summary.low_stock_count) : '—'}
          icon={AlertTriangle} iconColor="text-orange-500" iconBg="bg-orange-50"
          loading={sumLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RevenueChart data={dailyRevenue} loading={revLoading} />
        <TopProductsChart data={topProducts} loading={topLoading} />
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Ranked by quantity sold this month</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {topLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Qty Sold</TableHead>
                  <TableHead>Sales Count</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p, i) => (
                  <TableRow key={p.product_id}>
                    <TableCell>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>{i + 1}</span>
                    </TableCell>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell className="text-xs text-gray-500">{p.unit}</TableCell>
                    <TableCell className="font-semibold">{formatNum(p.total_qty)}</TableCell>
                    <TableCell>{formatNum(p.sale_count)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{formatPhp(p.total_revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Slow Moving */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            Slow-Moving Items
          </CardTitle>
          <CardDescription>Products not sold in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {slowLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}</div>
          ) : slowMoving.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No slow-moving items</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Last Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowMoving.map((p) => (
                  <TableRow key={p.product_id}>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell className="text-xs text-gray-500">{p.unit}</TableCell>
                    <TableCell>{formatNum(p.total_stock)}</TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {p.last_sold
                        ? new Date(p.last_sold).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
