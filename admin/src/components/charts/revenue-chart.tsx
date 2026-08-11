'use client';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
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
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm min-w-[120px]">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="text-xs font-medium mb-1">
            {entry.name === 'revenue' 
              ? `Revenue: ${formatCurrency(entry.value)}` 
              : `Orders: ${entry.value}`}
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

  // Ensure compatibility with both Sales (date/sales) and Admin (month/orders) data formats
  const mappedData = data.map((d: any) => ({
    ...d,
    label: d.label || d.month,
    orders: d.orders ?? d.sales ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={280}>
      <ComposedChart data={mappedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} dy={10} minTickGap={40} interval="preserveStartEnd" />
        <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', color: tickColor, paddingTop: '20px' }} verticalAlign="bottom" height={36} />
        <Area type="monotone" dataKey="revenue" name="revenue" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#colorRevenue)" activeDot={{ r: 5, strokeWidth: 0 }} dot={{ r: 3, strokeWidth: 1, fill: "hsl(217 91% 60%)" }} />
        <Bar dataKey="orders" name="orders" fill="hsl(142 71% 45%)" barSize={12} radius={[2, 2, 0, 0]} minPointSize={3} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
