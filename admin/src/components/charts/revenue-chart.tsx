'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTheme } from 'next-themes';
import type { RevenueData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  data: RevenueData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="text-xs">
            {entry.name === 'revenue' ? formatCurrency(entry.value) : `${entry.value} orders`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data }: RevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? 'hsl(217 33% 18%)' : 'hsl(214 32% 91%)';
  const tickColor = isDark ? 'hsl(215 20% 55%)' : 'hsl(215 16% 47%)';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', color: tickColor }} />
        <Area type="monotone" dataKey="revenue" name="revenue" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#colorRevenue)" />
        <Area type="monotone" dataKey="orders" name="orders" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#colorOrders)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
