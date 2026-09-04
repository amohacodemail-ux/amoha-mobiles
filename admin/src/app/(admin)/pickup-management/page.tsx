'use client';
import React, { useState } from 'react';
import { PackageCheck, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PickupManagementPage() {
  const columns: Column<any>[] = [
    { key: 'requestId', header: 'Request ID', render: (r) => <span className="font-medium">{r.requestId}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'address', header: 'Pickup Address', render: (r) => <span className="text-muted-foreground line-clamp-1">{r.address}</span> },
    { key: 'date', header: 'Requested Date', render: (r) => r.date },
    { key: 'status', header: 'Status', render: (r) => (
      <Badge variant="outline" className="capitalize">
        {r.status}
      </Badge>
    )},
    {
      key: 'actions', header: 'Actions', render: (r) => (
        <div className="flex gap-2">
          {r.status === 'Pending' && (
            <Button variant="outline" size="sm" className="h-8">
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Pickup
            </Button>
          )}
        </div>
      )
    }
  ];

  const dummyData = [
    { id: 1, requestId: 'REQ-2001', customerName: 'Alice Brown', address: '789 Pine St, City', date: '2023-11-20', status: 'Pending' },
    { id: 2, requestId: 'REQ-2002', customerName: 'Bob White', address: '321 Elm St, Town', date: '2023-11-19', status: 'Confirmed' },
  ];

  return (
    <div>
      <PageHeader title="Pickup Management" description="View and confirm pickup requests" />

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={dummyData}
            columns={columns}
            loading={false}
            rowKey={(row) => row.id.toString()}
            emptyMessage="No pickup requests found."
            
          />
        </CardContent>
      </Card>
    </div>
  );
}
