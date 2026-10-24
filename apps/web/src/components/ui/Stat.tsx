import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatProps {
  label: string;
  value: string | number;
  subValue?: string;
  format?: 'number' | 'inr' | 'inr-compact' | 'percent' | 'raw';
  trend?: number;        // positive = up, negative = down
  trendLabel?: string;
  trendInverse?: boolean; // if true, up = bad (e.g. stockout risk)
  loading?: boolean;
  caption?: string;
  className?: string;
}

function TrendIndicator({ trend, inverse }: { trend: number; inverse?: boolean }) {
  const isPositive = trend > 0;
  const isGood = inverse ? !isPositive : isPositive;

  if (trend === 0) return <Minus className="w-3 h-3 text-ink-faint inline" />;

  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs num', isGood ? 'text-healthy' : 'text-critical')}>
      <Icon className="w-3 h-3" />
      {Math.abs(trend).toFixed(1)}%
    </span>
  );
}

export function Stat({
  label,
  value,
  subValue,
  format = 'number',
  trend,
  trendLabel,
  trendInverse = false,
  loading = false,
  caption,
  className,
}: StatProps) {
  const formatted = React.useMemo(() => {
    if (loading) return null;
    if (typeof value !== 'number') return value;
    if (format === 'inr') return formatINR(value);
    if (format === 'inr-compact') return formatINR(value, true);
    if (format === 'percent') return `${value.toFixed(1)}%`;
    if (format === 'number') return new Intl.NumberFormat('en-IN').format(value);
    return value;
  }, [value, format, loading]);

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-xs text-ink-muted font-medium tracking-wide uppercase font-ui">
        {label}
      </span>

      {loading ? (
        <span className="skeleton h-7 w-24 block" />
      ) : (
        <span className="text-2xl font-display text-ink leading-tight num">
          {formatted}
        </span>
      )}

      {(subValue || trend !== undefined || caption) && !loading && (
        <div className="flex items-center gap-2 flex-wrap">
          {trend !== undefined && <TrendIndicator trend={trend} inverse={trendInverse} />}
          {trendLabel && <span className="text-xs text-ink-faint">{trendLabel}</span>}
          {subValue && <span className="text-xs text-ink-muted num">{subValue}</span>}
          {caption && <span className="text-xs text-ink-faint">{caption}</span>}
        </div>
      )}
    </div>
  );
}
