'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import { purchaseService } from '@/services/purchase.service';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';
import { GRNFormModal } from './grn-form-modal';

export default function GRNPage() {
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canCreate, canAccess } = useModulePermissions(MODULES.GRN);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getGRNs();
      setGrns(res || []);
    } catch {
      toast.error('Failed to load GRNs');
      setGrns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) load();
  }, [load, canAccess]);

  const columns: Column<any>[] = [
    { key: 'grnNumber', header: 'GRN Number', sortable: true, render: (r) => <span className="font-medium">{r.grnNumber}</span> },
    { key: 'poNumber', header: 'Purchase Order', render: (r) => <span>{r.purchaseOrder?.po_number || r.poId}</span> },
    { key: 'supplier', header: 'Supplier', render: (r) => <span>{r.supplier?.name}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'received' ? 'success' : 'secondary'}>{r.status}</Badge> },
    { key: 'receivedDate', header: 'Received Date', render: (r) => <span className="text-muted-foreground text-sm">{formatDate(r.receivedDate || r.createdAt)}</span> },
  ];

  if (!canAccess) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view Goods Received Notes.</div>;
  }

  return (
    <div>
      <PageHeader title="Goods Received / GRN" description="Record products received from suppliers against Purchase Orders.">
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New GRN
          </Button>
        )}
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={grns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyMessage="No GRN records found."
      />

      <GRNFormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={load} 
      />
    </div>
  );
}

