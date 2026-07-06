'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search, Package, RefreshCw, X, CheckCircle, AlertCircle, Camera,
  ScanLine, Printer, ShoppingCart, Trash2, Plus, Minus,
  CreditCard, Banknote, QrCode, IndianRupee, FileText, Receipt,
  TrendingUp, User, Phone, Mail,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { barcodeService, BarcodeProduct } from '@/services/barcode.service';
import { BarcodeVisual } from '@/components/shared/barcode-visual';
import { posService, type PosBillingInfo, type PosTodayStats, type PosOrderResult } from '@/services/pos.service';
import { orderService } from '@/services/order.service';
import { productService } from '@/services/product.service';
import { formatCurrency } from '@/lib/utils';
import { resolvePrintFormat } from '@/lib/barcode-utils';
import type { Product } from '@/types';

const LIMIT = 15;
type BillingItem = BarcodeProduct & { quantity: number; itemGstRate: number };
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
  // Local GST toggle: null = use settings default
  const [localGstEnabled, setLocalGstEnabled] = useState<boolean | null>(null);
  // Quick GST rate applied to all items at once (null = keep per-item rates)
  const [quickGstRate, setQuickGstRate] = useState<number | null>(null);

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
  const debouncedPosSearch = useDebouncedValue(posSearch, 350);

  // View toggle
  const [activeView, setActiveView] = useState<ActiveView>('billing');

  // Print label sheet settings
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printCols, setPrintCols] = useState(3);
  const [printRows, setPrintRows] = useState(8);
  const [labelUnit, setLabelUnit] = useState<'mm' | 'cm'>('mm');
  const [labelW, setLabelW] = useState(62);   // mm
  const [labelH, setLabelH] = useState(34);   // mm

  // Delete order state
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleteInvoiceNumber, setDeleteInvoiceNumber] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const { canDelete } = useModulePermissions(MODULES.BARCODE_POS);

  // Track whether user has explicitly toggled GST (so billingInfo load won't override it)
  const userToggledGst = useRef(false);

  // Load billing info + today stats on mount
  useEffect(() => {
    posService.getBillingInfo().then((info) => {
      setBillingInfo(info);
      // Only apply the settings default if user has NOT manually toggled
      if (!userToggledGst.current) {
        setLocalGstEnabled(null); // let derived value pick up billingInfo.enableGst
      }
    }).catch(() => {});
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
      const res = await posService.getOrders({ page: posPage, limit: 15, search: debouncedPosSearch || undefined });
      setPosOrders(Array.isArray(res.orders) ? res.orders : []);
      setPosTotalPages(res.totalPages);
      setPosTotalItems(res.totalOrders);
    } catch {
      toast.error('Failed to load POS orders');
      setPosOrders([]);
    } finally {
      setPosOrdersLoading(false);
    }
  }, [posPage, debouncedPosSearch]);

  useEffect(() => {
    if (activeView === 'history') loadPosOrders();
  }, [activeView, loadPosOrders]);
  useEffect(() => { setPosPage(1); }, [debouncedPosSearch]);

  // Delete handlers
  const openDelete = (order: any) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete orders');
      return;
    }
    setDeleteOrderId(order._id || order.id);
    setDeleteInvoiceNumber(order.invoiceNumber || order.orderNumber || 'this order');
  };

  const handleDelete = async () => {
    if (!deleteOrderId) return;
    setDeleting(true);
    try {
      await orderService.deleteOrder(deleteOrderId);
      toast.success('Order deleted successfully');
      setDeleteOrderId(null);
      setPosOrders((prev) => prev.filter((o) => (o._id || o.id) !== deleteOrderId));
      setPosTotalItems((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

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
        setCameraError('Camera preview is live. Auto-scan requires Chrome on Android or a USB/Bluetooth scanner — type the barcode in the input box above and press Lookup.');
        return;
      }
      const detector = new BarcodeDetectorClass({
        formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e', 'code_39', 'code_93', 'codabar', 'itf', 'qr_code'],
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

  // Keep a ref to billingInfo so addToBilling always gets the latest value
  const billingInfoRef = useRef<PosBillingInfo | null>(null);
  useEffect(() => { billingInfoRef.current = billingInfo; }, [billingInfo]);

  const addToBilling = (product: BarcodeProduct) => {
    const defaultRate = billingInfoRef.current?.billing?.gstRate ?? 18;
    type ToastMsg = { type: 'error' | 'warn'; text: string };
    const toastMsg: { current: ToastMsg | null } = { current: null };
    setBillingItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= existing.stock) {
          toastMsg.current = { type: 'error', text: `Only ${existing.stock} units available for "${product.name}"` };
          return prev;
        }
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      if (product.stock <= 0) {
        toastMsg.current = { type: 'warn', text: `"${product.name}" shows 0 stock — verify physical stock before billing` };
      }
      return [...prev, { ...product, quantity: 1, itemGstRate: defaultRate }];
    });
    // Show toasts after setState to avoid calling side-effects inside updater
    if (toastMsg.current?.type === 'error') toast.error(toastMsg.current.text);
    else if (toastMsg.current?.type === 'warn') toast(toastMsg.current.text, { icon: '⚠️' });
  };

  const updateItemGstRate = (productId: string, rate: number) => {
    setBillingItems((prev) =>
      prev.map((item) => item._id === productId ? { ...item, itemGstRate: rate } : item),
    );
  };

  const updateBillingQty = (productId: string, delta: number) => {
    let stockToast: string | null = null;
    setBillingItems((prev) =>
      prev.map((item) => {
        if (item._id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          stockToast = `Only ${item.stock} units available`;
          return item;
        }
        return { ...item, quantity: Math.max(0, newQty) };
      }).filter((item) => item.quantity > 0),
    );
    if (stockToast) toast.error(stockToast);
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
    setLocalGstEnabled(null);
    setQuickGstRate(null);
  };

  const applyQuickGstRate = (rate: number) => {
    setQuickGstRate(rate);
    setBillingItems((prev) => prev.map((item) => ({ ...item, itemGstRate: rate })));
  };

  // Derived values
  const enableGst = localGstEnabled ?? (billingInfo?.billing?.enableGst ?? false);
  const defaultGstRate = billingInfo?.billing?.gstRate ?? 18;
  const taxSlabs = billingInfo?.billing?.taxSlabs?.length
    ? billingInfo.billing.taxSlabs
    : [
        { name: 'No Tax (0%)', rate: 0 },
        { name: 'GST 5%', rate: 5 },
        { name: 'GST 12%', rate: 12 },
        { name: 'GST 18%', rate: 18 },
        { name: 'GST 28%', rate: 28 },
      ];

  // Calculations
  const subtotal = billingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const billingUnits = billingItems.reduce((sum, item) => sum + item.quantity, 0);
  let discountAmount = 0;
  if (posDiscount > 0) {
    discountAmount = posDiscountType === 'percentage' ? Math.round((subtotal * posDiscount) / 100) : posDiscount;
    if (discountAmount > subtotal) discountAmount = subtotal;
  }
  const afterDiscount = subtotal - discountAmount;
  const discountRatio = subtotal > 0 ? afterDiscount / subtotal : 1;

  // Per-item GST grouped by rate
  const gstBreakdown = new Map<number, number>(); // rate -> gstAmount
  if (enableGst) {
    for (const item of billingItems) {
      const rate = item.itemGstRate;
      if (rate > 0) {
        const itemAfterDiscount = item.price * item.quantity * discountRatio;
        const gstAmt = Math.round(itemAfterDiscount - (itemAfterDiscount * 100) / (100 + rate));
        gstBreakdown.set(rate, (gstBreakdown.get(rate) ?? 0) + gstAmt);
      }
    }
  }
  const totalGstAmount = Array.from(gstBreakdown.values()).reduce((s, v) => s + v, 0);
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
          gstRate: item.itemGstRate,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        paymentMethod,
        posDiscount: posDiscount || undefined,
        posDiscountType: posDiscount > 0 ? posDiscountType : undefined,
        gstEnabled: enableGst,
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

  const printInvoice = (orderData?: PosOrderResult | any) => {
    const data = orderData || lastOrder;
    if (!data) return;
    // When called from history tab, the raw order object is passed directly (no .order wrapper)
    const order = data.order ?? data;
    const billing = data.billing || billingInfo?.billing || {};
    const printWindow = window.open('', '_blank', 'width=500,height=800');
    if (!printWindow) return;

    const itemsHtml = (order.items || []).map((item: any) => {
      const name = escapeHtml(item.productName || item.product?.name || item.name || 'Product');
      const qty = item.quantity;
      const price = item.price ?? item.unitPrice ?? 0;
      const total = item.total ?? price * qty;
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

    const resolvedGstAmount = data.gstAmount ?? order.gstAmount ?? 0;
    const resolvedGstRate = data.gstRate ?? order.gstRate ?? 0;
    const cgst = Math.floor(resolvedGstAmount / 2);
    const sgst = resolvedGstAmount - cgst;
    const gstSection = resolvedGstRate > 0 ? `
      <tr><td colspan="3" style="text-align:right;padding:3px 4px;font-size:12px;color:#666;">CGST (${resolvedGstRate / 2}%)</td><td style="text-align:right;padding:3px 4px;font-size:12px;">Rs.${cgst.toLocaleString('en-IN')}</td></tr>
      <tr><td colspan="3" style="text-align:right;padding:3px 4px;font-size:12px;color:#666;">SGST (${resolvedGstRate / 2}%)</td><td style="text-align:right;padding:3px 4px;font-size:12px;">Rs.${sgst.toLocaleString('en-IN')}</td></tr>
    ` : '';

    const orderDiscount = order.discount ?? order.posDiscount ?? 0;
    const discountRow = orderDiscount > 0 ? `<tr><td colspan="3" style="text-align:right;padding:3px 4px;font-size:12px;color:#666;">Discount</td><td style="text-align:right;padding:3px 4px;font-size:12px;color:green;">-Rs.${orderDiscount.toLocaleString('en-IN')}</td></tr>` : '';

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
          <tr><td colspan="3" style="text-align:right;padding:6px 4px;font-size:12px;color:#666;">Subtotal</td><td style="text-align:right;padding:6px 4px;">Rs.${(order.subtotal ?? order.total ?? 0).toLocaleString('en-IN')}</td></tr>
          ${discountRow}
          ${gstSection}
          <tr class="total-row"><td colspan="3" style="text-align:right;">Grand Total</td><td style="text-align:right;">Rs.${(order.totalAmount ?? order.total ?? 0).toLocaleString('en-IN')}</td></tr>
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

  const printBarcodeLabel = (product: { name: string; sku?: string; barcode?: string; price?: number; barcodeType?: string }) => {
    const printWindow = window.open('', '_blank', 'width=460,height=600');
    if (!printWindow) return;
    const rawCode = product.barcode || product.sku || 'NO-CODE';
    const name = escapeHtml(product.name || 'Product');
    const sku = escapeHtml(product.sku || '\u2014');
    const priceStr = typeof product.price === 'number' ? `\u20B9${product.price.toLocaleString('en-IN')}` : '\u2014';
    const codeJson = JSON.stringify(rawCode);
    const fmt = resolvePrintFormat(rawCode, product.barcodeType);
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Barcode Label</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:16px;background:#fff;color:#000}.label{width:340px;border:2px solid #111;border-radius:10px;padding:16px;margin:0 auto}.title{font-size:16px;font-weight:700;margin-bottom:6px}.meta{font-size:11px;color:#555;margin-bottom:10px}.bc{width:100%;overflow:hidden;text-align:center}.bc svg{width:100%!important;max-height:90px!important}.price{margin-top:10px;font-size:16px;font-weight:700}@media print{body{padding:4px}.label{border:2px solid #000}}</style></head><body><div class="label"><div class="title">${name}</div><div class="meta">SKU: ${sku}</div><div class="bc"><svg id="bc"></svg></div><div class="price">Price: ${priceStr}</div></div><script>window.onload=function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';s.onload=function(){try{JsBarcode('#bc',${codeJson},{format:'${fmt}',lineColor:'#000',width:2.2,height:80,displayValue:true,fontSize:14,margin:8,background:'#fff'});}catch(e){try{JsBarcode('#bc',${codeJson},{format:'CODE128',lineColor:'#000',width:2,height:80,displayValue:true,fontSize:14,margin:8,background:'#fff'});}catch(e2){}}window.print();setTimeout(function(){window.close();},800);};document.head.appendChild(s);};<\/script></body></html>`);
    printWindow.document.close();
  };

  /**
   * Convert label dimension to mm regardless of unit selected by user.
   */
  const toMm = (val: number, unit: 'mm' | 'cm') => unit === 'cm' ? val * 10 : val;

  const printLabelSheet = (
    prods: Product[],
    opts?: { cols: number; rows: number; wMm: number; hMm: number }
  ) => {
    if (!prods.length) return;
    const cols = opts?.cols ?? 3;
    const rows = opts?.rows ?? 8;
    const wMm = opts?.wMm ?? 62;
    const hMm = opts?.hMm ?? 34;
    // Page gutter = 8 mm; gap between labels = 2 mm
    const gap = 2;
    const bcH = Math.max(10, hMm - 16); // height for barcode SVG inside label
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;
    const entries: Array<{ id: string; code: string; fmt: string }> = [];
    // Build individual label HTML strings in a clean array (no fragile regex parsing)
    const labelItems: string[] = [];
    prods.forEach((p, idx) => {
      const rawCode = (p as any).barcode || (p as any).sku || 'NO-CODE';
      const fmt = resolvePrintFormat(rawCode, (p as any).barcodeType);
      const id = `bc${idx}`;
      entries.push({ id, code: rawCode, fmt });
      const safeName = escapeHtml((p.name || 'Product').slice(0, 42));
      const safeSku = escapeHtml((p as any).sku || '\u2014');
      const priceLabel = typeof p.price === 'number' ? `&#8377;${p.price.toLocaleString('en-IN')}` : '\u2014';
      labelItems.push(`<div class="lbl"><div class="lname">${safeName}</div><div class="lsku">SKU: ${safeSku}</div><svg id="${id}" class="lbc"></svg><div class="lprice">${priceLabel}</div></div>`);
    });
    const entriesJson = JSON.stringify(entries);
    const colsStyle = `repeat(${cols},${wMm}mm)`;
    const labelMinH = `${hMm}mm`;
    const bcMaxH = `${bcH}mm`;
    // Group labels into pages of (rows * cols)
    const perPage = rows * cols;
    const chunks: string[] = [];
    for (let i = 0; i < labelItems.length; i += perPage) {
      chunks.push(labelItems.slice(i, i + perPage).join(''));
    }
    const sheetsHtml = chunks.map((c, i) => `<div class="sheet${i > 0 ? ' page-break' : ''}">${c}</div>`).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Barcode Label Sheet</title><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:8mm;background:#fff;color:#000}.sheet{display:grid;grid-template-columns:${colsStyle};gap:${gap}mm}.page-break{page-break-before:always;margin-top:8mm}.lbl{border:1px dashed #bbb;padding:1.5mm 2mm;display:flex;flex-direction:column;align-items:center;min-height:${labelMinH};overflow:hidden}.lname{font-size:6.5pt;font-weight:700;text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:0.5mm}.lsku{font-size:5.5pt;color:#666;margin-bottom:0.5mm}.lbc{width:100%!important;max-height:${bcMaxH};display:block}.lprice{font-size:7pt;font-weight:700;margin-top:0.5mm}@media print{body{padding:5mm}.page-break{margin-top:0}.lbl{border:1px dashed #ccc}}</style></head><body>${sheetsHtml}<script>var E=${entriesJson};window.onload=function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';s.onload=function(){E.forEach(function(e){var el=document.getElementById(e.id);if(!el)return;try{JsBarcode(el,e.code,{format:e.fmt,lineColor:'#000',width:1,height:${Math.round(bcH * 2.83)},displayValue:true,fontSize:6,margin:1,background:'#fff'});}catch(ex){try{JsBarcode(el,e.code,{format:'CODE128',lineColor:'#000',width:1,height:${Math.round(bcH * 2.83)},displayValue:true,fontSize:6,margin:1,background:'#fff'});}catch(ex2){}}});window.print();setTimeout(function(){window.close();},800);};document.head.appendChild(s);};<\/script></body></html>`);
    printWindow.document.close();
  };

  const renderBarcodeVisual = (code?: string, compact = false, type?: string) => {
    return <BarcodeVisual code={code} compact={compact} type={(type as any) || 'CODE128'} />;
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
    { key: 'barcode', header: 'Barcode', render: (p) => renderBarcodeVisual((p as any).barcode, true, (p as any).barcodeType) },
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
                          {enableGst && (
                            <select
                              className="mt-1 h-6 rounded border border-input bg-background px-1 text-xs text-muted-foreground"
                              value={item.itemGstRate}
                              onChange={(e) => updateItemGstRate(item._id, Number(e.target.value))}
                              title="GST rate for this item"
                            >
                              {taxSlabs.map((slab) => (
                                <option key={slab.rate} value={slab.rate}>{slab.name || `${slab.rate}%`}</option>
                              ))}
                            </select>
                          )}
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

              {/* GST Toggle + Quick Slab Selector */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  {/* Toggle row */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">GST (Tax)</p>
                        {!enableGst && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Default: {defaultGstRate}%</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{enableGst ? 'Tax applied — change rate via dropdown' : 'Toggle on or pick a rate below'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        userToggledGst.current = true;
                        const turningOn = !enableGst;
                        setLocalGstEnabled(turningOn);
                        if (turningOn) {
                          // Auto-apply default rate to all items when enabling GST
                          applyQuickGstRate(defaultGstRate);
                        } else {
                          setQuickGstRate(null);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enableGst ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enableGst ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Tax rate dropdown — always visible */}
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Tax Rate</label>
                    <select
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      value={quickGstRate ?? defaultGstRate}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        userToggledGst.current = true;
                        if (rate === 0) {
                          setLocalGstEnabled(false);
                          setQuickGstRate(null);
                        } else {
                          setLocalGstEnabled(true);
                          applyQuickGstRate(rate);
                        }
                      }}
                    >
                      {taxSlabs.map((slab) => (
                        <option key={slab.rate} value={slab.rate}>
                          {slab.rate === 0 ? 'No Tax (0%)' : `${slab.name || `GST ${slab.rate}%`} — ${slab.rate}%`}{slab.rate === defaultGstRate ? ' ★ default' : ''}
                        </option>
                      ))}
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
                  {enableGst && Array.from(gstBreakdown.entries()).map(([rate, amt]) => {
                    const cgst = Math.floor(amt / 2);
                    const sgst = amt - cgst;
                    return (
                      <React.Fragment key={rate}>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">CGST ({rate / 2}%)</span><span>{formatCurrency(cgst)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">SGST ({rate / 2}%)</span><span>{formatCurrency(sgst)}</span></div>
                      </React.Fragment>
                    );
                  })}
                  {enableGst && totalGstAmount > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground"><span>GST (inclusive)</span><span>{formatCurrency(totalGstAmount)}</span></div>
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

              {!enableGst && (
                <p className="text-xs text-muted-foreground text-center">
                  GST is off. Toggle above to enable tax on this sale.
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
                        {order.items?.length ?? 0} item(s): {order.items?.map((i: any) => i.productName || i.product?.name || 'Product').join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{formatCurrency(order.total ?? order.totalAmount ?? 0)}</span>
                      <Button variant="outline" size="sm" onClick={() => {
                        printInvoice({
                          order,
                          billing: billingInfo?.billing || {},
                          gstAmount: order.gstAmount || 0,
                          gstRate: order.gstRate || 0,
                          invoiceNumber: order.invoiceNumber || order.orderNumber,
                        });
                      }}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                      {canDelete && (
                        <Button variant="outline" size="sm" className="hover:border-destructive hover:text-destructive" onClick={() => openDelete(order)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
          <div className="flex justify-end mb-3">
            <Button variant="outline" onClick={() => setPrintDialogOpen(true)} disabled={products.length === 0}>
              <Printer className="mr-2 h-4 w-4" />Print Label Sheet
            </Button>
          </div>

          {/* ── Print Settings Dialog ── */}
          {printDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPrintDialogOpen(false)}>
              <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold">Print Label Sheet Settings</h2>
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setPrintDialogOpen(false)}><X className="h-4 w-4" /></button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Columns</label>
                    <input
                      type="number" min={1} max={10} value={printCols}
                      onChange={(e) => setPrintCols(Math.max(1, Math.min(10, Number(e.target.value))))}
                      className="w-full h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rows per Page</label>
                    <input
                      type="number" min={1} max={30} value={printRows}
                      onChange={(e) => setPrintRows(Math.max(1, Math.min(30, Number(e.target.value))))}
                      className="w-full h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Unit toggle */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-muted-foreground">Label size unit:</span>
                  <button
                    onClick={() => {
                      if (labelUnit === 'cm') {
                        setLabelW(Math.round(labelW * 10));
                        setLabelH(Math.round(labelH * 10));
                        setLabelUnit('mm');
                      } else {
                        setLabelW(parseFloat((labelW / 10).toFixed(1)));
                        setLabelH(parseFloat((labelH / 10).toFixed(1)));
                        setLabelUnit('cm');
                      }
                    }}
                    className="px-3 py-1 rounded-full border border-input text-xs font-semibold transition-colors hover:bg-secondary"
                  >{labelUnit === 'mm' ? 'mm → cm' : 'cm → mm'}</button>
                </div>

                {/* Label dimensions */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Label Width ({labelUnit})</label>
                    <input
                      type="number" min={10} max={200} step={labelUnit === 'mm' ? 1 : 0.1} value={labelW}
                      onChange={(e) => setLabelW(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Label Height ({labelUnit})</label>
                    <input
                      type="number" min={10} max={200} step={labelUnit === 'mm' ? 1 : 0.1} value={labelH}
                      onChange={(e) => setLabelH(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-muted-foreground mb-5">
                  {printCols} columns × {printRows} rows = {printCols * printRows} labels/page &nbsp;·&nbsp;
                  Label {labelUnit === 'mm' ? `${labelW}×${labelH} mm` : `${labelW}×${labelH} cm`}
                  &nbsp;({Math.ceil(products.length / (printCols * printRows))} page{Math.ceil(products.length / (printCols * printRows)) !== 1 ? 's' : ''} for {products.length} products)
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={() => {
                    setPrintDialogOpen(false);
                    printLabelSheet(products, {
                      cols: printCols,
                      rows: printRows,
                      wMm: toMm(labelW, labelUnit),
                      hMm: toMm(labelH, labelUnit),
                    });
                  }}>
                    <Printer className="mr-2 h-4 w-4" />Print
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DataTable columns={productColumns} data={products} loading={loadingTable} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search products, SKU, or barcode..." rowKey={(p) => p._id} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />
        </>
      )}

      <ConfirmModal
        open={!!deleteOrderId}
        onClose={() => setDeleteOrderId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete POS Order?"
        description={`Are you sure you want to delete order "${deleteInvoiceNumber}"? This action cannot be undone.`}
        confirmLabel="Delete Order"
      />
    </div>
  );
}
