'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Banknote, CheckCircle2, Clock, AlertCircle, IndianRupee, User, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { logisticsService } from '@/services/logistics.service';
import toast from 'react-hot-toast';

interface CodOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  collectionStatus: 'Pending Collection' | 'Received';
  deliveryPerson: string | null;
  deliveryPersonContact: string | null;
  codCollectedAt: string | null;
  codCollectedAmount: number | null;
  createdAt: string;
}

export default function CodCollectionPage() {
  const [orders, setOrders] = useState<CodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CodOrder | null>(null);
  const [collectedAmount, setCollectedAmount] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [amountError, setAmountError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getCodOrders();
      setOrders(data);
    } catch {
      toast.error('Failed to load COD orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenModal = (order: CodOrder) => {
    setSelectedOrder(order);
    setCollectedAmount(String(order.orderAmount));
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setCollectionDate(localIso);
    setAmountError('');
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedOrder) return;

    const parsed = parseFloat(collectedAmount);

    if (isNaN(parsed) || parsed !== selectedOrder.orderAmount) {
      setAmountError(
        `Amount must exactly match the order amount of Rs.${selectedOrder.orderAmount.toLocaleString('en-IN')}. Please re-enter.`
      );
      return;
    }

    setAmountError('');
    setIsConfirming(true);
    try {
      await logisticsService.confirmCodCollection(
        selectedOrder.id,
        parsed,
        collectionDate ? new Date(collectionDate).toISOString() : new Date().toISOString()
      );
      toast.success(`COD collected for Order ${selectedOrder.orderNumber}. Payment marked as Paid.`);
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to confirm COD collection';
      toast.error(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      (o.deliveryPerson && o.deliveryPerson.toLowerCase().includes(q))
    );
  });

  const pendingCount = orders.filter((o) => o.collectionStatus === 'Pending Collection').length;
  const receivedCount = orders.filter((o) => o.collectionStatus === 'Received').length;
  const pendingAmount = orders
    .filter((o) => o.collectionStatus === 'Pending Collection')
    .reduce((sum, o) => sum + (o.orderAmount || 0), 0);

  const columns: Column<CodOrder>[] = [
    {
      key: 'orderNumber',
      header: 'Order ID',
      render: (r) => (
        <span className="font-semibold text-primary font-mono text-xs">{r.orderNumber}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{r.customerName}</span>
        </div>
      ),
    },
    {
      key: 'orderAmount',
      header: 'Order Amount',
      render: (r) => (
        <span className="font-semibold">
          Rs.{(r.orderAmount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'deliveryPerson',
      header: 'Delivery Person',
      render: (r) =>
        r.deliveryPerson ? (
          <div>
            <p className="font-medium">{r.deliveryPerson}</p>
            {r.deliveryPersonContact && (
              <p className="text-xs text-muted-foreground">{r.deliveryPersonContact}</p>
            )}
          </div>
        ) : (
          <span className="italic text-muted-foreground text-sm">Not assigned</span>
        ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: () => (
        <Badge variant="outline" className="gap-1">
          <Banknote className="h-3 w-3" />
          Cash on Delivery
        </Badge>
      ),
    },
    {
      key: 'orderStatus',
      header: 'Order Status',
      render: () => (
        <Badge variant="success" className="capitalize">
          Delivered
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      render: (r) => (
        <Badge
          variant={r.paymentStatus === 'paid' ? 'success' : 'warning'}
          className="capitalize"
        >
          {r.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'collectionStatus',
      header: 'Collection Status',
      render: (r) =>
        r.collectionStatus === 'Received' ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm">Received</span>
            {r.codCollectedAt && (
              <span className="text-xs text-muted-foreground ml-1">
                {new Date(r.codCollectedAt).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm">Pending Collection</span>
          </div>
        ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (r) =>
        r.collectionStatus === 'Pending Collection' ? (
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => handleOpenModal(r)}
          >
            <IndianRupee className="h-3.5 w-3.5" />
            Mark Cash Received
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground italic">Collected</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="COD Collection"
        description="Confirm cash collected from delivered COD orders and update payment status"
      >
        <Input
          placeholder="Search order, customer, delivery person..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending Collection</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending Amount</p>
              <p className="text-2xl font-bold">Rs.{pendingAmount.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Received</p>
              <p className="text-2xl font-bold">{receivedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredOrders}
            columns={columns}
            loading={loading}
            rowKey={(row) => row.id}
            emptyMessage="No delivered COD orders found."
          />
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Confirm Cash Collection
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2">
              {/* Order details (read-only) */}
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Order ID</span>
                  <span className="font-mono font-semibold">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Customer</span>
                  <span className="font-medium">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Order Amount</span>
                  <span className="font-bold text-base">
                    Rs.{(selectedOrder.orderAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Delivery Person</span>
                  <span className="font-medium">
                    {selectedOrder.deliveryPerson || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Payment Method</span>
                  <span className="font-medium">Cash on Delivery</span>
                </div>
              </div>

              {/* Collected Amount */}
              <div className="space-y-2">
                <label htmlFor="cod-amount" className="text-sm font-medium flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                  Collected Amount *
                </label>
                <Input
                  id="cod-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={collectedAmount}
                  onChange={(e) => {
                    setCollectedAmount(e.target.value);
                    setAmountError('');
                  }}
                  placeholder={`Enter collected amount (${selectedOrder.orderAmount})`}
                  className={amountError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {amountError && (
                  <div className="flex items-start gap-1.5 text-destructive text-xs">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{amountError}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Must exactly match the order amount of{' '}
                  <span className="font-semibold">
                    Rs.{(selectedOrder.orderAmount || 0).toLocaleString('en-IN')}
                  </span>
                </p>
              </div>

              {/* Collection Date & Time */}
              <div className="space-y-2">
                <label htmlFor="cod-date" className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Collection Date &amp; Time
                </label>
                <Input
                  id="cod-date"
                  type="datetime-local"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                />
              </div>

              {/* Warning banner */}
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  This action will mark the payment as <strong>Paid</strong> for order{' '}
                  <strong>{selectedOrder.orderNumber}</strong>. This cannot be undone.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isConfirming}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || !collectedAmount}
              className="gap-1.5"
            >
              {isConfirming ? (
                'Confirming...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Collection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
