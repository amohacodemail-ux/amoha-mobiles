'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { logisticsService } from '@/services/logistics.service';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ShipmentTrackingPage() {
  const [search, setSearch] = useState('');

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getDeliveries();
      // Only show orders that have been assigned
      setDeliveries(data.filter((d: any) => d.logisticsStatus && d.logisticsStatus !== 'Pending'));
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenUpdate = (order: any) => {
    setSelectedOrder(order);
    setUpdateStatus(order.logisticsStatus || 'Assigned');
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await logisticsService.updateShipmentStatus(selectedOrder.id, updateStatus);
      toast.success('Shipment status updated');
      setIsModalOpen(false);
      load();
    } catch {
      toast.error('Failed to update shipment status');
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<any>[] = [
    { key: 'trackingNumber', header: 'Tracking Number', render: (r) => <span className="font-medium text-primary">{r.trackingNumber || '—'}</span> },
    { key: 'orderId', header: 'Order ID', render: (r) => r.orderNumber },
    { key: 'deliveryStatus', header: 'Logistics Status', render: (r) => (
      <Badge variant="outline" className="capitalize">
        {r.logisticsStatus?.replace(/_/g, ' ') || 'Assigned'}
      </Badge>
    )},
    { key: 'estimatedDate', header: 'Estimated Delivery Date', render: (r) => r.estimated_delivery ? new Date(r.estimated_delivery).toLocaleDateString() : '—' },
    {
      key: 'actions', header: 'Actions', render: (r) => (
        <Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenUpdate(r)}>
          Update
        </Button>
      )
    }
  ];

  const filteredData = deliveries.filter(d => 
    (d.trackingNumber && d.trackingNumber.toLowerCase().includes(search.toLowerCase())) || 
    (d.orderNumber && d.orderNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <PageHeader title="Shipment Tracking" description="Track shipments and current delivery status">
        <Input 
          placeholder="Search Tracking or Order ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredData}
            columns={columns}
            loading={loading}
            rowKey={(row) => row.id}
            emptyMessage="No shipments found."
          />
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Order ID</label>
              <Input value={selectedOrder?.orderNumber || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Logistics Status</label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Picked Up">Picked Up</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!selectedOrder?.trackingNumber && (
              <p className="text-xs text-muted-foreground italic text-blue-600 mt-2">
                A Tracking Number will automatically be generated.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
