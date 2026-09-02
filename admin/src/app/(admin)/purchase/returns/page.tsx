'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw } from 'lucide-react';
import { purchaseService } from '@/services/purchase.service';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { canCreate, canAccess } = useModulePermissions(MODULES.PURCHASE_RETURNS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getReturns();
      setReturns(res || []);
    } catch {
      toast.error('Failed to load Purchase Returns');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) load();
  }, [load, canAccess]);

  const columns: Column<any>[] = [
    { key: 'returnNumber', header: 'Return Number', sortable: true, render: (r) => <span className="font-medium">{r.returnNumber}</span> },
    { key: 'poNumber', header: 'Purchase Order', render: (r) => <span>{r.purchaseOrder?.po_number || r.poId || '-'}</span> },
    { key: 'supplier', header: 'Supplier', render: (r) => <span>{r.supplier?.name}</span> },
    { key: 'totalAmount', header: 'Total Amount', render: (r) => <span className="font-semibold">{formatCurrency(r.totalAmount || 0)}</span> },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => (
        <Badge variant={
          r.status === 'returned' ? 'success' : 
          r.status === 'cancelled' ? 'destructive' : 'secondary'
        }>
          {r.status?.toUpperCase()}
        </Badge>
      ) 
    },
    { key: 'returnDate', header: 'Return Date', render: (r) => <span className="text-muted-foreground text-sm">{formatDate(r.returnDate || r.createdAt)}</span> },
  ];

  if (!canAccess) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view Purchase Returns.</div>;
  }

  return (
    <div>
      <PageHeader title="Purchase Returns" description="Manage returned products to suppliers.">
        {canCreate && (
          <Button onClick={() => toast('Create Return functionality coming soon!')}>
            <Plus className="h-4 w-4 mr-2" />
            New Return
          </Button>
        )}
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyMessage="No return records found."
      />
    </div>
  );
}

