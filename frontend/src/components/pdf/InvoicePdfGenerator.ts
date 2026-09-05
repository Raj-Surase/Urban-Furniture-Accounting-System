import jsPDF from 'jspdf';
import { InvoicePdfData } from './InvoicePdfModal';

const formatCurrency = (val: number = 0): string => {
  return Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const buildInvoicePdfDoc = (invoice: InvoicePdfData): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const isCustomer =
    invoice.type === 'customer' ||
    invoice.type === 'receivable' ||
    invoice.party_type === 'customer';

  const party =
    invoice.party || (isCustomer ? invoice.customer : invoice.vendor);

  const partyName =
    party?.company_name || party?.name || (isCustomer ? 'Customer' : 'Vendor');
  const partyGstin = party?.gstin || 'Unregistered / Consumer';
  const partyAddress =
    party?.billing_address || party?.address || 'Commercial District, Pune, MH';
  const partyState = party?.state || invoice.place_of_supply || 'Maharashtra (27)';

  const company = {
    name: 'Urban Furniture Pvt. Ltd.',
    tagline: 'Premium Architectural & Commercial Street Furniture',
    gstin: '27AAACU9988E1Z4 (Maharashtra - 27)',
    pan: 'AAACU9988E',
    address: 'Plot 42, Furniture Industrial Estate, MIDC Phase II, Pune, MH 411019',
    email: 'billing@urbanfurniture.in | Tel: +91 20 2740 0000',
    bank: {
      name: 'HDFC Bank Ltd.',
      accountName: 'Urban Furniture Pvt. Ltd.',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234',
      branch: 'MIDC Industrial Branch, Pune',
    },
  };

  // Top Indigo Accent Line
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Company Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 31);
  doc.text(company.name, 40, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(company.tagline, 40, 48);
  doc.text(company.address, 40, 58);
  doc.text(`GSTIN: ${company.gstin} • PAN: ${company.pan} • ${company.email}`, 40, 68);

  // Document Badge Header (Right)
  const docTitle = isCustomer ? 'TAX INVOICE' : 'VENDOR BILL';
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - 180, 24, 140, 48, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text(docTitle, pageWidth - 110, 44, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Original for Recipient`, pageWidth - 110, 58, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(40, 78, pageWidth - 40, 78);

  // Meta Info Two-Column Block
  let y = 92;
  const colWidth = (pageWidth - 80 - 16) / 2;

  // Left Card: Party Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, y, colWidth, 74, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(isCustomer ? 'BILLED TO (CUSTOMER):' : 'SUPPLIER / VENDOR:', 48, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(partyName, 48, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const truncAddr = partyAddress.length > 50 ? partyAddress.substring(0, 48) + '...' : partyAddress;
  doc.text(truncAddr, 48, y + 40);
  doc.text(`GSTIN / UIN: ${partyGstin}`, 48, y + 52);
  doc.text(`State / Place of Supply: ${partyState}`, 48, y + 64);

  // Right Card: Invoice Details
  const rightX = 40 + colWidth + 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, colWidth, 74, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DOCUMENT SPECIFICATIONS:', rightX + 8, y + 14);

  const drawField = (lbl: string, val: string, dy: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, rightX + 8, y + dy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(val, rightX + colWidth - 8, y + dy, { align: 'right' });
  };

  drawField('Invoice Number:', invoice.invoice_number || 'INV-2026-0001', 28);
  drawField('Invoice Date:', formatDate(invoice.invoice_date), 40);
  drawField('Due Date:', formatDate(invoice.due_date), 52);
  drawField('Payment Status:', (invoice.status || 'PAID').toUpperCase(), 64);

  y += 88;

  // Table Headers
  const colX = {
    idx: 46,
    desc: 75,
    hsn: 240,
    qty: 305,
    rate: 375,
    tax: 445,
    total: 545,
  };

  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text('#', colX.idx, y + 14);
  doc.text('ITEM DESCRIPTION', colX.desc, y + 14);
  doc.text('HSN / SAC', colX.hsn, y + 14);
  doc.text('QTY', colX.qty, y + 14, { align: 'right' });
  doc.text('RATE (Rs.)', colX.rate, y + 14, { align: 'right' });
  doc.text('TAX (GST)', colX.tax, y + 14, { align: 'right' });
  doc.text('AMOUNT (Rs.)', colX.total, y + 14, { align: 'right' });
  y += 24;

  // Line Items
  const items = invoice.items || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (items.length === 0) {
    // Default fallback row matching sample if empty
    items.push({
      id: 1,
      product_name: 'Urban Furniture Merchandise Item',
      description: 'Furniture assembly & standard delivery',
      hsn_code: '94036000',
      quantity: 1,
      unit_price: Number(invoice.subtotal) || Number(invoice.total_amount) || 0,
      total_amount: Number(invoice.total_amount) || 0,
    });
  }

  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(40, y - 9, pageWidth - 80, 16, 'F');
    }

    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), colX.idx, y + 3);

    const title = item.product?.name || item.product_name || item.description || 'Furniture Product';
    const truncTitle = title.length > 32 ? title.substring(0, 30) + '...' : title;
    doc.setTextColor(30, 41, 59);
    doc.text(truncTitle, colX.desc, y + 3);

    const hsn = item.product?.hsn_code || item.hsn_code || '94036000';
    doc.setTextColor(100, 116, 139);
    doc.text(hsn, colX.hsn, y + 3);

    const qty = Number(item.quantity) || 1;
    doc.setTextColor(30, 41, 59);
    doc.text(String(qty), colX.qty, y + 3, { align: 'right' });

    const unitPrice = Number(item.unit_price) || 0;
    doc.text(formatCurrency(unitPrice), colX.rate, y + 3, { align: 'right' });

    const taxAmount = Number(item.tax_amount || 0) || (Number(item.cgst_amount || 0) + Number(item.sgst_amount || 0) + Number(item.igst_amount || 0));
    doc.setTextColor(100, 116, 139);
    doc.text(taxAmount > 0 ? `Rs. ${formatCurrency(taxAmount)}` : (invoice.is_interstate ? '18% IGST' : '18% GST'), colX.tax, y + 3, { align: 'right' });

    const lineTotal = Number(item.line_total || item.total_amount || (qty * unitPrice + taxAmount)) || 0;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${formatCurrency(lineTotal)}`, colX.total, y + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 18;
  });

  // Totals Section
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(40, y, pageWidth - 40, y);
  y += 14;

  const totalsWidth = 220;
  const totalsX = pageWidth - 40 - totalsWidth;

  const drawTotalLine = (lbl: string, val: number, isGrand: boolean = false) => {
    if (isGrand) {
      doc.setFillColor(241, 245, 249);
      doc.rect(totalsX, y - 8, totalsWidth, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text(lbl, totalsX + 6, y + 5);
      doc.text(`Rs. ${formatCurrency(val)}`, pageWidth - 46, y + 5, { align: 'right' });
      y += 22;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(lbl, totalsX + 6, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Rs. ${formatCurrency(val)}`, pageWidth - 46, y, { align: 'right' });
      y += 15;
    }
  };

  const subtotal = Number(invoice.subtotal) || 0;
  const isInterstate = Boolean(invoice.is_interstate);
  const taxAmount = Number(invoice.tax_amount) || 0;
  const cgst = Number(invoice.cgst_amount) || (!isInterstate ? taxAmount / 2 : 0);
  const sgst = Number(invoice.sgst_amount) || (!isInterstate ? taxAmount / 2 : 0);
  const igst = Number(invoice.igst_amount) || (isInterstate ? taxAmount : 0);
  const total = Number(invoice.total_amount) || (subtotal + taxAmount);
  const paid = Number(invoice.amount_paid) || 0;
  const balance = Number(invoice.balance_due ?? (total - paid));

  // Left Bank & Remittance info block
  const bankBlockY = y;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, bankBlockY - 8, colWidth, 75, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ELECTRONIC BANK REMITTANCE DETAILS:', 48, bankBlockY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Bank Name: ${company.bank.name}`, 48, bankBlockY + 18);
  doc.text(`Account Title: ${company.bank.accountName}`, 48, bankBlockY + 29);
  doc.text(`A/C Number: ${company.bank.accountNumber}`, 48, bankBlockY + 40);
  doc.text(`IFSC Code: ${company.bank.ifsc}`, 48, bankBlockY + 51);
  doc.text(`Branch: ${company.bank.branch}`, 48, bankBlockY + 62);

  // Right Totals column
  drawTotalLine('Taxable Subtotal:', subtotal);
  if (cgst > 0) drawTotalLine('Central GST (CGST - 9%):', cgst);
  if (sgst > 0) drawTotalLine('State GST (SGST - 9%):', sgst);
  if (igst > 0) drawTotalLine('Integrated GST (IGST - 18%):', igst);
  drawTotalLine('GRAND TOTAL (INC. TAXES):', total, true);
  drawTotalLine('Amount Paid:', paid);
  drawTotalLine('Balance Due:', balance);

  // Signatures and Terms
  y = Math.max(y + 16, bankBlockY + 95);

  // Terms (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TERMS & STATUTORY CONDITIONS:', 40, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('1. All payments strictly payable within agreed payment terms.', 40, y + 12);
  doc.text('2. Interest @ 18% p.a. will be levied on overdue invoices past 30 days.', 40, y + 22);
  doc.text('3. Goods once sold will not be returned unless manufacturing defect certified.', 40, y + 32);

  // Authorized Signatory (Right)
  const sigX = pageWidth - 180;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('FOR URBAN FURNITURE PVT. LTD.', sigX, y, { align: 'left' });

  doc.setDrawColor(203, 213, 225);
  doc.line(sigX, y + 42, pageWidth - 40, y + 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Authorized Signatory & Seal', sigX, y + 54);

  // Page Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(40, pageHeight - 25, pageWidth - 40, pageHeight - 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a Computer Generated Tax Invoice. No physical signature required.', 40, pageHeight - 14);
  doc.text('Urban Furniture ERP', pageWidth - 40, pageHeight - 14, { align: 'right' });

  return doc;
};

export const generateVectorInvoicePdf = (invoice: InvoicePdfData) => {
  const doc = buildInvoicePdfDoc(invoice);
  doc.save(`${invoice.invoice_number || 'Tax_Invoice'}.pdf`);
};

