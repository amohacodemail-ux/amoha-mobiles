'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, IndianRupee } from 'lucide-react';
import { purchaseService } from '@/services/purchase.service';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';

export default function PurchasePaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { canCreate, canAccess } = useModulePermissions(MODULES.PURCHASE_PAYMENTS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPayments();
      setPayments(res || []);
    } catch {
      toast.error('Failed to load Payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) load();
  }, [load, canAccess]);

  const columns: Column<any>[] = [
    { key: 'poNumber', header: 'Purchase Order', render: (r) => <span>{r.purchaseOrder?.po_number || r.poId}</span> },
    { key: 'supplier', header: 'Supplier', render: (r) => <span>{r.supplier?.name}</span> },
    { key: 'amount', header: 'Paid Amount', sortable: true, render: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: 'paymentMethod', header: 'Method', render: (r) => <span className="capitalize">{r.paymentMethod}</span> },
    { key: 'referenceNumber', header: 'Ref. Number', render: (r) => <span>{r.referenceNumber || '-'}</span> },
    { key: 'paymentDate', header: 'Date', sortable: true, render: (r) => <span className="text-muted-foreground text-sm">{formatDate(r.paymentDate || r.createdAt)}</span> },
  ];

  if (!canAccess) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view Purchase Payments.</div>;
  }

  return (
    <div>
      <PageHeader title="Purchase Payments" description="Track and record supplier payments.">
        {canCreate && (
          <Button onClick={() => toast('Record Payment functionality coming soon!')}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        rowKey={(r) => r.id}
        emptyMessage="No payment records found."
      />
    </div>
  );
}

