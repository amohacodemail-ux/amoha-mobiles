'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Truck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logisticsService } from '@/services/logistics.service';
import toast from 'react-hot-toast';

export default function DeliveryManagementPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const columns: Column<any>[] = [
    { key: 'orderId', header: 'Order ID', render: (r) => <span className="font-medium">{r.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'address', header: 'Address', render: (r) => <span className="text-muted-foreground line-clamp-1">{r.address}</span> },
    { key: 'status', header: 'Status', render: (r) => (
      <Badge variant="outline" className="capitalize">
        {r.logisticsStatus?.replace(/_/g, ' ') || 'Pending'}
      </Badge>
    )},
    { key: 'assignedTo', header: 'Assigned To', render: (r) => r.assignedPerson || '—' },
  ];

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getDeliveries();
      setDeliveries(data);
    } catch {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredData = deliveries.filter(d => {
    const s = d.logisticsStatus || 'Pending';
    return statusFilter === 'all' ? true : s.toLowerCase().replace(/_/g, ' ') === statusFilter.toLowerCase().replace(/_/g, ' ');
  });

  return (
    <div>
      <PageHeader title="Delivery Management" description="Manage and track order deliveries">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed Delivery</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredData}
            columns={columns}
            loading={loading}
            rowKey={(row) => row.id}
            emptyMessage="No delivery tasks found."
            
          />
        </CardContent>
      </Card>
    </div>
  );
}
