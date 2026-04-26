'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search, Package, RefreshCw, X, CheckCircle, AlertCircle, Camera,
  ScanLine, Smartphone, Printer, ShoppingCart, Trash2, Plus, Minus,
  CreditCard, Banknote, QrCode, IndianRupee, FileText, Receipt,
  TrendingUp, Clock, User, Phone, Mail,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { barcodeService, BarcodeProduct } from '@/services/barcode.service';
import { posService, type PosBillingInfo, type PosTodayStats, type PosOrderResult } from '@/services/pos.service';
import { productService } from '@/services/product.service';
import { formatCurrency, getInitials } from '@/lib/utils';
import type { Product } from '@/types';

const LIMIT = 15;
type BillingItem = BarcodeProduct & { quantity: number };
type PaymentMethod = 'cash' | 'card' | 'upi' | 'other';
type ActiveView = 'billing' | 'history' | 'products';

export default function BarcodePage() {
  // Lookup state
  const [query, setQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<BarcodeProduct | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [looking, setLooking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [detectedCode, setDetectedCode] = useState('');

  // Products table state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Billing state
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [posDiscount, setPosDiscount] = useState(0);
  const [posDiscountType, setPosDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState<PosOrderResult | null>(null);

  // Billing info and stats
  const [billingInfo, setBillingInfo] = useState<PosBillingInfo | null>(null);
  const [todayStats, setTodayStats] = useState<PosTodayStats | null>(null);

  // POS order history
  const [posOrders, setPosOrders] = useState<any[]>([]);
  const [posOrdersLoading, setPosOrdersLoading] = useState(false);
  const [posPage, setPosPage] = useState(1);
  const [posTotalPages, setPosTotalPages] = useState(1);
  const [posTotalItems, setPosTotalItems] = useState(0);
  const [posSearch, setPosSearch] = useState('');

  // View toggle
  const [activeView, setActiveView] = useState<ActiveView>('billing');

  // Load billing info + today stats on mount
  useEffect(() => {
    posService.getBillingInfo().then(setBillingInfo).catch(() => {});
    posService.getTodayStats().then(setTodayStats).catch(() => {});
  }, []);

  const debouncedSearch = useDebouncedValue(search, 350);

  const loadProducts = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await productService.getAll({ page, limit: LIMIT, search: debouncedSearch || undefined });
      setProducts(Array.isArray(res.products) ? res.products : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalProducts);
    } catch {
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoadingTable(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const loadPosOrders = useCallback(async () => {
    setPosOrdersLoading(true);
    try {
      const res = await posService.getOrders({ page: posPage, limit: 15, search: posSearch || undefined });
      setPosOrders(Array.isArray(res.orders) ? res.orders : []);
      setPosTotalPages(res.totalPages);
      setPosTotalItems(res.totalOrders);
    } catch {
      toast.error('Failed to load POS orders');
      setPosOrders([]);
    } finally {
      setPosOrdersLoading(false);
    }
  }, [posPage, posSearch]);

  useEffect(() => {
    if (activeView === 'history') loadPosOrders();
  }, [activeView, loadPosOrders]);
  useEffect(() => { setPosPage(1); }, [posSearch]);

  // Camera

  const stopCamera = useCallback(() => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScannerOpen(false);
  }, []);

  useEffect(() => {
    setCameraSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
    return () => stopCamera();
  }, [stopCamera]);

  const handleLookup = async (rawCode?: string) => {
    const code = (rawCode ?? query).trim();
    if (!code) return;
    setQuery(code);
    setDetectedCode(code);
    setLooking(true);
    setLookupResult(null);
    setLookupError('');
    try {
      const result = await barcodeService.stockCheck(code);
      setLookupResult(result);
      if (rawCode) {
        addToBilling(result);
      }
    } catch {
      setLookupError(`No product found for code: ${code}`);
    } finally {
      setLooking(false);
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera scanning is not supported on this device or browser.');
      return;
    }
    try {
      setCameraError('');
      setLookupError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setScannerOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      if (!BarcodeDetectorClass) {
        setCameraError('Live preview is open. For auto scanning, use Chrome on Android. USB/Bluetooth scanners work instantly.');
        return;
      }
      const detector = new BarcodeDetectorClass({
        formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e', 'qr_code'],
      });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          const scanned = results?.[0]?.rawValue?.trim();
          if (scanned) {
            stopCamera();
            await handleLookup(scanned);
            return;
          }
        } catch { /* ignore */ }
        scanFrameRef.current = window.requestAnimationFrame(scan);
      };
      scanFrameRef.current = window.requestAnimationFrame(scan);
    } catch {
      stopCamera();
      setCameraError('Unable to access camera. Allow permission and try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleRegenerate = async (productId: string) => {
    setRegeneratingId(productId);
    try {
      await barcodeService.regenerate(productId);
      toast.success('Barcode regenerated');
      loadProducts();
    } catch {
      toast.error('Failed to regenerate barcode');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Billing helpers

  const addToBilling = (product: BarcodeProduct) => {
    setBillingItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= existing.stock) {
          toast.error(`Only ${existing.stock} units available for "${product.name}"`);
          return prev;
        }
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      if (product.stock <= 0) {
        toast.error(`"${product.name}" is out of stock`);
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateBillingQty = (productId: string, delta: number) => {
    setBillingItems((prev) =>
      prev.map((item) => {
        if (item._id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          toast.error(`Only ${item.stock} units available`);
          return item;
        }
        return { ...item, quantity: Math.max(0, newQty) };
      }).filter((item) => item.quantity > 0),
    );
  };

  const removeBillingItem = (productId: string) => {
    setBillingItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const clearBilling = () => {
    setBillingItems([]);
    setPosDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setPaymentMethod('cash');
    setLastOrder(null);
  };

  // Calculations
  const subtotal = billingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const billingUnits = billingItems.reduce((sum, item) => sum + item.quantity, 0);
  let discountAmount = 0;
  if (posDiscount > 0) {
    discountAmount = posDiscountType === 'percentage' ? Math.round((subtotal * posDiscount) / 100) : posDiscount;
    if (discountAmount > subtotal) discountAmount = subtotal;
  }
  const afterDiscount = subtotal - discountAmount;
  const enableGst = billingInfo?.billing?.enableGst ?? false;
  const gstRate = billingInfo?.billing?.gstRate ?? 18;
  let gstAmount = 0;
  if (enableGst && gstRate > 0) {
    gstAmount = Math.round(afterDiscount - (afterDiscount * 100) / (100 + gstRate));
  }
  const grandTotal = afterDiscount;

  // Create POS Order
  const handleCreateOrder = async () => {
    if (billingItems.length === 0) return toast.error('Add items to billing first');
    setCreatingOrder(true);
    try {
      const result = await posService.createOrder({
        items: billingItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        paymentMethod,
        posDiscount: posDiscount || undefined,
        posDiscountType: posDiscount > 0 ? posDiscountType : undefined,
      });
      setLastOrder(result);
      toast.success(`Order ${result.invoiceNumber} created! Stock updated.`);
      posService.getTodayStats().then(setTodayStats).catch(() => {});
      loadProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Print helpers

  const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const printInvoice = (orderData?: PosOrderResult) => {
    const data = orderData || lastOrder;
    if (!data) return;
    const order = data.order;
    const billing = data.billing || billingInfo?.billing || {};
    const printWindow = window.open('', '_blank', 'width=500,height=800');
    if (!printWindow) return;

    const itemsHtml = (order.items || []).map((item: any) => {
      const name = escapeHtml(item.product?.name || 'Product');
      const qty = item.quantity;
      const price = item.price;
      const total = price * qty;
      return `<tr>
        <td style="padding:6px 4px;border-bottom:1px solid #eee;">${name}</td>
        <td style="padding:6px 4px;text-align:center;border-bottom:1px solid #eee;">${qty}</td>
        <td style="padding:6px 4px;text-align:right;border-bottom:1px solid #eee;">Rs.${price.toLocaleString('en-IN')}</td>
        <td style="padding:6px 4px;text-align:right;border-bottom:1px solid #eee;">Rs.${total.toLocaleString('en-IN')}</td>
      </tr>`;
    }).join('');

    const businessName = escapeHtml(billing.businessName || billingInfo?.siteName || 'AMOHA Mobiles');
    const gstin = billing.gstin ? `GSTIN: ${escapeHtml(billing.gstin)}` : '';
    const addr = escapeHtml(billing.billingAddress || billingInfo?.address || '');
    const phone = escapeHtml(billing.billingPhone || billingInfo?.contactPhone || '');
    const invoiceNum = escapeHtml(order.invoiceNumber || order.orderNumber || '');
    const footer = escapeHtml(billing.footerNote || 'Thank you for your purchase!');
    const terms = billing.termsOnInvoice ? `<p style="font-size:10px;color:#888;margin-top:12px;">${escapeHtml(billing.termsOnInvoice)}</p>` : '';

    const gstSection = data.gstRate > 0 ? `
      <tr><td colspan="3" style="text-align:right;padding:3px 4px;font-size:12px;color:#666;">CGST (${data.gstRate / 2}%)</td><td style="text-align:right;padding:3px 4px;font-size:12px;">Rs.${Math.round(data.gstAmount / 2).toLocaleString('en-IN')}</td></tr>
      <tr><td colspan="3" style="text-align:right;padding:3px 4px;font-size:12px;color:#666;">SGST (${data.gstRate / 2}%)</td><td style="text-align:right;padding:3px 4px;font-size:12px;">Rs.${Math.round(data.gstAmount / 2).toLocaleString('en-IN')}</td></tr>
    ` : '';

    const discountRow = order.discount > 0 ? `<tr><td colspan="3" style="text-align:right;padding:3px 4px;font-size:12px;color:#666;">Discount</td><td style="text-align:right;padding:3px 4px;font-size:12px;color:green;">-Rs.${order.discount.toLocaleString('en-IN')}</td></tr>` : '';

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoiceNum}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;max-width:420px;margin:0 auto;color:#222;}
        h1{font-size:20px;margin:0 0 4px;}
        .meta{font-size:11px;color:#555;margin:1px 0;}
        .divider{border-top:1px dashed #ccc;margin:10px 0;}
        table{width:100%;border-collapse:collapse;font-size:13px;}
        th{text-align:left;padding:6px 4px;border-bottom:2px solid #333;font-size:12px;}
        .total-row td{font-weight:700;font-size:15px;border-top:2px solid #333;padding:8px 4px;}
        .footer{text-align:center;margin-top:16px;font-size:12px;color:#666;}
        @media print{body{padding:8px;}}
      </style>
    </head><body onload="window.print();">
      <div style="text-align:center;">
        <h1>${businessName}</h1>
        ${gstin ? `<p class="meta">${gstin}</p>` : ''}
        ${addr ? `<p class="meta">${addr}</p>` : ''}
        ${phone ? `<p class="meta">Phone: ${phone}</p>` : ''}
      </div>
      <div class="divider"></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;">
        <div><strong>Invoice:</strong> ${invoiceNum}</div>
        <div>${new Date(order.createdAt).toLocaleString('en-IN')}</div>
      </div>
      ${order.walkInCustomerName && order.walkInCustomerName !== 'Walk-in Customer' ? `<div style="font-size:12px;margin-top:4px;"><strong>Customer:</strong> ${escapeHtml(order.walkInCustomerName)} ${order.walkInCustomerPhone ? '| ' + escapeHtml(order.walkInCustomerPhone) : ''}</div>` : ''}
      <div style="font-size:12px;margin-top:2px;"><strong>Payment:</strong> ${escapeHtml(order.posPaymentMethod?.toUpperCase() || 'CASH')}</div>
      <div class="divider"></div>
      <table>
        <thead><tr>
          <th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th>
        </tr></thead>
        <tbody>
          ${itemsHtml}
          <tr><td colspan="3" style="text-align:right;padding:6px 4px;font-size:12px;color:#666;">Subtotal</td><td style="text-align:right;padding:6px 4px;">Rs.${order.subtotal.toLocaleString('en-IN')}</td></tr>
          ${discountRow}
          ${gstSection}
          <tr class="total-row"><td colspan="3" style="text-align:right;">Grand Total</td><td style="text-align:right;">Rs.${order.totalAmount.toLocaleString('en-IN')}</td></tr>
        </tbody>
      </table>
      <div class="divider"></div>
      <div class="footer">
        <p>${footer}</p>
        ${terms}
      </div>
    </body></html>`);
    printWindow.document.close();
  };

  const printBarcodeLabel = (product: { name: string; sku?: string; barcode?: string; price?: number }) => {
    const printWindow = window.open('', '_blank', 'width=420,height=560');
    if (!printWindow) return;
    const code = escapeHtml(product.barcode || product.sku || 'NO-CODE');
    const name = escapeHtml(product.name || 'Product');
    const sku = escapeHtml(product.sku || '—');
    const price = typeof product.price === 'number' ? formatCurrency(product.price) : '—';
    printWindow.document.write(`<html><head><title>Barcode Label</title>
      <style>body{font-family:Arial,sans-serif;padding:16px;background:#fff;color:#000;}.label{width:320px;border:1px solid #111;border-radius:12px;padding:16px;margin:0 auto;}.title{font-size:18px;font-weight:700;margin-bottom:8px;}.meta{font-size:12px;color:#444;margin-bottom:10px;}.barcode{height:72px;border-radius:6px;border:1px solid #222;background:repeating-linear-gradient(to right,#111 0px,#111 2px,transparent 2px,transparent 4px,#111 4px,#111 5px,transparent 5px,transparent 8px);-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}.code{text-align:center;font-family:monospace;letter-spacing:.35em;font-size:14px;margin-top:8px;}.price{margin-top:12px;font-weight:700;}@media print{body{padding:0;}.label{border:1px solid #000;box-shadow:none;}}</style>
    </head><body onload="window.print(); window.close();">
      <div class="label"><div class="title">${name}</div><div class="meta">SKU: ${sku}</div><div class="barcode"></div><div class="code">${code}</div><div class="price">Price: ${price}</div></div>
    </body></html>`);
    printWindow.document.close();
  };

  const renderBarcodeVisual = (code?: string, compact = false) => {
    if (!code) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className={compact ? 'min-w-[112px]' : 'w-full'}>
        <div className={`${compact ? 'h-8' : 'h-12'} w-full rounded-md border border-border/70 bg-background`}
          style={{ backgroundImage: 'repeating-linear-gradient(to right, #111827 0px, #111827 2px, transparent 2px, transparent 4px, #111827 4px, #111827 5px, transparent 5px, transparent 8px)', opacity: 0.9 }} />
        <p className={`${compact ? 'mt-1 text-[10px]' : 'mt-2 text-xs'} font-mono tracking-[0.28em] text-foreground`}>{code}</p>
      </div>
    );
  };

  const productColumns: Column<Product>[] = [
    {
      key: 'name', header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} width={36} height={36} className="rounded-md object-cover flex-shrink-0" /> : <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>}
          <div><p className="font-medium text-sm text-foreground line-clamp-1">{p.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(p.price)}</p></div>
        </div>
      ),
    },
    { key: 'sku', header: 'SKU', render: (p) => <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{(p as any).sku || '—'}</code> },
    { key: 'barcode', header: 'Barcode', render: (p) => renderBarcodeVisual((p as any).barcode, true) },
    { key: 'stock', header: 'Stock', render: (p) => <Badge variant={p.stock > 10 ? 'success' : p.stock > 0 ? 'warning' : 'destructive'}>{p.stock} units</Badge> },
    {
      key: 'actions', header: '',
      render: (p) => (
        <div className="flex items-center gap-2">
          <Link href={`/products/${p._id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
          <Button variant="outline" size="icon-sm" title="Print barcode label" onClick={() => printBarcodeLabel({ name: p.name, sku: p.sku, barcode: p.barcode, price: p.price })}><Printer className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon-sm" title="Regenerate barcode" disabled={regeneratingId === p._id} onClick={() => handleRegenerate(p._id)}>
            <RefreshCw className={`h-3.5 w-3.5 ${regeneratingId === p._id ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="POS Billing & Barcode" description="Sell products at the counter, generate invoices with GST, and manage barcodes" />

      {/* Today's Stats */}
      {todayStats && (
        <div className="grid gap-4 mb-6 grid-cols-2 lg:grid-cols-5">
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Receipt className="h-3.5 w-3.5" />Today Sales</div>
            <p className="text-xl font-bold">{todayStats.totalOrders}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" />Revenue</div>
            <p className="text-xl font-bold">{formatCurrency(todayStats.totalRevenue)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Banknote className="h-3.5 w-3.5" />Cash</div>
            <p className="text-lg font-bold">{formatCurrency(todayStats.cashRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">{todayStats.cashOrders} orders</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CreditCard className="h-3.5 w-3.5" />Card</div>
            <p className="text-lg font-bold">{formatCurrency(todayStats.cardRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">{todayStats.cardOrders} orders</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><QrCode className="h-3.5 w-3.5" />UPI</div>
            <p className="text-lg font-bold">{formatCurrency(todayStats.upiRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">{todayStats.upiOrders} orders</p>
          </CardContent></Card>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {([
          { id: 'billing' as const, label: 'Counter Billing', icon: ShoppingCart },
          { id: 'history' as const, label: 'POS Orders', icon: FileText },
          { id: 'products' as const, label: 'Products & Barcodes', icon: Package },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${activeView === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* ==================== BILLING VIEW ==================== */}
      {activeView === 'billing' && (
        <>
          {/* Scanner */}
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="border-b bg-muted/30"><CardTitle>Scan / Search Product</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                {/* Camera view */}
                <div className="rounded-2xl border border-emerald-500/20 bg-slate-950 p-3 text-white shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-emerald-400/25 bg-black">
                    {scannerOpen ? (
                      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)] px-4 text-center">
                        <Camera className="mb-3 h-10 w-10 text-emerald-300" />
                        <p className="text-sm font-semibold">Camera scanner ready</p>
                        <p className="mt-1 max-w-xs text-xs text-slate-300">Use your mobile rear camera or a handheld USB/Bluetooth scanner.</p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-emerald-400" />
                      <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-emerald-400" />
                      <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-emerald-400" />
                      <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-emerald-300 shadow-[0_0_12px_2px_rgba(52,211,153,0.55)] animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300">Detected Code</p>
                    <p className="mt-1 font-mono text-sm tracking-[0.3em] text-white/90">{detectedCode || query || 'READY-TO-SCAN'}</p>
                  </div>
                </div>

                {/* Search and result */}
                <div className="space-y-4">
                  <Input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Scan barcode or type SKU / barcode number..." className="font-mono" autoFocus />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleLookup()} disabled={looking || !query.trim()}>
                      {looking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      <span className="ml-2">Lookup</span>
                    </Button>
                    <Button variant="outline" onClick={scannerOpen ? stopCamera : startCamera} disabled={!cameraSupported && !scannerOpen}>
                      {scannerOpen ? <X className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
                      <span className="ml-2">{scannerOpen ? 'Stop Camera' : 'Open Camera'}</span>
                    </Button>
                    {(lookupResult || lookupError || query) && (
                      <Button variant="ghost" size="icon-sm" onClick={() => { setLookupResult(null); setLookupError(''); setQuery(''); setDetectedCode(''); inputRef.current?.focus(); }}><X className="h-4 w-4" /></Button>
                    )}
                  </div>
                  {cameraError && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">{cameraError}</div>}
                  {lookupError && <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{lookupError}</div>}
                  {lookupResult && (
                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-start gap-3">
                        {lookupResult.images?.[0] ? <Image src={lookupResult.images[0]} alt={lookupResult.name} width={64} height={64} className="rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{lookupResult.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span>SKU: <code className="font-mono">{lookupResult.sku}</code></span>
                            <span>Stock: <Badge variant={lookupResult.stock > 0 ? 'success' : 'destructive'} className="ml-1">{lookupResult.stock} units</Badge></span>
                            <span className="font-semibold text-foreground">{formatCurrency(lookupResult.price)}</span>
                          </div>
                          <Button size="sm" className="mt-2" onClick={() => addToBilling(lookupResult)}>
                            <ShoppingCart className="mr-1 h-3.5 w-3.5" />Add to Bill
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill + Customer Info + Payment */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px] mb-6">
            {/* Bill items */}
            <Card>
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bill Items</CardTitle>
                    <CardDescription>{billingItems.length} items, {billingUnits} units</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearBilling} disabled={billingItems.length === 0}><Trash2 className="mr-2 h-4 w-4" />Clear</Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {billingItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                    Scan a product barcode to start billing. Stock will be deducted automatically when you confirm the sale.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {billingItems.map((item, idx) => (
                      <div key={item._id} className="flex items-center gap-3 rounded-lg border p-3">
                        <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                        {item.images?.[0] ? <Image src={item.images[0]} alt={item.name} width={40} height={40} className="rounded-md object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="icon-sm" onClick={() => updateBillingQty(item._id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button variant="outline" size="icon-sm" onClick={() => updateBillingQty(item._id, 1)}><Plus className="h-3 w-3" /></Button>
                          <Button variant="outline" size="icon-sm" className="ml-1" onClick={() => removeBillingItem(item._id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                        <span className="text-sm font-semibold min-w-[80px] text-right">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment panel */}
            <div className="space-y-4">
              {/* Customer (optional) */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Customer Details (Optional)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative"><User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input className="pl-8 h-9 text-sm" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
                  <div className="relative"><Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input className="pl-8 h-9 text-sm" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
                  <div className="relative"><Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input className="pl-8 h-9 text-sm" placeholder="Email (optional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /></div>
                </CardContent>
              </Card>

              {/* Discount */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Discount</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input type="number" min={0} className="h-9 text-sm flex-1" placeholder="Amount" value={posDiscount || ''} onChange={(e) => setPosDiscount(Number(e.target.value) || 0)} />
                    <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={posDiscountType} onChange={(e) => setPosDiscountType(e.target.value as 'fixed' | 'percentage')}>
                      <option value="fixed">Rs. Fixed</option>
                      <option value="percentage">% Percent</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Payment method */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Payment Method</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'cash' as const, label: 'Cash', icon: Banknote },
                      { value: 'card' as const, label: 'Card', icon: CreditCard },
                      { value: 'upi' as const, label: 'UPI', icon: QrCode },
                      { value: 'other' as const, label: 'Other', icon: IndianRupee },
                    ]).map((method) => (
                      <button key={method.value} type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${paymentMethod === method.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'}`}>
                        <method.icon className="h-4 w-4" />{method.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="text-green-600">-{formatCurrency(discountAmount)}</span></div>}
                  {enableGst && gstAmount > 0 && (
                    <>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">CGST ({gstRate / 2}%)</span><span>{formatCurrency(Math.round(gstAmount / 2))}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">SGST ({gstRate / 2}%)</span><span>{formatCurrency(Math.round(gstAmount / 2))}</span></div>
                      <div className="flex justify-between text-xs text-muted-foreground"><span>GST (inclusive)</span><span>{formatCurrency(gstAmount)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
                </CardContent>
              </Card>

              {/* Actions */}
              {lastOrder ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10 p-3 text-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">Sale Complete!</p>
                    <p className="text-xs text-green-600 dark:text-green-300">Invoice: {lastOrder.invoiceNumber}</p>
                  </div>
                  <Button className="w-full" onClick={() => printInvoice()}><Printer className="mr-2 h-4 w-4" />Print Invoice</Button>
                  <Button variant="outline" className="w-full" onClick={clearBilling}>New Sale</Button>
                </div>
              ) : (
                <Button className="w-full h-12 text-base" onClick={handleCreateOrder}
                  disabled={billingItems.length === 0 || creatingOrder}>
                  {creatingOrder ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  Confirm Sale{grandTotal > 0 ? ` — ${formatCurrency(grandTotal)}` : ''}
                </Button>
              )}

              {!billingInfo?.billing?.enableGst && (
                <p className="text-xs text-muted-foreground text-center">
                  GST is disabled. Go to Settings to enable Billing & GST.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==================== HISTORY VIEW ==================== */}
      {activeView === 'history' && (
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>POS Order History</CardTitle>
            <CardDescription>All counter/walk-in sales with invoice details</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Input placeholder="Search by invoice, order number, customer name..." value={posSearch} onChange={(e) => setPosSearch(e.target.value)} className="mb-4 max-w-md" />
            {posOrdersLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading orders...</div>
            ) : posOrders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No POS orders found.</div>
            ) : (
              <div className="space-y-3">
                {posOrders.map((order) => (
                  <div key={order._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{order.invoiceNumber || order.orderNumber}</span>
                        <Badge variant="success" className="text-[10px]">{order.posPaymentMethod?.toUpperCase() || 'CASH'}</Badge>
                        {order.gstAmount > 0 && <Badge variant="secondary" className="text-[10px]">GST: {formatCurrency(order.gstAmount)}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.walkInCustomerName && order.walkInCustomerName !== 'Walk-in Customer' ? order.walkInCustomerName : 'Walk-in'} — {new Date(order.createdAt).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length} item(s): {order.items?.map((i: any) => i.product?.name || 'Product').join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{formatCurrency(order.totalAmount)}</span>
                      <Button variant="outline" size="sm" onClick={() => {
                        printInvoice({
                          order,
                          billing: billingInfo?.billing || {},
                          gstAmount: order.gstAmount || 0,
                          gstRate: order.gstRate || 0,
                          invoiceNumber: order.invoiceNumber || order.orderNumber,
                        });
                      }}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Pagination currentPage={posPage} totalPages={posTotalPages} onPageChange={setPosPage} totalItems={posTotalItems} pageSize={15} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== PRODUCTS VIEW ==================== */}
      {activeView === 'products' && (
        <>
          <DataTable columns={productColumns} data={products} loading={loadingTable} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search products, SKU, or barcode..." rowKey={(p) => p._id} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />
        </>
      )}
    </div>
  );
}
