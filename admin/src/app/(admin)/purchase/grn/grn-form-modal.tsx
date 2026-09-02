'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supplierService } from '@/services/supplier.service';
import { purchaseService } from '@/services/purchase.service';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface GRNFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GRNFormModal({ open, onOpenChange, onSuccess }: GRNFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<string>('');

  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchPurchaseOrders();
      setSelectedPoId('');
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setInvoiceNumber('');
      setNotes('');
      setItems([]);
    }
  }, [open]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      // Fetch POs that are not fully received or cancelled
      const pos = await supplierService.getAllPurchaseOrders();
      // Filter out POs that are received or cancelled locally if api doesn't support complex filtering
      const poArray = pos?.purchaseOrders || [];
      const pendingPos = poArray.filter((po: any) => po.status !== 'received' && po.status !== 'cancelled' && po.status !== 'draft');
      setPurchaseOrders(pendingPos);
    } catch (err) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePoChange = async (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const po = await supplierService.getPurchaseOrderById(poId);
      if (po && po.items) {
        // Initialize GRN items
        const initialItems = po.items.map((item: any) => {
          // Calculate how many were already received in previous GRNs if applicable (assuming item.receivedQty exists)
          const alreadyReceived = item.receivedQty || 0;
          const pending = item.quantity - alreadyReceived;

          return {
            poItemId: item.id || item._id,
            productId: item.productId,
            productName: item.product?.name || 'Unknown Product',
            orderedQty: item.quantity,
            alreadyReceived,
            receivedQty: pending > 0 ? pending : 0, // default to receiving the rest
            damagedQty: 0,
          };
        });
        setItems(initialItems);
      }
    } catch (err) {
      toast.error('Failed to load PO details');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: Math.max(0, numValue) };
    setItems(newItems);
  };

  const selectedPo = purchaseOrders.find((po) => po.id === selectedPoId);

  const handleSubmit = async () => {
    if (!selectedPoId) {
      toast.error('Please select a purchase order');
      return;
    }

    const hasInvalidQty = items.some(item => (item.receivedQty + item.damagedQty) > (item.orderedQty - item.alreadyReceived));
    if (hasInvalidQty) {
      toast.error('Total received and damaged quantity cannot exceed the ordered quantity');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        poId: selectedPoId,
        supplierId: selectedPo?.supplierId,
        receivedDate,
        notes: invoiceNumber ? `Invoice: ${invoiceNumber} | ${notes}` : notes,
        items: items.map(item => ({
          poItemId: item.poItemId,
          productId: item.productId,
          orderedQty: item.orderedQty,
          receivedQty: item.receivedQty,
          damagedQty: item.damagedQty
        })).filter(item => item.receivedQty > 0 || item.damagedQty > 0) // Only send items being acted upon
      };

      if (payload.items.length === 0) {
        toast.error('Please enter at least one received or damaged item');
        setSubmitting(false);
        return;
      }

      await purchaseService.createGRN(payload);
      toast.success('Goods Received Note created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create GRN');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Goods Received / GRN</DialogTitle>
        </DialogHeader>

        {loading && purchaseOrders.length === 0 ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Purchase Order</label>
                <Select value={selectedPoId} onValueChange={handlePoChange} disabled={loading || submitting || purchaseOrders.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PO..." />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.length === 0 ? (<SelectItem value="no-data" disabled>No Purchase Orders available for receiving.</SelectItem>) : purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNumber} - {po.supplier?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPo && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Received Date</label>
                    <Input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      disabled={loading || submitting}
                    />
                  </div>
                  <div className="col-span-2 space-y-1 text-sm bg-muted/50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Supplier:</span>
                      <span className="font-medium">{selectedPo.supplier?.name}</span>
                      <span className="text-muted-foreground">PO Date:</span>
                      <span className="font-medium">{formatDate(selectedPo.orderDate || selectedPo.createdAt)}</span>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">₹{selectedPo.totalAmount}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedPoId && items.length === 0 && !loading && (
              <div className="p-4 bg-muted/30 rounded-md text-center text-sm text-muted-foreground mt-4">
                No pending products available for this Purchase Order.
              </div>
            )}

            {selectedPoId && items.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Receive Items</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Product</th>
                        <th className="px-4 py-2 text-right font-medium">Ordered</th>
                        <th className="px-4 py-2 text-right font-medium">Previously Received</th>
                        <th className="px-4 py-2 text-right font-medium">Pending</th>
                        <th className="px-4 py-2 text-right font-medium">Received Now</th>
                        <th className="px-4 py-2 text-right font-medium">Damaged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item, idx) => {
                        const pending = item.orderedQty - item.alreadyReceived;
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.productName}</td>
                            <td className="px-4 py-3 text-right">{item.orderedQty}</td>
                            <td className="px-4 py-3 text-right">{item.alreadyReceived}</td>
                            <td className="px-4 py-3 text-right">{pending}</td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                min="0"
                                max={pending}
                                value={item.receivedQty}
                                onChange={(e) => handleItemChange(idx, 'receivedQty', e.target.value)}
                                className="w-24 ml-auto text-right"
                                disabled={pending <= 0}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                min="0"
                                max={pending}
                                value={item.damagedQty}
                                onChange={(e) => handleItemChange(idx, 'damagedQty', e.target.value)}
                                className="w-24 ml-auto text-right"
                                disabled={pending <= 0}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Supplier Invoice / Delivery Note Number</label>
                    <Input
                      placeholder="Optional reference number"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Notes / Remarks</label>
                    <Input
                      placeholder="Enter any remarks..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPoId || submitting || loading}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Received
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




