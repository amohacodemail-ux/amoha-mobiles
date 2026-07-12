import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  hsnCode?: string;
  gstRate?: number;
}

export interface InvoiceData {
  orderNumber: string;
  invoiceNumber?: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  codFee?: number;
  gstAmount?: number;
  gstRate?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string;
  // Business / billing settings
  businessName?: string;
  gstin?: string;
  panNumber?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  invoicePrefix?: string;
  termsOnInvoice?: string;
  footerNote?: string;
  hsnCode?: string;
}

export function generateInvoicePDF(res: Response, data: InvoiceData) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  const invoiceRef = data.invoiceNumber || data.orderNumber;
  res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceRef}.pdf`);
  doc.pipe(res);

  const businessName = data.businessName || 'AMOHA MOBILES';
  const footerNote = data.footerNote || 'Thank you for shopping with us!';

  // ── Header ──────────────────────────────────────────────
  const LEFT_COL_WIDTH = 250;
  const RIGHT_COL_WIDTH = 195;
  doc.fontSize(20).font('Helvetica-Bold').text(businessName.toUpperCase(), 50, 50);
  let headerY = 75;
  if (data.gstin) {
    doc.fontSize(9).font('Helvetica').text(`GSTIN: ${data.gstin}`, 50, headerY, { width: LEFT_COL_WIDTH });
    headerY = doc.y + 2;
  }
  if (data.panNumber) {
    doc.fontSize(9).font('Helvetica').text(`PAN: ${data.panNumber}`, 50, headerY, { width: LEFT_COL_WIDTH });
    headerY = doc.y + 2;
  }
  if (data.businessAddress) {
    doc.fontSize(9).font('Helvetica').text(data.businessAddress, 50, headerY, { width: LEFT_COL_WIDTH });
    headerY = doc.y + 2;
  }
  if (data.businessPhone) {
    doc.fontSize(9).font('Helvetica').text(`Phone: ${data.businessPhone}`, 50, headerY, { width: LEFT_COL_WIDTH });
    headerY = doc.y + 2;
  }
  if (data.businessEmail) {
    doc.fontSize(9).font('Helvetica').text(data.businessEmail, 50, headerY, { width: LEFT_COL_WIDTH });
    headerY = doc.y;
  }

  // Invoice title (right-aligned)
  const invoiceTitle = data.gstAmount && data.gstAmount > 0 ? 'TAX INVOICE' : 'INVOICE';
  doc.fontSize(16).font('Helvetica-Bold').text(invoiceTitle, 350, 50, { width: RIGHT_COL_WIDTH, align: 'right' });
  let rightY = doc.y + 6;
  doc.fontSize(9).font('Helvetica').text(`Invoice #: ${invoiceRef}`, 350, rightY, { width: RIGHT_COL_WIDTH, align: 'right' });
  rightY = doc.y + 2;
  doc.text(
    `Date: ${new Date(data.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    350, rightY, { width: RIGHT_COL_WIDTH, align: 'right' },
  );
  rightY = doc.y + 2;
  if (data.invoiceNumber && data.orderNumber && data.invoiceNumber !== data.orderNumber) {
    doc.text(`Order: ${data.orderNumber}`, 350, rightY, { width: RIGHT_COL_WIDTH, align: 'right' });
    rightY = doc.y;
  }

  // Separator — positioned dynamically below whichever header column is taller
  const sep1 = Math.max(headerY, rightY) + 10;
  doc.moveTo(50, sep1).lineTo(545, sep1).stroke('#e5e7eb');

  // ── Bill To / Ship To ───────────────────────────────────
  const y1 = sep1 + 12;
  const BILL_COL_WIDTH = 230;
  const SHIP_COL_WIDTH = 245;
  doc.fontSize(9).font('Helvetica-Bold').text('BILL TO:', 50, y1);
  let billY = doc.y + 3;
  doc.fontSize(9).font('Helvetica').text(data.customerName, 50, billY, { width: BILL_COL_WIDTH });
  billY = doc.y + 2;
  if (data.customerEmail) {
    doc.text(data.customerEmail, 50, billY, { width: BILL_COL_WIDTH });
    billY = doc.y + 2;
  }
  if (data.customerPhone) {
    doc.text(data.customerPhone, 50, billY, { width: BILL_COL_WIDTH });
    billY = doc.y;
  }

  doc.fontSize(9).font('Helvetica-Bold').text('SHIP TO / SOLD TO:', 300, y1);
  let shipY = doc.y + 3;
  const addr = data.shippingAddress;
  doc.fontSize(9).font('Helvetica').text(addr.fullName, 300, shipY, { width: SHIP_COL_WIDTH });
  shipY = doc.y + 2;
  doc.text(addr.addressLine1, 300, shipY, { width: SHIP_COL_WIDTH });
  shipY = doc.y + 2;
  if (addr.addressLine2) {
    doc.text(addr.addressLine2, 300, shipY, { width: SHIP_COL_WIDTH });
    shipY = doc.y + 2;
  }
  let addrLine = `${addr.city}`;
  if (addr.state) addrLine += `, ${addr.state}`;
  if (addr.pincode) addrLine += ` - ${addr.pincode}`;
  doc.text(addrLine, 300, shipY, { width: SHIP_COL_WIDTH });
  shipY = doc.y + 2;
  doc.text(`Phone: ${addr.phone || '—'}`, 300, shipY, { width: SHIP_COL_WIDTH });
  shipY = doc.y;

  // ── Items table ──────────────────────────────────────────
  const tableTop = Math.max(billY, shipY) + 20;
  doc.moveTo(50, tableTop).lineTo(545, tableTop).stroke('#d1d5db');
  doc.rect(50, tableTop, 495, 20).fill('#f9fafb').stroke('#e5e7eb');
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
  doc.text('#', 52, tableTop + 6, { width: 20 });
  doc.text('Item', 74, tableTop + 6, { width: 220 });
  doc.text('HSN', 296, tableTop + 6, { width: 50, align: 'center' });
  doc.text('Qty', 348, tableTop + 6, { width: 35, align: 'center' });
  doc.text('Rate', 385, tableTop + 6, { width: 70, align: 'right' });
  doc.text('Amount', 457, tableTop + 6, { width: 88, align: 'right' });

  doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke('#e5e7eb');

  let rowY = tableTop + 28;
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  data.items.forEach((item, idx) => {
    const lineTotal = item.price * item.quantity;
    doc.text(String(idx + 1), 52, rowY, { width: 20 });
    doc.text(item.name, 74, rowY, { width: 220 });
    doc.text(item.hsnCode || data.hsnCode || '—', 296, rowY, { width: 50, align: 'center' });
    doc.text(String(item.quantity), 348, rowY, { width: 35, align: 'center' });
    doc.text(formatINR(item.price), 385, rowY, { width: 70, align: 'right' });
    doc.text(formatINR(lineTotal), 457, rowY, { width: 88, align: 'right' });
    rowY += 18;
    if (rowY > 700) {
      doc.addPage();
      rowY = 50;
    }
  });

  // Separator before totals
  doc.moveTo(350, rowY + 4).lineTo(545, rowY + 4).stroke('#d1d5db');
  rowY += 14;

  const addRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9).fillColor('#111827');
    doc.text(label, 360, rowY, { width: 95 });
    doc.text(value, 457, rowY, { width: 88, align: 'right' });
    rowY += bold ? 18 : 15;
  };

  addRow('Subtotal:', formatINR(data.subtotal));

  if (data.discount > 0) {
    addRow(`Discount${data.couponCode ? ` (${data.couponCode})` : ''}:`, `-${formatINR(data.discount)}`);
  }

  if (data.deliveryCharge !== undefined) {
    addRow('Delivery:', data.deliveryCharge === 0 ? 'FREE' : formatINR(data.deliveryCharge));
  }

  if (data.codFee && data.codFee > 0) {
    addRow('COD Fee:', formatINR(data.codFee));
  }

  if (data.gstAmount && data.gstAmount > 0) {
    const halfGst = Math.round(data.gstAmount / 2);
    const rate = data.gstRate || 18;
    addRow(`CGST (${rate / 2}%)  [inclusive]:`, formatINR(halfGst));
    addRow(`SGST (${rate / 2}%)  [inclusive]:`, formatINR(data.gstAmount - halfGst));
  }

  doc.moveTo(350, rowY).lineTo(545, rowY).stroke('#374151');
  rowY += 6;
  addRow('Grand Total:', formatINR(data.totalAmount), true);

  // ── Payment Info ────────────────────────────────────────
  rowY += 10;
  const pmLabel = (() => {
    const pm = (data.paymentMethod || '').toLowerCase();
    if (pm === 'cod') return 'Cash on Delivery';
    if (pm === 'razorpay') return 'Online Payment (Razorpay)';
    if (['cash', 'card', 'upi'].includes(pm)) return pm.toUpperCase();
    return data.paymentMethod;
  })();
  doc.font('Helvetica').fontSize(9).fillColor('#374151');
  doc.text(`Payment Mode: ${pmLabel}   |   Payment Status: ${(data.paymentStatus || '').toUpperCase()}`, 50, rowY);

  // ── GST Note ───────────────────────────────────────────
  if (data.gstAmount && data.gstAmount > 0) {
    rowY += 14;
    doc.fontSize(8).fillColor('#6b7280')
      .text('* Prices are inclusive of GST. CGST & SGST have been extracted and shown above for compliance.', 50, rowY);
  }

  // ── Terms ──────────────────────────────────────────────
  if (data.termsOnInvoice) {
    rowY += 20;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151').text('Terms & Conditions:', 50, rowY);
    rowY += 12;
    doc.font('Helvetica').fillColor('#6b7280').text(data.termsOnInvoice, 50, rowY, { width: 495 });
    rowY = doc.y + 4;
  }

  // ── Footer ─────────────────────────────────────────────
  // If content has pushed past the footer zone, add a new page
  const footerY = doc.page.height - 70;
  if (rowY > footerY - 20) {
    doc.addPage();
  }
  doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e5e7eb');
  doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
    .text(footerNote, 50, footerY + 8, { align: 'center', width: 495 })
    .text('This is a computer-generated invoice and does not require a physical signature.', 50, footerY + 20, { align: 'center', width: 495 });

  // Reset fill color to avoid state leak across PDFs
  doc.fillColor('#000000');
  doc.end();
}

function formatINR(amount: number): string {
  return `\u20B9${Number(amount || 0).toLocaleString('en-IN')}`;
}
