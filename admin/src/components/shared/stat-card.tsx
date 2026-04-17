import React from 'react';
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
}

export function StatCard({ title, value, growth, icon, iconColor = 'text-primary', description }: StatCardProps) {
  const isPositive = (growth ?? 0) >= 0;
  return (
    <Card className="stat-card-glow hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {growth !== undefined && (
              <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>{isPositive ? '+' : ''}{growth.toFixed(1)}% from last month</span>
              </div>
            )}
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn('p-3 rounded-xl bg-secondary', iconColor)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
