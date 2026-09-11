import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviceRequestService, type ServiceRequest } from '@/services/service-request.service';
import toast from 'react-hot-toast';

interface Props {
  request: ServiceRequest;
  onUpdate: () => void;
  canEdit: boolean;
}

export function ServiceBillingSection({ request, onUpdate, canEdit }: Props) {
  const isOnlinePaid = request.paymentMethod === 'razorpay' && request.paymentStatus === 'paid';
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState({
    serviceCharges: request.serviceCharges || '',
    partsCharges: request.partsCharges || '',
    paymentMethod: request.paymentMethod || '',
    paymentStatus: request.paymentStatus || 'pending',
  });

  useEffect(() => {
    setBilling({
      serviceCharges: request.serviceCharges || '',
      partsCharges: request.partsCharges || '',
      paymentMethod: request.paymentMethod || '',
      paymentStatus: request.paymentStatus || 'pending',
    });
  }, [request]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBilling(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setBilling(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    return (Number(billing.serviceCharges) || 0) + (Number(billing.partsCharges) || 0);
  };

  const handleSaveBilling = async () => {
    setLoading(true);
    try {
      const totalAmount = calculateTotal();
      await serviceRequestService.updateStatus(request._id, request.status, request.adminNotes, request.finalPrice, {
        serviceCharges: Number(billing.serviceCharges),
        partsCharges: Number(billing.partsCharges),
        totalAmount,
        paymentMethod: billing.paymentMethod,
        paymentStatus: billing.paymentStatus as 'pending' | 'paid',
      });
      toast.success('Billing details updated');
      onUpdate();
    } catch (err) {
      toast.error('Failed to update billing');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      await serviceRequestService.downloadInvoice(request._id, request.invoiceNumber || request.requestNumber);
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-lg border-b border-border pb-2">Billing & Invoice</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {canEdit ? (
          <>
            <Input 
              name="serviceCharges" 
              type="number" 
              label="Service Charges (₹)" 
              value={billing.serviceCharges} 
              onChange={handleChange} 
            />
            <Input 
              name="partsCharges" 
              type="number" 
              label="Parts Charges (₹)" 
              value={billing.partsCharges} 
              onChange={handleChange} 
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Payment Method</label>
              <Select value={billing.paymentMethod} onValueChange={(v) => handleSelectChange('paymentMethod', v)} disabled={isOnlinePaid}>
                <SelectTrigger><SelectValue placeholder="Select Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Payment Status</label>
              <Select value={billing.paymentStatus} onValueChange={(v) => handleSelectChange('paymentStatus', v)} disabled={isOnlinePaid}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Service Charges</p>
              <p className="text-foreground mt-0.5">₹{request.serviceCharges || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Parts Charges</p>
              <p className="text-foreground mt-0.5">₹{request.partsCharges || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="text-foreground mt-0.5 capitalize">{request.paymentMethod || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Status</p>
              <p className="text-foreground mt-0.5 capitalize">{request.paymentStatus || 'Pending'}</p>
            </div>
          </>
        )}
      </div>

      {isOnlinePaid && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-lg">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-1">Online Payment Details</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700 dark:text-emerald-500">
            <div>
              <span className="font-medium opacity-80">Order ID:</span>
              <p className="break-all">{request.razorpayOrderId}</p>
            </div>
            <div>
              <span className="font-medium opacity-80">Payment ID:</span>
              <p className="break-all">{request.razorpayPaymentId}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg mt-2 border border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Total Amount</p>
          <p className="text-lg font-bold text-primary">₹{canEdit ? calculateTotal() : (request.totalAmount || 0)}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && <Button onClick={handleSaveBilling} loading={loading} variant="secondary">Save Billing</Button>}
          <Button onClick={handleDownloadInvoice}>Download Invoice</Button>
        </div>
      </div>
    </div>
  );
}
