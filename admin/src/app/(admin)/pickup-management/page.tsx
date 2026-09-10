'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { PackageCheck, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logisticsService } from '@/services/logistics.service';
import toast from 'react-hot-toast';

export default function PickupManagementPage() {
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getPickupRequests();
      setPickups(data);
    } catch {
      toast.error('Failed to load pickup requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (id: string) => {
    setUpdatingId(id);
    try {
      await logisticsService.updatePickupStatus(id, 'Confirmed');
      toast.success('Pickup Confirmed');
      load();
    } catch {
      toast.error('Failed to confirm pickup');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<any>[] = [
    { key: 'requestId', header: 'Request ID', render: (r) => <span className="font-medium">{r.requestId}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'address', header: 'Pickup Address', render: (r) => <span className="text-muted-foreground line-clamp-1">{r.address}</span> },
    { key: 'date', header: 'Requested Date', render: (r) => r.date ? new Date(r.date).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: (r) => (
      <Badge variant="outline" className="capitalize">
        {r.pickupStatus}
      </Badge>
    )},
    {
      key: 'actions', header: 'Actions', render: (r) => (
        <div className="flex gap-2">
          {r.pickupStatus === 'Pending' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              disabled={updatingId === r.id}
              onClick={() => handleConfirm(r.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {updatingId === r.id ? 'Confirming...' : 'Confirm Pickup'}
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Pickup Management" description="View and confirm pickup requests" />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={pickups}
            columns={columns}
            loading={loading}
            rowKey={(row) => row.id}
            emptyMessage="No pickup requests found."
            
          />
        </CardContent>
      </Card>
    </div>
  );
}
