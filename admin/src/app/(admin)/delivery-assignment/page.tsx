'use client';
import React from 'react';
import { UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DeliveryAssignmentPage() {
  const columns: Column<any>[] = [
    { key: 'orderId', header: 'Order ID', render: (r) => <span className="font-medium">{r.orderId}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'assignedPerson', header: 'Delivery Person', render: (r) => r.assignedPerson || <span className="italic text-muted-foreground">Unassigned</span> },
    { key: 'contact', header: 'Contact', render: (r) => r.contact || '—' },
    { key: 'status', header: 'Assignment Status', render: (r) => (
      <Badge variant={r.assignedPerson ? 'success' : 'warning'} className="capitalize">
        {r.assignedPerson ? 'Assigned' : 'Pending'}
      </Badge>
    )},
    {
      key: 'actions', header: 'Actions', render: (r) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8">
            {r.assignedPerson ? 'Reassign' : 'Assign'}
          </Button>
        </div>
      )
    }
  ];

  const dummyData = [
    { id: 1, orderId: 'ORD-1001', customerName: 'John Doe', assignedPerson: null, contact: null },
    { id: 2, orderId: 'ORD-1002', customerName: 'Jane Smith', assignedPerson: 'Driver A (Emp 123)', contact: '+1 555-1234' },
  ];

  return (
    <div>
      <PageHeader title="Delivery Assignment" description="Assign or reassign orders to delivery personnel" />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={dummyData}
            columns={columns}
            loading={false}
            rowKey={(row) => row.id.toString()}
            emptyMessage="No orders available for assignment."
            
          />
        </CardContent>
      </Card>
    </div>
  );
}
