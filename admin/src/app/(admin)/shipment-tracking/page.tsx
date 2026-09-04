'use client';
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ShipmentTrackingPage() {
  const [search, setSearch] = useState('');

  const columns: Column<any>[] = [
    { key: 'trackingNumber', header: 'Tracking Number', render: (r) => <span className="font-medium text-primary">{r.trackingNumber}</span> },
    { key: 'orderId', header: 'Order ID', render: (r) => r.orderId },
    { key: 'shipmentStatus', header: 'Shipment Status', render: (r) => (
      <Badge variant="secondary" className="capitalize">
        {r.shipmentStatus}
      </Badge>
    )},
    { key: 'deliveryStatus', header: 'Delivery Status', render: (r) => (
      <Badge variant="outline" className="capitalize">
        {r.deliveryStatus}
      </Badge>
    )},
    { key: 'estimatedDate', header: 'Estimated Delivery Date', render: (r) => r.estimatedDate },
  ];

  const dummyData = [
    { id: 1, trackingNumber: 'TRK-987654321', orderId: 'ORD-1001', shipmentStatus: 'Dispatched', deliveryStatus: 'In Transit', estimatedDate: '2023-11-25' },
    { id: 2, trackingNumber: 'TRK-123456789', orderId: 'ORD-1002', shipmentStatus: 'Processing', deliveryStatus: 'Pending', estimatedDate: '2023-11-28' },
  ];

  const filteredData = dummyData.filter(d => d.trackingNumber.toLowerCase().includes(search.toLowerCase()) || d.orderId.toLowerCase().includes(search.toLowerCase()));

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
            loading={false}
            rowKey={(row) => row.id.toString()}
            emptyMessage="No shipments found."
            
          />
        </CardContent>
      </Card>
    </div>
  );
}
