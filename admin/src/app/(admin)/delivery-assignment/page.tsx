'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logisticsService } from '@/services/logistics.service';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function DeliveryAssignmentPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [assignName, setAssignName] = useState('');
  const [assignContact, setAssignContact] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getDeliveries();
      // For assignment, we mostly care about all active orders, but let's show all
      setDeliveries(data);
    } catch {
      toast.error('Failed to load deliveries for assignment');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenAssign = (order: any) => {
    setSelectedOrder(order);
    setAssignName(order.assignedPerson || '');
    setAssignContact(order.contact || '');
    setIsModalOpen(true);
  };

  const handleAssign = async () => {
    if (!assignName) return toast.error('Delivery Person name is required');
    setIsAssigning(true);
    try {
      await logisticsService.assignDelivery(selectedOrder.id, assignName, assignContact);
      toast.success('Assigned successfully');
      setIsModalOpen(false);
      load();
    } catch {
      toast.error('Failed to assign delivery');
    } finally {
      setIsAssigning(false);
    }
  };

  const columns: Column<any>[] = [
    { key: 'orderId', header: 'Order ID', render: (r) => <span className="font-medium">{r.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'assignedPerson', header: 'Delivery Person', render: (r) => r.assignedPerson || <span className="italic text-muted-foreground">Unassigned</span> },
    { key: 'contact', header: 'Contact', render: (r) => r.contact || '—' },
    { key: 'status', header: 'Assignment Status', render: (r) => (
      <Badge variant={r.logisticsStatus && r.logisticsStatus !== 'Pending' ? 'success' : 'warning'} className="capitalize">
        {r.logisticsStatus || 'Pending'}
      </Badge>
    )},
    {
      key: 'actions', header: 'Actions', render: (r) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenAssign(r)}>
            {r.assignedPerson ? 'Reassign' : 'Assign'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Delivery Assignment" description="Assign or reassign orders to delivery personnel" />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={deliveries}
            columns={columns}
            loading={loading}
            rowKey={(row) => row.id}
            emptyMessage="No orders available for assignment."
          />
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOrder?.assignedPerson ? 'Reassign Delivery' : 'Assign Delivery'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Order ID</label>
              <Input value={selectedOrder?.orderNumber || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Person Name</label>
              <Input 
                value={assignName} 
                onChange={(e) => setAssignName(e.target.value)} 
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Number</label>
              <Input 
                value={assignContact} 
                onChange={(e) => setAssignContact(e.target.value)} 
                placeholder="e.g. +91 9876543210"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={isAssigning || !assignName}>
              {isAssigning ? 'Saving...' : 'Save Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
