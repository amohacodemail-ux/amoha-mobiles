'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  icon?: React.ReactNode;
  preventScroll?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, icon, preventScroll, ...props }, ref) => {
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (type === 'number' && preventScroll !== false) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number' && preventScroll !== false) {
        // Remove wheel event listener when focused to prevent scroll changes
        e.currentTarget.addEventListener('wheel', handleWheel as any, { passive: false });
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number' && preventScroll !== false) {
        // Remove wheel event listener when blurred
        e.currentTarget.removeEventListener('wheel', handleWheel as any);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
              'hover:border-primary/30',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input',
              'transition-all duration-200 ease-out',
              icon && 'pl-10',
              error && 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive hover:border-destructive/70',
              type === 'number' && '[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
              className,
            )}
            ref={ref}
            onWheel={handleWheel}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
