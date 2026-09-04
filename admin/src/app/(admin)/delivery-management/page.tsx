'use client';
import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DeliveryManagementPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const columns: Column<any>[] = [
    { key: 'orderId', header: 'Order ID', render: (r) => <span className="font-medium">{r.orderId}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'address', header: 'Address', render: (r) => <span className="text-muted-foreground line-clamp-1">{r.address}</span> },
    { key: 'status', header: 'Status', render: (r) => (
      <Badge variant="outline" className="capitalize">
        {r.status}
      </Badge>
    )},
    { key: 'assignedTo', header: 'Assigned To', render: (r) => r.assignedTo || '—' },
  ];

  const dummyData = [
    { id: 1, orderId: 'ORD-1001', customerName: 'John Doe', address: '123 Main St, City', status: 'Pending', assignedTo: '' },
    { id: 2, orderId: 'ORD-1002', customerName: 'Jane Smith', address: '456 Oak Ave, Town', status: 'In Transit', assignedTo: 'Driver A' },
  ];

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
            data={dummyData}
            columns={columns}
            loading={false}
            emptyMessage="No delivery tasks found."
            emptyIcon={Truck}
          />
        </CardContent>
      </Card>
    </div>
  );
}
