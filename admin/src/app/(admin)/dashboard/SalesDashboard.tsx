'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DollarSign, ShoppingCart, Target, CreditCard, Activity } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService } from '@/services/dashboard.service';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const RevenueChart = dynamic(
  () => import('@/components/charts/revenue-chart').then((m) => ({ default: m.RevenueChart })),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />,
    ssr: false,
  },
);

export function SalesDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '3m'>('7d');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getSalesStats(timeFilter);
        setStats(data);
      } catch {
        toast.error('Failed to load sales dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeFilter]);

  const targetRevenue = 25000;
  const targetSales = 10;
  const achievedRevenue = stats?.todayRevenue || 0;
  const completedSales = stats?.todaySales || 0;
  const progressPercent = Math.min(100, Math.round((achievedRevenue / targetRevenue) * 100));
  const remainingAmount = Math.max(0, targetRevenue - achievedRevenue);

  const revenueGrowth = stats?.yesterdayRevenue > 0
    ? Math.round(((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100)
    : (stats?.todayRevenue > 0 ? 100 : 0);

  const chartData = (stats?.chartData || []).map((d: any) => {
    let label = d.date;
    if (d.date) {
      const dateObj = new Date(d.date);
      if (timeFilter === '7d') {
        label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeFilter === '30d') {
        label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } else if (timeFilter === '3m') {
        // Use month and year for 3m, Recharts will automatically thin them out with minTickGap
        label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
    }
    return { ...d, label };
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue || 0)}
          growth={revenueGrowth}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-blue-600 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title="Today's Sales"
          value={String(stats?.todaySales || 0)}
          description="Bills generated today"
          icon={<ShoppingCart className="h-5 w-5" />}
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          description={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          icon={<CreditCard className="h-5 w-5" />}
          iconColor="text-violet-600 dark:text-violet-400"
          loading={loading}
        />
        <StatCard
          title="Monthly Sales"
          value={String(stats?.monthlySales || 0)}
          description="Total bills this month"
          icon={<Activity className="h-5 w-5" />}
          iconColor="text-amber-600 dark:text-amber-400"
          loading={loading}
        />
        <StatCard
          title="Average Sale Value"
          value={formatCurrency(stats?.averageSaleValue || 0)}
          description="Per transaction"
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-indigo-600 dark:text-indigo-400"
          loading={loading}
        />
        <StatCard
          title="Pending Orders"
          value={String(stats?.pendingOrders || 0)}
          description="Awaiting processing/shipping"
          icon={<ShoppingCart className="h-5 w-5" />}
          iconColor="text-orange-600 dark:text-orange-400"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Performance Chart */}
        <Card className="xl:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>My Sales Performance</CardTitle>
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              {(['7d', '30d', '3m'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    timeFilter === filter 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter === '7d' ? '7 Days' : filter === '30d' ? '30 Days' : '3 Months'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {loading ? (
              <div className="h-[280px] shimmer rounded-lg" />
            ) : (
              <div className="h-[280px]">
                <RevenueChart data={chartData} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Target */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Today's Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target Revenue</span>
                <span className="font-semibold">{formatCurrency(targetRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Achieved</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(achievedRevenue)}</span>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-primary">Progress</span>
                  <span className="font-medium">{progressPercent}% Achieved</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-in-out rounded-full" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Target Sales</p>
                <p className="text-lg font-semibold">{targetSales}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Completed</p>
                <p className="text-lg font-semibold text-emerald-600">{completedSales}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-0.5">Remaining Amount</p>
              <p className="text-xl font-bold text-amber-500">
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
