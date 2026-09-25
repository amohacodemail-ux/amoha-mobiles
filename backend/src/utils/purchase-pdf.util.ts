import PDFDocument from 'pdfkit';
import { Response } from 'express';

function formatINR(amount: number): string {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function generateRfqPDF(res: Response, rfq: any, options?: { generatedByEmail?: string }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=RFQ-${rfq.rfqNumber}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('AMOHA MOBILES', 50, 50);
  const senderEmail = options?.generatedByEmail || 'purchase@amohamobiles.com';
  doc.fontSize(9).font('Helvetica').text(`Email: ${senderEmail}`, 50, 75);

  doc.fontSize(16).font('Helvetica-Bold').text('REQUEST FOR QUOTATION', 300, 50, { width: 245, align: 'right' });
  doc.fontSize(9).font('Helvetica').text(`RFQ #: ${rfq.rfqNumber}`, 300, 75, { width: 245, align: 'right' });
  const dateStr = new Date(rfq.createdAt).toLocaleDateString('en-IN');
  doc.text(`Date: ${dateStr}`, 300, 87, { width: 245, align: 'right' });
  doc.text(`Status: ${(rfq.status || '').toUpperCase()}`, 300, 99, { width: 245, align: 'right' });

  doc.moveTo(50, 120).lineTo(545, 120).stroke('#e5e7eb');

  // Supplier Details
  doc.fontSize(10).font('Helvetica-Bold').text('SUPPLIER DETAILS:', 50, 135);
  doc.fontSize(9).font('Helvetica');
  let supY = 150;
  const sup = rfq.supplier || {};
  doc.text(`Name: ${sup.name || sup.companyName || 'N/A'}`, 50, supY);
  supY += 12;
  if (sup.email) { doc.text(`Email: ${sup.email}`, 50, supY); supY += 12; }
  if (sup.phone) { doc.text(`Phone: ${sup.phone}`, 50, supY); supY += 12; }

  // Items Table
  const tableTop = Math.max(supY, 150) + 20;
  doc.moveTo(50, tableTop).lineTo(545, tableTop).stroke('#d1d5db');
  doc.rect(50, tableTop, 495, 20).fill('#f9fafb').stroke('#e5e7eb');
  
  // Parse quote if available
  let parsedQuote: any = null;
  if (rfq.supplierQuote) {
    try {
      parsedQuote = typeof rfq.supplierQuote === 'string' ? JSON.parse(rfq.supplierQuote) : rfq.supplierQuote;
    } catch(e) {}
  }
  const hasQuote = !!parsedQuote && !!parsedQuote.itemQuotes && parsedQuote.itemQuotes.length > 0;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
  doc.text('Product', 60, tableTop + 6, { width: 200 });
  doc.text('SKU', 270, tableTop + 6, { width: 80 });
  doc.text('Qty', 360, tableTop + 6, { width: 40, align: 'center' });
  if (hasQuote) {
    doc.text('Unit Price', 410, tableTop + 6, { width: 60, align: 'right' });
    doc.text('Line Total', 480, tableTop + 6, { width: 60, align: 'right' });
  } else {
    doc.text('Est. Price', 410, tableTop + 6, { width: 60, align: 'right' });
  }

  doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke('#e5e7eb');

  let rowY = tableTop + 28;
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  
  (rfq.items || []).forEach((item: any) => {
    doc.text(item.name || 'Unknown Product', 60, rowY, { width: 200 });
    doc.text(item.sku || '-', 270, rowY, { width: 80 });
    doc.text(String(item.quantity || 0), 360, rowY, { width: 40, align: 'center' });
    
    if (hasQuote) {
      const quoteItem = parsedQuote.itemQuotes.find((q:any) => q.productId === item.productId || q.name === item.name);
      if (quoteItem) {
        doc.text(formatINR(quoteItem.unitPrice), 410, rowY, { width: 60, align: 'right' });
        doc.text(formatINR(quoteItem.lineTotal), 480, rowY, { width: 60, align: 'right' });
      } else {
        doc.text('-', 410, rowY, { width: 60, align: 'right' });
        doc.text('-', 480, rowY, { width: 60, align: 'right' });
      }
    } else {
      const estPrice = item.unitPrice ? formatINR(item.unitPrice) : '-';
      doc.text(estPrice, 410, rowY, { width: 60, align: 'right' });
    }
    
    rowY += 18;
    if (rowY > 700) { doc.addPage(); rowY = 50; }
  });

  doc.moveTo(50, rowY + 5).lineTo(545, rowY + 5).stroke('#d1d5db');
  rowY += 15;

  if (hasQuote && parsedQuote.quotedPrice) {
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Grand Total:', 410, rowY, { width: 60, align: 'right' });
    doc.text(formatINR(parsedQuote.quotedPrice), 480, rowY, { width: 60, align: 'right' });
    rowY += 20;
    
    doc.font('Helvetica').fontSize(9);
    if (parsedQuote.deliveryDate) {
      doc.text(`Delivery Date: ${parsedQuote.deliveryDate}`, 50, rowY);
      rowY += 12;
    }
    if (parsedQuote.paymentTerms) {
      doc.text(`Payment Terms: ${parsedQuote.paymentTerms}`, 50, rowY);
      rowY += 12;
    }
  } else {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#6b7280');
    doc.text('Supplier quotation pending/not provided.', 50, rowY);
  }

  // Footer
  const footerY = doc.page.height - 70;
  doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e5e7eb');
  doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
    .text('This is a computer-generated document and does not require a signature.', 50, footerY + 10, { align: 'center', width: 495 });

  doc.end();
}

export function generatePoPDF(res: Response, po: any) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=PO-${po.poNumber}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('AMOHA MOBILES', 50, 50);
  doc.fontSize(9).font('Helvetica').text('Email: purchase@amohamobiles.com', 50, 75);

  doc.fontSize(16).font('Helvetica-Bold').text('PURCHASE ORDER', 300, 50, { width: 245, align: 'right' });
  doc.fontSize(9).font('Helvetica').text(`PO #: ${po.poNumber}`, 300, 75, { width: 245, align: 'right' });
  const dateStr = new Date(po.orderDate || po.createdAt).toLocaleDateString('en-IN');
  doc.text(`Date: ${dateStr}`, 300, 87, { width: 245, align: 'right' });
  doc.text(`Status: ${(po.status || '').toUpperCase()}`, 300, 99, { width: 245, align: 'right' });

  doc.moveTo(50, 120).lineTo(545, 120).stroke('#e5e7eb');

  // Supplier Details
  doc.fontSize(10).font('Helvetica-Bold').text('SUPPLIER DETAILS:', 50, 135);
  doc.fontSize(9).font('Helvetica');
  let supY = 150;
  const sup = po.supplier || {};
  doc.text(`Name: ${sup.name || sup.companyName || 'N/A'}`, 50, supY);
  supY += 12;
  if (sup.email) { doc.text(`Email: ${sup.email}`, 50, supY); supY += 12; }
  if (sup.phone) { doc.text(`Phone: ${sup.phone}`, 50, supY); supY += 12; }

  // Items Table
  const tableTop = Math.max(supY, 150) + 20;
  doc.moveTo(50, tableTop).lineTo(545, tableTop).stroke('#d1d5db');
  doc.rect(50, tableTop, 495, 20).fill('#f9fafb').stroke('#e5e7eb');
  
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
  doc.text('Product', 60, tableTop + 6, { width: 180 });
  doc.text('SKU', 250, tableTop + 6, { width: 80 });
  doc.text('Qty', 340, tableTop + 6, { width: 40, align: 'center' });
  doc.text('Unit Price', 390, tableTop + 6, { width: 70, align: 'right' });
  doc.text('Line Total', 470, tableTop + 6, { width: 70, align: 'right' });

  doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke('#e5e7eb');

  let rowY = tableTop + 28;
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  
  (po.items || []).forEach((item: any) => {
    // some queries join products, some dont. use product.name if available
    const productName = item.products?.name || item.name || 'Unknown Product';
    const sku = item.products?.sku || item.sku || '-';
    
    doc.text(productName, 60, rowY, { width: 180 });
    doc.text(sku, 250, rowY, { width: 80 });
    doc.text(String(item.quantity || 0), 340, rowY, { width: 40, align: 'center' });
    doc.text(formatINR(item.unitCost), 390, rowY, { width: 70, align: 'right' });
    doc.text(formatINR(item.totalCost), 470, rowY, { width: 70, align: 'right' });
    
    rowY += 18;
    if (rowY > 700) { doc.addPage(); rowY = 50; }
  });

  doc.moveTo(350, rowY + 5).lineTo(545, rowY + 5).stroke('#d1d5db');
  rowY += 15;

  const addRow = (label: string, val: number, bold=false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9);
    doc.text(label, 350, rowY, { width: 100 });
    doc.text(formatINR(val), 460, rowY, { width: 80, align: 'right' });
    rowY += bold ? 18 : 15;
  };

  addRow('Subtotal:', po.subtotal || 0);
  if (po.taxAmount) addRow('Tax Amount:', po.taxAmount);
  if (po.shippingCost) addRow('Shipping Cost:', po.shippingCost);
  
  doc.moveTo(350, rowY).lineTo(545, rowY).stroke('#374151');
  rowY += 6;
  addRow('Grand Total:', po.totalAmount || 0, true);

  // Footer
  const footerY = doc.page.height - 70;
  doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e5e7eb');
  doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
    .text('This is a computer-generated document and does not require a signature.', 50, footerY + 10, { align: 'center', width: 495 });

  doc.end();
}
