import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  description?: string;
  loading?: boolean;
}

export function StatCard({
  label, value, change, icon: Icon, iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50', description, loading = false
}: StatCardProps) {
  const isPositive = (change ?? 0) > 0;
  const isNegative = (change ?? 0) < 0;

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-10 bg-gray-200 rounded-xl" />
        </div>
        <div className="mt-4 h-8 w-20 bg-gray-200 rounded" />
        <div className="mt-2 h-3 w-32 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {(change !== undefined || description) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {change !== undefined && (
              <span className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                isPositive && 'text-emerald-600',
                isNegative && 'text-red-500',
                !isPositive && !isNegative && 'text-gray-400'
              )}>
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {description && <span className="text-xs text-gray-400">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
