import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-emerald-100 text-emerald-700',
        secondary: 'border-transparent bg-gray-100 text-gray-700',
        destructive: 'border-transparent bg-red-100 text-red-700',
        warning: 'border-transparent bg-yellow-100 text-yellow-700',
        outline: 'text-gray-700 border-gray-200',
        success: 'border-transparent bg-green-100 text-green-700',
        info: 'border-transparent bg-blue-100 text-blue-700',
        purple: 'border-transparent bg-purple-100 text-purple-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'destructive' && 'bg-red-500',
          variant === 'warning' && 'bg-yellow-500',
          variant === 'success' && 'bg-green-500',
          variant === 'default' && 'bg-emerald-500',
          variant === 'info' && 'bg-blue-500',
          (!variant || variant === 'secondary') && 'bg-gray-500',
        )} />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
