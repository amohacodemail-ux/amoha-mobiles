'use client';
import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  growth?: number;
  icon: React.ReactNode;
  iconColor?: string;
  description?: string;
  loading?: boolean;
}

function AnimatedValue({ value, isNumeric }: { value: string; isNumeric: boolean }) {
  const [displayValue, setDisplayValue] = useState(isNumeric ? '0' : value);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isNumeric || hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    hasAnimated.current = true;
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const duration = 800;
    const startTime = Date.now();
    const prefix = value.match(/^[^0-9]*/)?.[0] || '';
    const suffix = value.match(/[^0-9]*$/)?.[0] || '';

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = numericValue * easeOut;
      setDisplayValue(`${prefix}${Math.round(current).toLocaleString()}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    const timer = setTimeout(() => requestAnimationFrame(animate), 100);
    return () => clearTimeout(timer);
  }, [value, isNumeric]);

  return <span ref={ref}>{displayValue}</span>;
}

export function StatCard({ title, value, growth, icon, iconColor = 'text-primary', description, loading }: StatCardProps) {
  const isPositive = (growth ?? 0) >= 0;
  const isNumericValue = !isNaN(parseFloat(value.replace(/[^0-9.-]/g, ''))) && value !== '...';

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 rounded bg-muted shimmer" />
              <div className="h-8 w-32 rounded bg-muted shimmer" />
              <div className="h-3 w-20 rounded bg-muted shimmer" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-muted shimmer" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="stat-card-glow overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">
              <AnimatedValue value={value} isNumeric={isNumericValue} />
            </p>
            {growth !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}>
                <span className={cn(
                  'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full',
                  isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                )}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive ? '+' : ''}{growth.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            )}
            {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
          </div>
          <div className={cn(
            'p-3 rounded-xl bg-secondary shrink-0 transition-transform duration-200 group-hover:scale-105',
            iconColor
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
