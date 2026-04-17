import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  orderNumber: string;
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
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string;
}

export function generateInvoicePDF(res: Response, data: InvoiceData) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Invoice-${data.orderNumber}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('AMOHA MOBILES', 50, 50);
  doc.fontSize(10).font('Helvetica').text('GST: GSTIN_PLACEHOLDER', 50, 75);
  doc.text('support@amohamobiles.com', 50, 88);

  // Invoice title
  doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').text(`#${data.orderNumber}`, 400, 72, { align: 'right' });
  doc.text(`Date: ${new Date(data.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 400, 85, { align: 'right' });

  // Separator
  doc.moveTo(50, 110).lineTo(545, 110).stroke('#e5e7eb');

  // Bill To / Ship To
  const y1 = 125;
  doc.fontSize(9).font('Helvetica-Bold').text('BILL TO:', 50, y1);
  doc.fontSize(9).font('Helvetica')
    .text(data.customerName, 50, y1 + 14)
    .text(data.customerEmail, 50, y1 + 26)
    .text(data.customerPhone, 50, y1 + 38);

  doc.fontSize(9).font('Helvetica-Bold').text('SHIP TO:', 300, y1);
  doc.fontSize(9).font('Helvetica')
    .text(data.shippingAddress.fullName, 300, y1 + 14)
    .text(data.shippingAddress.addressLine1, 300, y1 + 26)
    .text(`${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}`, 300, y1 + 38)
    .text(`Phone: ${data.shippingAddress.phone}`, 300, y1 + 50);

  // Table header
  const tableTop = y1 + 75;
  doc.moveTo(50, tableTop).lineTo(545, tableTop).stroke('#e5e7eb');

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('#', 50, tableTop + 8, { width: 30 });
  doc.text('Item', 80, tableTop + 8, { width: 250 });
  doc.text('Qty', 340, tableTop + 8, { width: 50, align: 'center' });
  doc.text('Price', 400, tableTop + 8, { width: 70, align: 'right' });
  doc.text('Total', 475, tableTop + 8, { width: 70, align: 'right' });

  doc.moveTo(50, tableTop + 24).lineTo(545, tableTop + 24).stroke('#e5e7eb');

  // Table rows
  let rowY = tableTop + 32;
  doc.font('Helvetica').fontSize(9);
  data.items.forEach((item, idx) => {
    doc.text(String(idx + 1), 50, rowY, { width: 30 });
    doc.text(item.name, 80, rowY, { width: 250 });
    doc.text(String(item.quantity), 340, rowY, { width: 50, align: 'center' });
    doc.text(formatINR(item.price), 400, rowY, { width: 70, align: 'right' });
    doc.text(formatINR(item.price * item.quantity), 475, rowY, { width: 70, align: 'right' });
    rowY += 20;
  });

  // Separator before totals
  doc.moveTo(350, rowY + 5).lineTo(545, rowY + 5).stroke('#e5e7eb');

  // Totals
  rowY += 14;
  doc.font('Helvetica').fontSize(9);
  doc.text('Subtotal:', 400, rowY, { align: 'left' });
  doc.text(formatINR(data.subtotal), 475, rowY, { width: 70, align: 'right' });
  rowY += 16;

  if (data.discount > 0) {
    doc.text(`Discount${data.couponCode ? ` (${data.couponCode})` : ''}:`, 400, rowY, { align: 'left' });
    doc.text(`-${formatINR(data.discount)}`, 475, rowY, { width: 70, align: 'right' });
    rowY += 16;
  }

  doc.text('Delivery:', 400, rowY, { align: 'left' });
  doc.text(data.deliveryCharge === 0 ? 'FREE' : formatINR(data.deliveryCharge), 475, rowY, { width: 70, align: 'right' });
  rowY += 16;

  doc.moveTo(400, rowY).lineTo(545, rowY).stroke('#374151');
  rowY += 8;
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Total:', 400, rowY, { align: 'left' });
  doc.text(formatINR(data.totalAmount), 475, rowY, { width: 70, align: 'right' });

  // Payment info
  rowY += 30;
  doc.font('Helvetica').fontSize(9);
  doc.text(`Payment: ${data.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'} — ${data.paymentStatus.toUpperCase()}`, 50, rowY);

  // Footer
  const footerY = 750;
  doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e5e7eb');
  doc.fontSize(8).font('Helvetica')
    .text('Thank you for shopping with Amoha Mobiles!', 50, footerY + 10, { align: 'center' })
    .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 22, { align: 'center' });

  doc.end();
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
