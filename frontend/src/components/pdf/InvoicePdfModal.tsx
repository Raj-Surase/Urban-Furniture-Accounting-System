import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '../ui/Button';
import { PortalModal } from '../common/PortalModal';

export interface InvoicePdfData {
  id: number;
  invoice_number: string;
  type: 'customer' | 'vendor' | 'receivable' | 'payable' | string;
  party_type?: 'customer' | 'vendor';
  party?: {
    name?: string;
    company_name?: string;
    gstin?: string;
    address?: string;
    billing_address?: string;
    shipping_address?: string;
    state?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
  };
  status: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  place_of_supply?: string;
  is_interstate?: boolean;
  notes?: string;
  payment_terms?: string;
  customer?: {
    name: string;
    company_name?: string;
    gstin?: string;
    address?: string;
    billing_address?: string;
    shipping_address?: string;
    state?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
  };
  vendor?: {
    name: string;
    company_name?: string;
    gstin?: string;
    address?: string;
    billing_address?: string;
    shipping_address?: string;
    state?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
  };
  items?: Array<{
    id?: number;
    product_name?: string;
    description?: string;
    hsn_code?: string;
    quantity: number;
    unit_price: number;
    taxable_amount?: number;
    cgst_rate?: number;
    cgst_amount?: number;
    sgst_rate?: number;
    sgst_amount?: number;
    igst_rate?: number;
    igst_amount?: number;
    tax_amount?: number;
    line_total?: number;
    total_amount?: number;
    product?: {
      name: string;
      sku?: string;
      hsn_code?: string;
    };
  }>;
}

interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoicePdfData | null;
  autoPrint?: boolean;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  isOpen,
  onClose,
  invoice,
  autoPrint = false,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && autoPrint && invoice) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, invoice]);

  if (!isOpen || !invoice) return null;

  const isCustomer =
    invoice.type === 'customer' ||
    invoice.type === 'receivable' ||
    invoice.party_type === 'customer';

  const party = invoice.party || (isCustomer ? invoice.customer : invoice.vendor);
  const partyName =
    party?.company_name || party?.name || (isCustomer ? 'Azure Corporate Interiors' : 'Vendor Partner');
  const partyGstin = party?.gstin || '27AABTM4422K1Z8';
  const partyAddress =
    party?.billing_address ||
    party?.address ||
    party?.shipping_address ||
    'Azure Tech Park, Western Express Highway';
  const partyState = party?.state || invoice.place_of_supply || 'Maharashtra';

  // Company details
  const company = {
    name: 'URBAN FURNITURE PVT. LTD.',
    tagline: 'Premium Architectural & Commercial Furnishings',
    gstin: '27AAACU9988E1Z4',
    pan: 'AAACU9988E',
    address: 'Plot 42, Industrial Area, MIDC Phase 2, Pune, MH 411019, India',
    email: 'billing@urbanfurniture.in',
    phone: '+91 20 2740 0000',
    bank: {
      name: 'HDFC Bank Ltd.',
      accountName: 'Urban Furniture Pvt. Ltd.',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234',
      branch: 'MIDC Industrial Branch, Pune',
    },
  };

  const formatNumber = (val: number = 0) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDisplayDate = (dateStr?: string): string => {
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

  const generateInvoicePdf = async (): Promise<{
    canvas: HTMLCanvasElement;
    imgData: string;
    pdf: jsPDF;
  } | null> => {
    if (!printAreaRef.current || !invoice) return null;
    const element = printAreaRef.current;
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    return { canvas, imgData, pdf };
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current || !invoice) return;
    try {
      setIsGenerating(true);
      const generated = await generateInvoicePdf();
      if (!generated) return;
      generated.pdf.save(`${invoice.invoice_number || 'Tax_Invoice'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not export PDF. You can also use the Print button.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!printAreaRef.current || !invoice) return;
    try {
      setIsPrinting(true);
      const generated = await generateInvoicePdf();
      if (!generated) return;

      const { imgData, pdf } = generated;

      // Create an isolated hidden iframe for printing only the invoice document
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        throw new Error('Unable to access iframe document');
      }

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${invoice.invoice_number || 'Tax Invoice'}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        img {
          width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        width: 100%;
      }
      img {
        width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <img id="print-invoice-img" src="${imgData}" alt="Tax Invoice" />
  </body>
</html>`);
      frameDoc.close();

      const printImg = frameDoc.getElementById('print-invoice-img') as HTMLImageElement;
      const doPrint = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.error('Print iframe error:', err);
            // Fallback: open PDF blob in new window
            const blob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          }
        }, 150);
      };

      if (printImg.complete) {
        doPrint();
      } else {
        printImg.onload = doPrint;
        printImg.onerror = () => {
          const blob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        };
      }
    } catch (err) {
      console.error('Failed to prepare print document:', err);
      alert('Could not prepare invoice for print. You can also download the PDF directly.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Safe item list with complete calculation fallbacks
  const rawItems = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      id: 1,
      product_name: 'Executive Office Suite Combo',
      description: 'Ergonomic Luxury Chair Model X',
      hsn_code: '94036000',
      quantity: 1,
      unit_price: Number(invoice.subtotal) || 30000,
      taxable_amount: Number(invoice.subtotal) || 30000,
      line_total: Number(invoice.total_amount) || 35400,
    }
  ];

  const isInterstate = Boolean(invoice.is_interstate);

  const calculatedItems = rawItems.map((item, idx) => {
    const name = item.product?.name || item.product_name || item.description || 'Furniture Suite';
    const subDesc = item.description && item.description !== name ? item.description : null;
    const hsn = item.product?.hsn_code || item.hsn_code || '94036000';
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price) || 0;
    const taxable = Number(item.taxable_amount) || (qty * unitPrice);

    const cgstRate = Number(item.cgst_rate) || (isInterstate ? 0 : 9);
    const sgstRate = Number(item.sgst_rate) || (isInterstate ? 0 : 9);
    const igstRate = Number(item.igst_rate) || (isInterstate ? 18 : 0);

    const itemTax = Number(item.tax_amount) || (taxable * 0.18);
    const cgstAmt = Number(item.cgst_amount) > 0 
      ? Number(item.cgst_amount) 
      : (!isInterstate ? Math.round(taxable * (cgstRate / 100) * 100) / 100 : 0);
    const sgstAmt = Number(item.sgst_amount) > 0 
      ? Number(item.sgst_amount) 
      : (!isInterstate ? Math.round(taxable * (sgstRate / 100) * 100) / 100 : 0);
    const igstAmt = Number(item.igst_amount) > 0 
      ? Number(item.igst_amount) 
      : (isInterstate ? Math.round(taxable * (igstRate / 100) * 100) / 100 : 0);

    const lineTax = isInterstate ? igstAmt : (cgstAmt + sgstAmt);
    const lineTotal = Number(item.line_total) || Number(item.total_amount) || (taxable + lineTax);

    return {
      id: item.id || idx + 1,
      name,
      subDesc,
      hsn,
      qty,
      unitPrice,
      taxable,
      cgstRate,
      cgstAmt,
      sgstRate,
      sgstAmt,
      igstRate,
      igstAmt,
      lineTotal,
    };
  });

  const subtotal = Number(invoice.subtotal) || calculatedItems.reduce((acc, it) => acc + it.taxable, 0);
  const taxAmount = Number(invoice.tax_amount) || (subtotal * 0.18);
  const cgstTotal = Number(invoice.cgst_amount) || (!isInterstate ? taxAmount / 2 : 0);
  const sgstTotal = Number(invoice.sgst_amount) || (!isInterstate ? taxAmount / 2 : 0);
  const igstTotal = Number(invoice.igst_amount) || (isInterstate ? taxAmount : 0);
  const totalAmount = Number(invoice.total_amount) || (subtotal + (isInterstate ? igstTotal : cgstTotal + sgstTotal));
  const amountPaid = Number(invoice.amount_paid) || 0;
  const balanceDue = Number(invoice.balance_due ?? (totalAmount - amountPaid));

  const statusStr = (invoice.status || 'draft').toLowerCase();

  return (
    <PortalModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex="z-[75]"
      containerClassName="max-w-4xl"
      backdropClassName="p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static"
    >
      <div className="relative w-full bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:w-full print:my-0 print:bg-transparent">
        
        {/* Top Control Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121216] rounded-t-2xl print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                {invoice.invoice_number}
              </h2>
              <p className="text-xs text-neutral-400">
                {isCustomer ? 'Tax Invoice · Accounts Receivable' : 'Vendor Bill · Accounts Payable'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isPrinting || isGenerating}
              className="text-xs gap-1.5 border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-white cursor-pointer"
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              {isPrinting ? 'Preparing...' : 'Print'}
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGenerating || isPrinting}
              className="text-xs gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-purple-600/20 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors ml-2 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Capturable Document Container (pdfcn Modern Style) */}
        <div className="p-4 sm:p-6 overflow-x-auto bg-[#18181f] flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            ref={printAreaRef}
            id="pdfcn-document"
            className="w-full max-w-[794px] bg-white text-slate-900 p-8 sm:p-10 font-sans shadow-xl rounded-sm text-[12px] leading-relaxed border border-slate-200 print:border-none print:shadow-none print:p-6 print:m-0"
            style={{ minHeight: '1120px' }}
          >
            {/* 1. Modern Branded Header */}
            <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-600 rounded-full inline-block" />
                  <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase font-sans">
                    {company.name}
                  </h1>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{company.tagline}</p>
                <div className="mt-2 text-[10px] text-slate-600 space-y-0.5">
                  <p>{company.address}</p>
                  <p>
                    <span className="font-semibold text-slate-700">GSTIN:</span> {company.gstin} ·{' '}
                    <span className="font-semibold text-slate-700">PAN:</span> {company.pan}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Email:</span> {company.email} ·{' '}
                    <span className="font-semibold text-slate-700">Phone:</span> {company.phone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-950 text-white text-[11px] font-bold tracking-widest uppercase rounded">
                  {isCustomer ? 'TAX INVOICE' : 'VENDOR BILL'}
                </span>
                <div className="mt-3 text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Invoice No.
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                    {invoice.invoice_number}
                  </span>
                </div>
                <div className="mt-1.5">
                  <span
                    className={`inline-block text-[9.5px] font-bold uppercase px-2.5 py-0.5 rounded border ${
                      statusStr === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : statusStr === 'approved'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : statusStr === 'void'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    STATUS: {statusStr.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Metadata 4-Column Bar */}
            <div className="grid grid-cols-4 gap-4 py-4 border-b border-slate-200">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Invoice Date
                </span>
                <span className="font-bold text-slate-900 text-[11px] font-mono mt-0.5 block">
                  {formatDisplayDate(invoice.invoice_date)}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Payment Due Date
                </span>
                <span className="font-bold text-slate-900 text-[11px] font-mono mt-0.5 block">
                  {formatDisplayDate(invoice.due_date)}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Place of Supply
                </span>
                <span className="font-bold text-slate-900 text-[11px] mt-0.5 block">
                  {invoice.place_of_supply || partyState}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tax Mechanism
                </span>
                <span className="font-bold text-slate-900 text-[10px] tracking-tight mt-0.5 block">
                  {isInterstate ? 'INTER-STATE (IGST 18%)' : 'INTRA-STATE (CGST 9% + SGST 9%)'}
                </span>
              </div>
            </div>

            {/* 3. Billed To / Shipment Details 2-Column */}
            <div className="grid grid-cols-2 gap-8 py-4 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isCustomer ? 'BILLED TO (CUSTOMER)' : 'SUPPLIER / VENDOR'}
                </span>
                <p className="font-bold text-slate-950 text-[12.5px]">{partyName}</p>
                <p className="text-slate-600 text-[10.5px] leading-snug">{partyAddress}</p>
                <p className="text-[10px] text-slate-700">
                  <span className="font-semibold text-slate-800">State:</span> {partyState}
                </p>
                <p className="text-[10px] text-slate-800">
                  <span className="font-semibold text-slate-800">GSTIN:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">{partyGstin}</span>
                </p>
              </div>

              <div className="border-l border-slate-200 pl-6 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  SHIPMENT & DELIVERY DETAILS
                </span>
                <p className="font-semibold text-slate-900 text-[11.5px]">Destination Delivery Facility</p>
                <p className="text-slate-600 text-[10.5px] leading-snug">Tower B, Office Floors 4-7</p>
                <p className="text-[9.5px] text-slate-500 italic mt-1.5">
                  <span className="font-semibold text-slate-700 not-italic">Dispatch Note:</span> In conformity with Section 31 of CGST Act 2017.
                </p>
              </div>
            </div>

            {/* 4. Line Items Table */}
            <div className="py-4 border-b border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
                    <th className="py-2.5 px-2 text-center w-8">#</th>
                    <th className="py-2.5 px-3 text-left">ITEM & DESCRIPTION</th>
                    <th className="py-2.5 px-2 text-center w-20">HSN</th>
                    <th className="py-2.5 px-2 text-right w-14">QTY</th>
                    <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">RATE</th>
                    <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">TAXABLE</th>
                    {isInterstate ? (
                      <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">IGST</th>
                    ) : (
                      <>
                        <th className="py-2.5 px-2.5 text-right w-24 whitespace-nowrap">CGST</th>
                        <th className="py-2.5 px-2.5 text-right w-24 whitespace-nowrap">SGST</th>
                      </>
                    )}
                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10.5px]">
                  {calculatedItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 text-center text-slate-400 font-mono text-[9.5px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block text-[11px]">{item.name}</span>
                        {item.subDesc && (
                          <span className="text-[9.5px] text-slate-500 block mt-0.5">{item.subDesc}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-[9.5px] text-slate-600">
                        {item.hsn}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-semibold text-slate-800">
                        {formatNumber(item.qty)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                        ₹{formatNumber(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        ₹{formatNumber(item.taxable)}
                      </td>
                      {isInterstate ? (
                        <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                          <span className="text-[8.5px] text-slate-400 block font-sans">
                            {item.igstRate.toFixed(2)}%
                          </span>
                          ₹{formatNumber(item.igstAmt)}
                        </td>
                      ) : (
                        <>
                          <td className="py-3 px-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                            <span className="text-[8.5px] text-slate-400 block font-sans">
                              {item.cgstRate.toFixed(2)}%
                            </span>
                            ₹{formatNumber(item.cgstAmt)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                            <span className="text-[8.5px] text-slate-400 block font-sans">
                              {item.sgstRate.toFixed(2)}%
                            </span>
                            ₹{formatNumber(item.sgstAmt)}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                        ₹{formatNumber(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. Summary & Tax Card Section */}
            <div className="grid grid-cols-2 gap-8 pt-5 mt-2">
              <div className="space-y-4">
                {/* Bank / Remittance Details */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2.5">
                    PAYMENT INSTRUCTIONS & BANK ACCOUNT
                  </span>
                  <div className="text-[10.5px] space-y-1.5 text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Bank:</span> {company.bank.name}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Account No:</span>{' '}
                      <span className="font-mono font-bold text-slate-950">{company.bank.accountNumber}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">IFSC Code:</span>{' '}
                      <span className="font-mono font-bold text-slate-950">{company.bank.ifsc}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Branch:</span>{' '}
                      {company.bank.branch}
                    </p>
                  </div>
                </div>

                {/* Terms / Conditions */}
                <div className="text-[9.5px] text-slate-500 leading-relaxed space-y-1">
                  <p className="font-bold text-slate-800 mb-0.5">Terms & Conditions:</p>
                  <p>1. Goods once sold will not be accepted back unless manufacturing defect reported in 48 hours.</p>
                  <p>2. Interest @ 18% p.a. will be levied on overdue payments past {formatDisplayDate(invoice.due_date)}.</p>
                  <p>3. Subject to Pune jurisdiction only.</p>
                </div>
              </div>

              {/* Totals Calculation Box */}
              <div>
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-2.5">
                  <div className="flex justify-between text-[11px] text-slate-700">
                    <span>Taxable Value (Subtotal):</span>
                    <span className="font-mono font-bold text-slate-950">
                      ₹{formatNumber(subtotal)}
                    </span>
                  </div>

                  {isInterstate ? (
                    <div className="flex justify-between text-[11px] text-slate-700">
                      <span>IGST (18%):</span>
                      <span className="font-mono font-bold text-slate-950">
                        ₹{formatNumber(igstTotal)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-[11px] text-slate-700">
                        <span>CGST (9%):</span>
                        <span className="font-mono font-bold text-slate-950">
                          ₹{formatNumber(cgstTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-700">
                        <span>SGST (9%):</span>
                        <span className="font-mono font-bold text-slate-950">
                          ₹{formatNumber(sgstTotal)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-slate-300 pt-3 flex justify-between items-baseline">
                    <div>
                      <span className="text-[12px] font-black uppercase text-slate-950 block tracking-tight">
                        TOTAL INVOICE VALUE:
                      </span>
                      <span className="text-[9px] text-slate-500">Includes all applicable GST</span>
                    </div>
                    <span className="text-xl font-black text-slate-950 font-mono tracking-tight">
                      ₹{formatNumber(totalAmount)}
                    </span>
                  </div>

                  {amountPaid > 0 && (
                    <div className="flex justify-between text-[10.5px] text-emerald-700 pt-1 border-t border-dashed border-slate-200">
                      <span>Amount Received / Paid:</span>
                      <span className="font-mono font-bold">
                        - ₹{formatNumber(amountPaid)}
                      </span>
                    </div>
                  )}

                  {balanceDue > 0 && (
                    <div className="flex justify-between text-[11px] font-bold text-slate-900 border-t border-dashed border-slate-200 pt-1">
                      <span>Balance Due:</span>
                      <span className="font-mono text-amber-600">
                        ₹{formatNumber(balanceDue)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Signatory Stamp */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex justify-between items-end">
              <div className="text-[8.5px] text-slate-400 space-y-0.5">
                <p>Computer Generated Invoice</p>
                <p>Valid without physical signature under IT Act 2000</p>
              </div>
              <div className="text-right">
                <div className="h-8 border-b border-slate-400 w-44 ml-auto mb-1.5" />
                <span className="text-[9.5px] font-bold text-slate-800 uppercase block tracking-wider">
                  AUTHORIZED SIGNATORY
                </span>
                <span className="text-[8.5px] text-slate-500 block">For Urban Furniture Pvt. Ltd.</span>
              </div>
            </div>

            {/* 7. Footer Note */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400 font-mono">
              Urban Furniture Platform · E-Invoice Generation · Thank you for your partnership!
            </div>
          </div>
        </div>

      </div>
    </PortalModal>
  );
};

export default InvoicePdfModal;
