import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'critical' | 'warning' | 'healthy' | 'info' | 'accent' | 'muted';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:     'bg-surface-overlay text-ink-secondary border border-border',
  critical:    'bg-critical-bg text-critical border border-critical/20',
  warning:     'bg-warning-bg text-warning border border-warning/20',
  healthy:     'bg-healthy-bg text-healthy border border-healthy/20',
  info:        'bg-info-bg text-info border border-info/20',
  accent:      'bg-accent-muted text-accent border border-accent/20',
  muted:       'bg-surface-overlay text-ink-muted border border-border',
};

const dotColors: Record<BadgeVariant, string> = {
  default:  'bg-ink-muted',
  critical: 'bg-critical',
  warning:  'bg-warning',
  healthy:  'bg-healthy',
  info:     'bg-info',
  accent:   'bg-accent',
  muted:    'bg-ink-faint',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0 text-2xs h-4',
  sm: 'px-2 py-0.5 text-xs h-5',
  md: 'px-2.5 py-0.5 text-sm h-6',
};

export function Badge({ variant = 'default', size = 'sm', dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-ui font-medium rounded-sm',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('status-dot flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}

// Severity badge for alerts
export function SeverityBadge({ severity }: { severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'OPPORTUNITY' }) {
  const map = {
    CRITICAL:    { variant: 'critical' as const,  label: 'Critical' },
    WARNING:     { variant: 'warning' as const,   label: 'Warning' },
    INFO:        { variant: 'info' as const,       label: 'Info' },
    OPPORTUNITY: { variant: 'healthy' as const,    label: 'Opportunity' },
  };
  const { variant, label } = map[severity];
  return <Badge variant={variant} dot size="sm">{label}</Badge>;
}

// PO Status badge
export function POStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    draft: 'muted',
    pending_approval: 'warning',
    approved: 'info',
    sent_to_supplier: 'info',
    confirmed: 'info',
    shipped: 'accent',
    partially_received: 'warning',
    received: 'healthy',
    closed: 'healthy',
    cancelled: 'critical',
  };
  return (
    <Badge variant={map[status] ?? 'default'} size="sm">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
