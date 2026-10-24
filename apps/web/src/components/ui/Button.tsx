import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover/90 shadow-sm',
  secondary:
    'bg-surface-raised text-ink border border-border hover:bg-surface-overlay hover:border-border-strong',
  ghost:
    'bg-transparent text-ink-muted hover:bg-surface-raised hover:text-ink',
  destructive:
    'bg-critical text-white hover:bg-critical/90 active:bg-critical/80',
  outline:
    'bg-transparent text-accent border border-accent hover:bg-accent-muted',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-2xs gap-1',
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-sm gap-2',
  lg: 'h-9 px-4 text-md gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-ui font-medium',
          'rounded transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'select-none',
          // Variant + Size
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon && <span className="flex-shrink-0 [&>svg]:w-full [&>svg]:h-full" style={{ width: size === 'xs' ? 12 : size === 'sm' ? 13 : size === 'lg' ? 16 : 14, height: size === 'xs' ? 12 : size === 'sm' ? 13 : size === 'lg' ? 16 : 14 }}>{icon}</span>
        )}
        {children && <span>{children}</span>}
        {iconRight && !loading && (
          <span className="flex-shrink-0 ml-auto">{iconRight}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
