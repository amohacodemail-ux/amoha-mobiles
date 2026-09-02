'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { purchaseService, PurchaseStats } from '@/services/purchase.service';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';

export default function PurchaseReportsPage() {
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [supplierReport, setSupplierReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { canAccess } = useModulePermissions(MODULES.PURCHASE_REPORTS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getReports();
      setSupplierReport(res?.supplierReport || []);
      // Ideally these would come from the API, placeholder logic here based on supplierReport
      const totalPurchases = res?.supplierReport?.reduce((acc: number, s: any) => acc + s.totalPurchase, 0) || 0;
      const outstandingBalance = res?.supplierReport?.reduce((acc: number, s: any) => acc + s.outstandingBalance, 0) || 0;
      
      setStats({
        totalPurchases,
        totalReceived: 0,
        totalReturns: 0,
        totalPaid: totalPurchases - outstandingBalance,
        outstandingBalance,
      });
    } catch {
      toast.error('Failed to load Reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) load();
  }, [load, canAccess]);

  const supplierColumns: Column<any>[] = [
    { key: 'supplierName', header: 'Supplier', sortable: true, render: (r) => <span className="font-medium">{r.supplierName}</span> },
    { key: 'totalPurchase', header: 'Total Purchase', sortable: true, render: (r) => <span>{formatCurrency(r.totalPurchase)}</span> },
    { key: 'outstandingBalance', header: 'Outstanding', sortable: true, render: (r) => <span className="text-destructive font-medium">{formatCurrency(r.outstandingBalance)}</span> },
  ];

  if (!canAccess) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view Purchase Reports.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Reports" description="Comprehensive reports and analytics for the purchase module." />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Purchases"
          value={formatCurrency(stats?.totalPurchases || 0)}
          icon={<BarChart3 className="h-5 w-5" />}
          iconColor="text-blue-600 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(stats?.totalPaid || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <StatCard
          title="Total Returns"
          value={formatCurrency(stats?.totalReturns || 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="text-rose-600 dark:text-rose-400"
          loading={loading}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats?.outstandingBalance || 0)}
          icon={<Clock className="h-5 w-5" />}
          iconColor="text-amber-600 dark:text-amber-400"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supplier-wise Report</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={supplierColumns}
              data={supplierReport}
              loading={loading}
              rowKey={(r) => r.supplierId}
              emptyMessage="No data available."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
