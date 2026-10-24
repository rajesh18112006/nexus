import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip } from './Tooltip';

export interface RunwayItem {
  skuId: string;
  skuName: string;
  sku: string;
  daysOfCover: number;
  stockoutDate: string | null;   // ISO date
  replenishmentDate: string | null;
  maxDays?: number;              // timeline horizon
  riskLevel: 'CRITICAL' | 'WARNING' | 'LOW';
}

export interface RunwayProps {
  items: RunwayItem[];
  horizonDays?: number;
  loading?: boolean;
  className?: string;
}

const RISK_COLORS = {
  CRITICAL: 'bg-critical',
  WARNING:  'bg-warning',
  LOW:      'bg-healthy/70',
};

export function RunwayTimeline({ items, horizonDays = 14, loading = false, className }: RunwayProps) {
  const today = new Date();

  function daysFromNow(dateStr: string): number {
    return Math.max(0, Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000));
  }

  // Calculate clean adaptive step size for timeline markers
  const step = React.useMemo(() => {
    if (horizonDays <= 7) return 1;
    if (horizonDays <= 14) return 2;
    if (horizonDays <= 30) return 5;
    if (horizonDays <= 60) return 10;
    if (horizonDays <= 90) return 15;
    return 30;
  }, [horizonDays]);

  const markerDays = React.useMemo(() => {
    const arr: number[] = [0];
    for (let d = step; d < horizonDays; d += step) {
      arr.push(d);
    }
    if (arr[arr.length - 1] !== horizonDays) {
      arr.push(horizonDays);
    }
    return arr;
  }, [horizonDays, step]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="skeleton h-3 w-28 block flex-shrink-0" />
            <div className="flex-1 skeleton h-5 block" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-ink-muted border border-dashed border-border rounded">
        No SKUs currently match the selected runway filters.
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Day scale header */}
      <div className="flex items-center gap-3 mb-2 pl-[8rem] relative">
        <div className="flex-1 relative h-4">
          {markerDays.map((d) => {
            const leftPct = (d / horizonDays) * 100;
            return (
              <span
                key={d}
                className="text-2xs text-ink-faint num absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${leftPct}%` }}
              >
                {d === 0 ? 'Today' : `+${d}d`}
              </span>
            );
          })}
        </div>
        <div className="w-14 text-right text-2xs text-ink-faint">Runway</div>
      </div>

      {items.map((item) => {
        const stockoutAt = item.stockoutDate ? daysFromNow(item.stockoutDate) : horizonDays;
        const replenishAt = item.replenishmentDate ? daysFromNow(item.replenishmentDate) : null;
        const fillWidth = Math.min(Math.max((stockoutAt / horizonDays) * 100, 2), 100);
        const safeOnTime = replenishAt !== null && replenishAt < stockoutAt;

        return (
          <div key={item.skuId} className="flex items-center gap-3 py-1.5 group hover:bg-surface-raised/40 px-1 rounded transition-colors">
            {/* SKU name */}
            <div className="w-28 flex-shrink-0">
              <div className="text-xs text-ink font-medium truncate" title={item.skuName}>{item.skuName}</div>
              <div className="text-2xs text-ink-faint num">{item.sku}</div>
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div className="runway-bar w-full h-3.5 bg-surface-overlay rounded overflow-hidden relative border border-border/40">
                {/* Fill */}
                <Tooltip
                  content={
                    <div>
                      <div className="font-semibold">{item.skuName} ({item.sku})</div>
                      <div className="text-xs text-ink-inverse/90 mt-0.5">{item.daysOfCover.toFixed(1)} days of stock cover</div>
                      {item.stockoutDate && (
                        <div className="text-2xs opacity-80 mt-1">
                          Projected Stockout: {new Date(item.stockoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  }
                >
                  <div
                    className={cn('h-full transition-all duration-300 rounded-sm', RISK_COLORS[item.riskLevel])}
                    style={{ width: `${fillWidth}%` }}
                  />
                </Tooltip>

                {/* Replenishment marker */}
                {replenishAt !== null && replenishAt <= horizonDays && (
                  <Tooltip content={`Replenishment batch due in ${replenishAt} days`}>
                    <div
                      className={cn(
                        'absolute top-0 bottom-0 w-1.5 rounded-full z-10 shadow-sm',
                        safeOnTime ? 'bg-healthy' : 'bg-critical'
                      )}
                      style={{ left: `calc(${(replenishAt / horizonDays) * 100}% - 3px)` }}
                    />
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Days label */}
            <div className="w-14 text-right flex-shrink-0">
              <span className={cn('text-xs num font-semibold',
                item.riskLevel === 'CRITICAL' ? 'text-critical' :
                item.riskLevel === 'WARNING'  ? 'text-warning' : 'text-ink-muted'
              )}>
                {item.daysOfCover.toFixed(1)}d
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
