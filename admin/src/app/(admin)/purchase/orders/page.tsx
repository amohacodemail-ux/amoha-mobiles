'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPO, setViewPO] = useState<any | null>(null);

  // Payment UI state
  const [paymentPO, setPaymentPO] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<any>('/suppliers/purchase-orders');
      setOrders(data.data?.purchaseOrders || []);
    } catch {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMakePayment = (po: any) => {
    setPaymentPO(po);
    setPaymentForm({
      amount: po.totalAmount?.toString() || '',
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      notes: ''
    });
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentPO) return;
    setSubmittingPayment(true);
    try {
      await apiClient.post('/purchase/payments', {
        poId: paymentPO._id || paymentPO.id,
        supplierId: paymentPO.supplierId || paymentPO.supplier_id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes
      });
      toast.success('Payment recorded successfully');
      setPaymentPO(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description="Manage your purchase orders." />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-medium text-left">PO Number</th>
                  <th className="px-6 py-3 font-medium text-left">Supplier</th>
                  <th className="px-6 py-3 font-medium text-left">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">Loading...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">No purchase orders found.</td>
                  </tr>
                ) : (
                  orders.map(po => (
                    <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{po.poNumber}</td>
                      <td className="px-6 py-4">{po.supplier?.name}</td>
                      <td className="px-6 py-4">{formatDate(po.createdAt)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(po.totalAmount)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline">{po.status}</Badge>
                          {po.paymentStatus === 'paid' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px]">Paid</Badge>
                          ) : po.paymentStatus === 'partial' ? (
                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none text-[10px]">Partial</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-[10px]">Unpaid</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {po.status === 'accepted' && po.paymentStatus !== 'paid' && (
                          <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleMakePayment(po)}>
                            Make Payment
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setViewPO(po)}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={!!viewPO} onOpenChange={(open) => !open && setViewPO(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details - {viewPO?.poNumber}</DialogTitle>
          </DialogHeader>
          {viewPO && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                  <p className="font-medium">{viewPO.supplier?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline">{viewPO.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p>{formatDate(viewPO.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="font-bold">{formatCurrency(viewPO.totalAmount)}</p>
                </div>
                {viewPO.trackingNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                    <p>{viewPO.trackingNumber}</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewPO.items?.map((item: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{item.product?.name || 'Unknown Product'}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{formatCurrency(item.unitCost)}</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(item.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPO(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={!!paymentPO} onOpenChange={(open) => !open && setPaymentPO(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Advance Payment</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Record payment for {paymentPO?.poNumber}</p>
          </DialogHeader>
          <form onSubmit={submitPayment}>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center text-sm">
                <span className="text-muted-foreground">PO Amount:</span>
                <span className="font-semibold text-lg">{formatCurrency(paymentPO?.totalAmount || 0)}</span>
              </div>
              
              <div>
                <label className="text-sm font-medium">Payment Amount (₹) *</label>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method *</label>
                <select 
                  className="w-full mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Reference Number (UTR / Txn ID)</label>
                <Input
                  value={paymentForm.referenceNumber}
                  onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  placeholder="e.g. UTR123456789"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none"
                  rows={2}
                  placeholder="Additional payment notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentPO(null)}>Cancel</Button>
              <Button type="submit" disabled={submittingPayment}>{submittingPayment ? 'Processing...' : 'Submit Payment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
