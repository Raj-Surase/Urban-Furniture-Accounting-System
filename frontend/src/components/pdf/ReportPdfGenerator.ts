import jsPDF from 'jspdf';

export interface ReportDateRange {
  fromDate?: string;
  toDate?: string;
}

const formatCurrency = (val: number = 0): string => {
  return Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const COMPANY_INFO = {
  name: 'Urban Furniture Pvt. Ltd.',
  tagline: 'Premium Architectural & Commercial Street Furniture',
  address: 'Plot 42, Furniture Industrial Estate, Phase II, Pune, MH 411019',
  gstin: '27AAACU9988E1Z4 (Maharashtra - 27)',
  email: 'accounts@urbanfurniture.in | Tel: +91 20 2740 0000',
};

/**
 * Draws the standard corporate header with logo block, company details,
 * and report title metadata.
 */
const drawHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  dateRange?: ReportDateRange
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top corporate color accent bar
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Company Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(24, 24, 31);
  doc.text(COMPANY_INFO.name, 40, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(COMPANY_INFO.tagline, 40, 44);
  doc.text(`${COMPANY_INFO.address} • GSTIN: ${COMPANY_INFO.gstin}`, 40, 54);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(40, 62, pageWidth - 40, 62);

  // Report Title Badge Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, 70, pageWidth - 80, 44, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text(title.toUpperCase(), 52, 88);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  let periodText = subtitle;
  if (dateRange?.fromDate && dateRange?.toDate) {
    periodText += ` | Period: ${dateRange.fromDate} to ${dateRange.toDate}`;
  } else if (dateRange?.toDate) {
    periodText += ` | As of ${dateRange.toDate}`;
  } else {
    periodText += ` | Generated: ${new Date().toLocaleDateString('en-IN')}`;
  }
  doc.text(periodText, 52, 102);

  return 126; // Y coordinate where content should begin
};

/**
 * Draws standard page footer with timestamp and confidentiality notice.
 */
const drawFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(40, pageHeight - 30, pageWidth - 40, pageHeight - 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Urban Furniture ERP • Confidential Statutory Accounting Record', 40, pageHeight - 18);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 40, pageHeight - 18, { align: 'right' });
};

/**
 * Generate PDF for Trial Balance Report
 */
export const exportTrialBalancePdf = (data: any, dateRange?: ReportDateRange) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = drawHeader(
    doc,
    'Trial Balance Financial Statement',
    'Double-Entry General Ledger Account Balances',
    dateRange
  );

  // Status Banner
  const isBalanced = Boolean(data.is_balanced);
  if (isBalanced) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(40, y, pageWidth - 80, 26, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text('STATUS: BALANCED (Total Debits Equal Total Credits)', 52, y + 17);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(40, y, pageWidth - 80, 26, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text(`STATUS: IMBALANCE DETECTED (Difference: ₹${formatCurrency(data.difference)})`, 52, y + 17);
  }
  y += 36;

  // Table Headers
  const colX = { code: 48, name: 110, type: 280, debit: 430, credit: 545 };
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CODE', colX.code, y + 14);
  doc.text('ACCOUNT NAME', colX.name, y + 14);
  doc.text('TYPE', colX.type, y + 14);
  doc.text('DEBIT (₹)', colX.debit, y + 14, { align: 'right' });
  doc.text('CREDIT (₹)', colX.credit, y + 14, { align: 'right' });
  y += 24;

  // Table Rows
  const rows = data.rows || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rows.forEach((row: any, idx: number) => {
    // Check page break
    if (y > pageHeight - 55) {
      doc.addPage();
      y = drawHeader(doc, 'Trial Balance (Continued)', 'Double-Entry General Ledger Account Balances', dateRange);
      // Re-draw headers
      doc.setFillColor(241, 245, 249);
      doc.rect(40, y, pageWidth - 80, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('CODE', colX.code, y + 14);
      doc.text('ACCOUNT NAME', colX.name, y + 14);
      doc.text('TYPE', colX.type, y + 14);
      doc.text('DEBIT (₹)', colX.debit, y + 14, { align: 'right' });
      doc.text('CREDIT (₹)', colX.credit, y + 14, { align: 'right' });
      y += 24;
      doc.setFont('helvetica', 'normal');
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(40, y - 10, pageWidth - 80, 16, 'F');
    }

    doc.setTextColor(100, 116, 139);
    doc.text(String(row.code), colX.code, y + 2);

    doc.setTextColor(30, 41, 59);
    const truncName = row.name.length > 28 ? row.name.substring(0, 26) + '...' : row.name;
    doc.text(truncName, colX.name, y + 2);

    doc.setTextColor(100, 116, 139);
    doc.text(String(row.type).toUpperCase(), colX.type, y + 2);

    doc.setTextColor(16, 185, 129); // emerald for debit
    doc.text(row.debit_balance > 0 ? formatCurrency(row.debit_balance) : '—', colX.debit, y + 2, { align: 'right' });

    doc.setTextColor(99, 102, 241); // indigo for credit
    doc.text(row.credit_balance > 0 ? formatCurrency(row.credit_balance) : '—', colX.credit, y + 2, { align: 'right' });

    y += 16;
  });

  // Total Footer Row
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(40, y, pageWidth - 40, y);
  y += 14;

  doc.setFillColor(241, 245, 249);
  doc.rect(40, y - 10, pageWidth - 80, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('GRAND TOTAL', colX.code, y + 4);
  doc.setTextColor(16, 185, 129);
  doc.text(`₹${formatCurrency(data.total_debit)}`, colX.debit, y + 4, { align: 'right' });
  doc.setTextColor(99, 102, 241);
  doc.text(`₹${formatCurrency(data.total_credit)}`, colX.credit, y + 4, { align: 'right' });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`Trial_Balance_${dateRange?.toDate || new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generate PDF for Income Statement (Profit & Loss)
 */
export const exportIncomeStatementPdf = (data: any, dateRange?: ReportDateRange) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawHeader(
    doc,
    'Income Statement (Profit & Loss)',
    data.period || 'Fiscal Statement',
    dateRange
  );

  // Revenue Section
  doc.setFillColor(248, 250, 252);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('OPERATING REVENUE', 48, y + 15);
  doc.text(`₹${formatCurrency(data.total_revenue)}`, pageWidth - 48, y + 15, { align: 'right' });
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  (data.revenues || []).filter((r: any) => Number(r.amount) !== 0).forEach((rev: any) => {
    doc.setTextColor(71, 85, 105);
    doc.text(`${rev.code} - ${rev.name}`, 60, y);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹${formatCurrency(rev.amount)}`, pageWidth - 48, y, { align: 'right' });
    y += 16;
  });

  // COGS and Gross Profit
  y += 8;
  doc.setFillColor(254, 242, 242);
  doc.rect(40, y, pageWidth - 80, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text('Cost of Goods Sold (COGS - 5100)', 48, y + 14);
  doc.text(`- ₹${formatCurrency(data.cogs)}`, pageWidth - 48, y + 14, { align: 'right' });
  y += 26;

  doc.setFillColor(236, 253, 245);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('GROSS OPERATING PROFIT', 48, y + 15);
  doc.text(`₹${formatCurrency(data.gross_profit)}`, pageWidth - 48, y + 15, { align: 'right' });
  y += 32;

  // Operating Expenses
  doc.setFillColor(248, 250, 252);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text('OPERATING EXPENSES', 48, y + 15);
  doc.text(`₹${formatCurrency(data.operating_expenses)}`, pageWidth - 48, y + 15, { align: 'right' });
  y += 28;

  doc.setFont('helvetica', 'normal');
  (data.expenses || []).filter((e: any) => e.code !== '5100' && Number(e.amount) !== 0).forEach((exp: any) => {
    doc.setTextColor(71, 85, 105);
    doc.text(`${exp.code} - ${exp.name}`, 60, y);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹${formatCurrency(exp.amount)}`, pageWidth - 48, y, { align: 'right' });
    y += 16;
  });

  // Net Income Banner
  y += 14;
  const isProfit = Number(data.net_profit || 0) >= 0;
  doc.setFillColor(isProfit ? 236 : 254, isProfit ? 253 : 242, isProfit ? 245 : 242);
  doc.setDrawColor(isProfit ? 167 : 254, isProfit ? 243 : 202, isProfit ? 208 : 202);
  doc.roundedRect(40, y, pageWidth - 80, 36, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(isProfit ? 5 : 220, isProfit ? 150 : 38, isProfit ? 105 : 38);
  doc.text('NET OPERATING PROFIT / (LOSS)', 52, y + 23);
  doc.text(`₹${formatCurrency(data.net_profit)}`, pageWidth - 52, y + 23, { align: 'right' });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`Income_Statement_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generate PDF for Balance Sheet Report
 */
export const exportBalanceSheetPdf = (data: any, dateRange?: ReportDateRange) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawHeader(
    doc,
    'Balance Sheet Statement',
    'Financial Position & Accounting Equation Statement',
    dateRange
  );

  // Accounting Equation Verification Banner
  const isBalanced = Boolean(data.is_balanced);
  doc.setFillColor(isBalanced ? 238 : 254, isBalanced ? 242 : 242, isBalanced ? 255 : 242);
  doc.setDrawColor(isBalanced ? 199 : 254, isBalanced ? 210 : 202, isBalanced ? 254 : 202);
  doc.roundedRect(40, y, pageWidth - 80, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isBalanced ? 79 : 220, isBalanced ? 70 : 38, isBalanced ? 229 : 38);
  doc.text(
    `Assets: ₹${formatCurrency(data.total_assets)} = Liabilities & Equity: ₹${formatCurrency(data.total_liabilities_and_equity)} (${isBalanced ? 'BALANCED' : 'IMBALANCE'})`,
    52,
    y + 17
  );
  y += 34;

  // Assets Section
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235); // Blue 600
  doc.text('TOTAL ASSETS', 48, y + 14);
  doc.text(`₹${formatCurrency(data.total_assets)}`, pageWidth - 48, y + 14, { align: 'right' });
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  (data.assets || []).forEach((ast: any) => {
    doc.setTextColor(71, 85, 105);
    doc.text(`${ast.code} - ${ast.name}`, 56, y);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹${formatCurrency(ast.amount)}`, pageWidth - 48, y, { align: 'right' });
    y += 15;
  });

  // Liabilities Section
  y += 10;
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(217, 119, 6); // Amber 600
  doc.text('TOTAL LIABILITIES', 48, y + 14);
  doc.text(`₹${formatCurrency(data.total_liabilities)}`, pageWidth - 48, y + 14, { align: 'right' });
  y += 24;

  doc.setFont('helvetica', 'normal');
  (data.liabilities || []).forEach((lia: any) => {
    doc.setTextColor(71, 85, 105);
    doc.text(`${lia.code} - ${lia.name}`, 56, y);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹${formatCurrency(lia.amount)}`, pageWidth - 48, y, { align: 'right' });
    y += 15;
  });

  // Equity Section
  y += 10;
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(147, 51, 234); // Purple 600
  doc.text("TOTAL OWNER'S EQUITY", 48, y + 14);
  doc.text(`₹${formatCurrency(data.total_equity)}`, pageWidth - 48, y + 14, { align: 'right' });
  y += 24;

  doc.setFont('helvetica', 'normal');
  (data.equity || []).forEach((eq: any) => {
    doc.setTextColor(71, 85, 105);
    doc.text(`${eq.code} - ${eq.name}`, 56, y);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹${formatCurrency(eq.amount)}`, pageWidth - 48, y, { align: 'right' });
    y += 15;
  });

  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Period Net Income (P&L Addition)', 56, y);
  doc.text(`₹${formatCurrency(data.current_period_net_income)}`, pageWidth - 48, y, { align: 'right' });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`Balance_Sheet_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generate PDF for AR / AP Aging Report
 */
export const exportAgingPdf = (arData: any, apData: any, dateRange?: ReportDateRange) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawHeader(
    doc,
    'Accounts Receivable & Payable Aging',
    '30 / 60 / 90 / 90+ Day Aging Distribution',
    dateRange
  );

  const drawAgingBlock = (
    title: string,
    summary: any,
    partyRows: any[],
    partyKey: 'customer_name' | 'vendor_name',
    accentColor: [number, number, number]
  ) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(40, y, pageWidth - 80, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(title.toUpperCase(), 48, y + 15);
    doc.text(`Total Due: ₹${formatCurrency(summary?.total)}`, pageWidth - 48, y + 15, { align: 'right' });
    y += 28;

    // Bucket Summary Grid
    const buckets = [
      { label: 'Current', val: summary?.current },
      { label: '1-30 Days', val: summary?.days_1_30 },
      { label: '31-60 Days', val: summary?.days_31_60 },
      { label: '61-90 Days', val: summary?.days_61_90 },
      { label: '90+ Days', val: summary?.over_90 },
    ];

    const boxW = (pageWidth - 80 - 16) / 5;
    buckets.forEach((b, i) => {
      const bx = 40 + i * (boxW + 4);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(bx, y, boxW, 28, 2, 2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(b.label, bx + boxW / 2, y + 10, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(`₹${formatCurrency(b.val)}`, bx + boxW / 2, y + 22, { align: 'center' });
    });
    y += 36;

    // Party Items
    if (partyRows && partyRows.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('PARTY NAME', 48, y);
      doc.text('CURRENT', 240, y, { align: 'right' });
      doc.text('1-30 DAYS', 310, y, { align: 'right' });
      doc.text('31-60 DAYS', 380, y, { align: 'right' });
      doc.text('61-90 DAYS', 450, y, { align: 'right' });
      doc.text('TOTAL DUE', pageWidth - 48, y, { align: 'right' });
      y += 8;
      doc.setDrawColor(226, 232, 240);
      doc.line(40, y, pageWidth - 40, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      partyRows.forEach((row) => {
        doc.setTextColor(30, 41, 59);
        const name = row[partyKey] || 'Unknown';
        doc.text(name.length > 25 ? name.substring(0, 23) + '...' : name, 48, y);
        doc.text(formatCurrency(row.current), 240, y, { align: 'right' });
        doc.text(formatCurrency(row.days_1_30), 310, y, { align: 'right' });
        doc.text(formatCurrency(row.days_31_60), 380, y, { align: 'right' });
        doc.text(formatCurrency(row.days_61_90), 450, y, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(`₹${formatCurrency(row.total_due)}`, pageWidth - 48, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 14;
      });
    }
    y += 14;
  };

  drawAgingBlock('Accounts Receivable (Customer Dues)', arData?.summary, arData?.by_customer, 'customer_name', [16, 185, 129]);
  drawAgingBlock('Accounts Payable (Vendor Bills)', apData?.summary, apData?.by_vendor, 'vendor_name', [225, 29, 72]);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`Aging_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generate PDF for GST Statutory Summary Report
 */
export const exportGstSummaryPdf = (data: any, dateRange?: ReportDateRange) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawHeader(
    doc,
    'GST Statutory Return & Tax Summary',
    'GSTR-1, GSTR-2B ITC, and GSTR-3B Cash Settlement',
    dateRange
  );

  // Output Tax (GSTR-1)
  doc.setFillColor(254, 242, 242);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(225, 29, 72);
  doc.text('GST OUTPUT LIABILITY (GSTR-1 SALES TAX)', 48, y + 15);
  doc.text(`₹${formatCurrency(data?.output_tax?.total_output)}`, pageWidth - 48, y + 15, { align: 'right' });
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const outTax = [
    { label: 'CGST Output (Account 2121 - 9% Intrastate)', val: data?.output_tax?.cgst_output },
    { label: 'SGST Output (Account 2122 - 9% Intrastate)', val: data?.output_tax?.sgst_output },
    { label: 'IGST Output (Account 2123 - 18% Interstate)', val: data?.output_tax?.igst_output },
  ];
  outTax.forEach((t) => {
    doc.setTextColor(71, 85, 105);
    doc.text(t.label, 56, y);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹${formatCurrency(t.val)}`, pageWidth - 48, y, { align: 'right' });
    y += 16;
  });

  // Input Tax Credit (GSTR-2B)
  y += 12;
  doc.setFillColor(236, 253, 245);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(5, 150, 105);
  doc.text('INPUT TAX CREDIT - ITC (GSTR-2B PROCUREMENT CREDITS)', 48, y + 15);
  doc.text(`₹${formatCurrency(data?.input_tax_credit?.total_input_credit)}`, pageWidth - 48, y + 15, { align: 'right' });
  y += 28;

  doc.setFont('helvetica', 'normal');
  const inTax = [
    { label: 'CGST Input ITC (Account 2131 - 9% Paid on Goods)', val: data?.input_tax_credit?.cgst_input },
    { label: 'SGST Input ITC (Account 2132 - 9% Paid on Goods)', val: data?.input_tax_credit?.sgst_input },
    { label: 'IGST Input ITC (Account 2133 - 18% Interstate)', val: data?.input_tax_credit?.igst_input },
  ];
  inTax.forEach((t) => {
    doc.setTextColor(71, 85, 105);
    doc.text(t.label, 56, y);
    doc.setTextColor(30, 41, 59);
    doc.text(`₹${formatCurrency(t.val)}`, pageWidth - 48, y, { align: 'right' });
    y += 16;
  });

  // Net Settlement (GSTR-3B)
  y += 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, y, pageWidth - 80, 44, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('NET GST CASH PAYABLE TO GOVERNMENT (GSTR-3B)', 52, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Tax liability remaining after adjustment of available Input Tax Credit', 52, y + 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72);
  doc.text(`₹${formatCurrency(data?.net_gst_payable)}`, pageWidth - 52, y + 26, { align: 'right' });
  y += 54;

  if (Number(data?.input_credit_carryover || 0) > 0) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(40, y, pageWidth - 80, 28, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text('INPUT TAX CREDIT CARRIED FORWARD TO NEXT MONTH:', 52, y + 18);
    doc.text(`₹${formatCurrency(data?.input_credit_carryover)}`, pageWidth - 52, y + 18, { align: 'right' });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`GST_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
};

