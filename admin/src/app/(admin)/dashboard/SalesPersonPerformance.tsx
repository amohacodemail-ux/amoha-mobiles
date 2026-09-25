import React, { useEffect, useState } from 'react';
import { dashboardService } from '@/services/dashboard.service';
import { formatCurrency, formatDate, getOrderStatusColor, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { ShoppingCart, CheckCircle, Clock, XCircle, DollarSign, TrendingUp, User } from 'lucide-react';

export function SalesPersonPerformance() {
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSalesPersons = async () => {
      try {
        const data = await dashboardService.getSalesPersons();
        setSalesPersons(data);
      } catch (err) {
        console.error('Failed to load sales persons:', err);
      }
    };
    fetchSalesPersons();
  }, []);

  useEffect(() => {
    if (!selectedSalesPerson) {
      setPerformanceData(null);
      return;
    }

    const fetchPerformance = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardService.getSalesPersonPerformance(selectedSalesPerson);
        setPerformanceData(data);
      } catch (err) {
        setError('Failed to load sales person performance. Please try again later.');
        console.error('Error fetching performance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [selectedSalesPerson]);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Sales Person Performance</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-2 max-w-sm">
            <label htmlFor="sales-person-select" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select Sales Person
            </label>
            <select
              id="sales-person-select"
              value={selectedSalesPerson}
              onChange={(e) => setSelectedSalesPerson(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select Sales Person</option>
              {salesPersons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {!selectedSalesPerson ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <User className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Select a sales person to view performance.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : error ? (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      ) : performanceData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            <StatCard
              title="Total Orders"
              value={String(performanceData.summary.totalOrders)}
              icon={<ShoppingCart className="h-5 w-5" />}
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Completed Orders"
              value={String(performanceData.summary.completedOrders)}
              icon={<CheckCircle className="h-5 w-5" />}
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title="Pending Orders"
              value={String(performanceData.summary.pendingOrders)}
              icon={<Clock className="h-5 w-5" />}
              iconColor="text-amber-600 dark:text-amber-400"
            />
            <StatCard
              title="Cancelled Orders"
              value={String(performanceData.summary.cancelledOrders)}
              icon={<XCircle className="h-5 w-5" />}
              iconColor="text-destructive"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(performanceData.summary.totalRevenue)}
              icon={<DollarSign className="h-5 w-5" />}
              iconColor="text-violet-600 dark:text-violet-400"
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(performanceData.summary.averageOrderValue)}
              icon={<TrendingUp className="h-5 w-5" />}
              iconColor="text-primary"
            />
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Orders ({salesPersons.find(p => p.id === selectedSalesPerson)?.name})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Order ID', 'Customer Name', 'Order Date', 'Order Status', 'Order Amount', 'Payment Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground first:pl-0 last:pr-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {performanceData.orders.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-sm font-medium text-foreground mb-1">No orders found for this sales person.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      performanceData.orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-muted/30 transition-colors duration-150 group">
                          <td className="px-4 py-3.5 first:pl-0">
                            <span className="font-mono text-xs text-primary font-medium">#{o.order_number || o.id.slice(0,8).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-foreground text-sm">{o.user?.name || 'Unknown'}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              {formatDate(o.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              getOrderStatusColor(o.orderStatus)
                            )}>
                              {(o.orderStatus || 'pending').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-foreground">{formatCurrency(o.totalAmount)}</span>
                          </td>
                          <td className="px-4 py-3.5 last:pr-0">
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              o.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              o.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' :
                              o.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            )}>
                              {(o.paymentStatus || 'pending').replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
