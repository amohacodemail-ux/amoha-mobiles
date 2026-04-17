'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Clock, Package, Truck, MapPin, CreditCard, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { orderService } from '@/services/order.service';
import { formatCurrency, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_STEPS: OrderStatus[] = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [logisticsPartner, setLogisticsPartner] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [updatingTracking, setUpdatingTracking] = useState(false);

  useEffect(() => {
    orderService.getById(params.id)
      .then((o) => {
        setOrder(o);
        setSelectedStatus('');
        setTrackingNumber(o.trackingNumber || '');
        setTrackingUrl(o.trackingUrl || '');
        setLogisticsPartner(o.logisticsPartner || '');
        setEstimatedDelivery(o.estimatedDelivery ? o.estimatedDelivery.split('T')[0] : '');
      })
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdateTracking = async () => {
    if (!order) return;
    setUpdatingTracking(true);
    try {
      const updated = await orderService.updateTracking(order._id, {
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
        logisticsPartner: logisticsPartner || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
      });
      setOrder(updated);
      toast.success('Tracking info updated');
    } catch { toast.error('Failed to update tracking'); }
    finally { setUpdatingTracking(false); }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || !order) return;
    setUpdating(true);
    try {
      const updated = await orderService.updateStatus(order._id, selectedStatus);
      setOrder(updated);
      setSelectedStatus('');
      toast.success(`Order status updated to ${selectedStatus.replace(/_/g, ' ')}`);
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 shimmer rounded w-48" />
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 shimmer rounded-xl" />)}
    </div>
  );

  if (!order) return <div className="text-center py-20 text-muted-foreground">Order not found.</div>;

  const isWalkIn = (order as any).isWalkIn;
  const stepIndex = STATUS_STEPS.indexOf(order.orderStatus);
  const nextOptions = NEXT_STATUS[order.orderStatus] ?? [];

  return (
    <div>
      <PageHeader title={`Order #${order.orderNumber}`} description={`${isWalkIn ? 'POS / Walk-in order' : 'Online order'} — ${formatDateTime(order.createdAt)}`}>
        <Link href="/orders"><Button variant="outline"><ArrowLeft className="h-4 w-4" />Back to Orders</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Progress tracker */}
          {!['cancelled', 'returned'].includes(order.orderStatus) && (
            <Card>
              <CardHeader><CardTitle>Order Progress</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i <= stepIndex ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground bg-secondary'}`}>
                          {i < stepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize text-center leading-tight">{step.replace(/_/g, ' ')}</span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? 'bg-primary' : 'bg-border'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader><CardTitle>Order Items ({order.items.length})</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {item.product.thumbnail && <Image src={item.product.thumbnail} alt={item.product.name} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.product.name}</p>
                    {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium capitalize">{h.status.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{h.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(h.date)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Update status */}
          {nextOptions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as OrderStatus)}>
                  <SelectTrigger><SelectValue placeholder="Select next status" /></SelectTrigger>
                  <SelectContent>
                    {nextOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" onClick={handleUpdateStatus} loading={updating} disabled={!selectedStatus}>
                  Update Order Status
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tracking Info - only for online orders */}
          {!isWalkIn && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" />Tracking Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Logistics Partner</label>
                <Select value={logisticsPartner} onValueChange={setLogisticsPartner}>
                  <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="professional_courier">Professional Courier</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tracking Number</label>
                <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Enter tracking number" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tracking URL</label>
                <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estimated Delivery</label>
                <Input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleUpdateTracking} loading={updatingTracking}>
                Save Tracking Info
              </Button>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Open tracking link
                </a>
              )}
            </CardContent>
          </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-green-600 dark:text-green-400">-{formatCurrency(order.discount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{order.deliveryCharge === 0 ? 'Free' : formatCurrency(order.deliveryCharge)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2"><span>Total</span><span>{formatCurrency(order.totalAmount)}</span></div>
              <div className="pt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">
                    {isWalkIn
                      ? `POS — ${(order as any).posPaymentMethod || 'cash'}`
                      : order.paymentMethod === 'razorpay' ? 'Razorpay (Online)' : 'Cash on Delivery'}
                  </span>
                  <span className={`ml-auto inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                </div>
                {isWalkIn && (order as any).invoiceNumber && (
                  <div className="flex items-center gap-2 pt-1">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Invoice: <span className="font-mono text-foreground">{(order as any).invoiceNumber}</span></span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex items-start gap-2 pt-1">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Razorpay Payment ID</p>
                      <p className="text-xs font-mono text-foreground break-all">{order.razorpayPaymentId}</p>
                      <a href={`https://dashboard.razorpay.com/app/payments/${order.razorpayPaymentId}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">View on Razorpay →</a>
                    </div>
                  </div>
                )}
                {order.razorpayOrderId && (
                  <div className="flex items-start gap-2 pt-1">
                    <Package className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Razorpay Order ID</p>
                      <p className="text-xs font-mono text-foreground break-all">{order.razorpayOrderId}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={`text-[10px] font-semibold inline-flex rounded-full border px-2 py-0.5 ${getOrderStatusColor(order.orderStatus)}`}>{order.orderStatus.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {isWalkIn ? (
                <>
                  <p className="font-semibold text-foreground">{(order as any).walkInCustomerName || 'Walk-in Customer'}</p>
                  {(order as any).walkInCustomerPhone && <p className="text-muted-foreground">{(order as any).walkInCustomerPhone}</p>}
                  {(order as any).walkInCustomerEmail && <p className="text-muted-foreground">{(order as any).walkInCustomerEmail}</p>}
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30 mt-1">Walk-in / POS</span>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">{order.user.name}</p>
                  <p className="text-muted-foreground">{order.user.email}</p>
                  <p className="text-muted-foreground">{order.user.phone}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shipping - only for online orders */}
          {!isWalkIn && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" />Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-0.5">
                <p className="text-foreground font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
