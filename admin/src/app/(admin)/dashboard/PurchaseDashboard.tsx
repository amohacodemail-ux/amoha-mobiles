'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, AlertCircle, Clock, CheckCircle2, TrendingUp, Users, Package } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService } from '@/services/dashboard.service';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function PurchaseDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getPurchaseStats();
        setStats(data);
      } catch {
        toast.error('Failed to load purchase dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Total Purchase Amount"
          value={formatCurrency(stats?.totalPurchaseAmount || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-blue-600 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title="Pending Purchase Orders"
          value={String(stats?.pendingPurchaseOrders || 0)}
          icon={<Clock className="h-5 w-5" />}
          iconColor="text-amber-600 dark:text-amber-400"
          loading={loading}
        />
        <StatCard
          title="Completed Purchases"
          value={String(stats?.completedPurchases || 0)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(stats?.pendingPayments || 0)}
          icon={<AlertCircle className="h-5 w-5" />}
          iconColor="text-rose-600 dark:text-rose-400"
          loading={loading}
        />
        <StatCard
          title="Products Purchased"
          value={String(stats?.productsPurchased || 0)}
          description="Total items purchased"
          icon={<Package className="h-5 w-5" />}
          iconColor="text-indigo-600 dark:text-indigo-400"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Purchase Orders */}
        <Card className="xl:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Recent Purchase Orders
            </CardTitle>
            <Link href="/purchase-requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {loading ? (
              <div className="h-[300px] shimmer" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium">PO Number</th>
                      <th className="px-6 py-3 font-medium">Supplier</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium text-right">Amount</th>
                      <th className="px-6 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats?.recentPurchaseOrders?.length > 0 ? (
                      stats.recentPurchaseOrders.map((po: any) => (
                        <tr key={po.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-medium">{po.poNumber}</td>
                          <td className="px-6 py-4">{po.supplier?.name}</td>
                          <td className="px-6 py-4">{new Date(po.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatCurrency(po.totalAmount)}</td>
                          <td className="px-6 py-4 text-right">
                            <Badge
                              variant="outline"
                              className={cn(
                                po.status === 'received' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                                po.status === 'cancelled' && 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                                ['draft', 'sent', 'confirmed', 'partially_received'].includes(po.status) && 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              )}
                            >
                              {po.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No recent purchase orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Low Stock Alert */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-[200px] shimmer" />
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {stats?.lowStockAlert?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {stats.lowStockAlert.map((product: any) => (
                        <div key={product.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-md object-cover border border-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border text-muted-foreground">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive" className="font-mono">{product.stock} left</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      Inventory looks good. No low stock items.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Suppliers */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Recent Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-[200px] shimmer" />
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {stats?.recentSuppliers?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {stats.recentSuppliers.map((supplier: any) => (
                        <div key={supplier.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                          <div>
                            <p className="font-medium text-sm">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {supplier.companyName || 'Supplier'}
                            </p>
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className={cn(
                                supplier.status === 'active' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                                supplier.status === 'inactive' && 'bg-gray-500/10 text-gray-500 border-gray-500/20',
                                supplier.status === 'blacklisted' && 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              )}
                            >
                              {supplier.status?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No recent suppliers found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
