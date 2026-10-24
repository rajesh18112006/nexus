import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightClick?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, iconRight, onIconRightClick, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-ink-secondary tracking-wide uppercase"
          >
            {label}
            {props.required && <span className="text-critical ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted [&>svg]:w-3.5 [&>svg]:h-3.5 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-8 px-3 text-sm text-ink font-ui',
              'bg-surface border border-border rounded',
              'placeholder:text-ink-faint',
              'transition-colors duration-150',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-raised',
              error && 'border-critical focus:border-critical focus:ring-critical/40',
              icon && 'pl-8',
              iconRight && 'pr-8',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {iconRight && (
            <button
              type="button"
              onClick={onIconRightClick}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted [&>svg]:w-3.5 [&>svg]:h-3.5 hover:text-ink"
            >
              {iconRight}
            </button>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-critical">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-ink-faint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
