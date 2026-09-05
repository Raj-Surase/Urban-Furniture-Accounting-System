import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  ArrowDownToLine,
  Loader2,
} from 'lucide-react';
import { generateVectorInvoicePdf } from './InvoicePdfGenerator';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
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
    id: number;
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
    total_amount: number;
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
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !invoice) return null;

  const isCustomer =
    invoice.type === 'customer' ||
    invoice.type === 'receivable' ||
    invoice.party_type === 'customer';
  const party =
    invoice.party ||
    (isCustomer ? invoice.customer : invoice.vendor);
  const partyName =
    party?.company_name ||
    party?.name ||
    (isCustomer ? 'Customer' : 'Vendor Partner');
  const partyGstin = party?.gstin || 'Unregistered / Consumer';
  const partyAddress =
    party?.billing_address ||
    party?.address ||
    party?.shipping_address ||
    'Plot 18, Commercial Zone, Pune, MH';
  const partyState = party?.state || invoice.place_of_supply || 'Maharashtra (27)';

  // Company details
  const company = {
    name: 'Urban Furniture Pvt. Ltd.',
    tagline: 'Premium Architectural & Commercial Furnishings',
    gstin: '27AAACU9988E1Z4',
    state: 'Maharashtra (27)',
    address: 'Plot 42, Industrial Area, MIDC Phase 2, Pune, MH 411019, India',
    email: 'billing@urbanfurniture.in',
    phone: '+91 20 2740 0000',
    pan: 'AAACU9988E',
    bank: {
      name: 'HDFC Bank Ltd.',
      branch: 'MIDC Industrial Branch, Pune',
      accountName: 'Urban Furniture Pvt. Ltd.',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234',
    },
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setIsGenerating(true);
      generateVectorInvoicePdf(invoice);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not generate PDF. You can also use the Print button.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (val: number = 0) => {
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <PortalModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex="z-[75]"
      containerClassName="max-w-4xl"
      backdropClassName="p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static"
    >
      <div className="relative w-full bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:w-full print:my-0">
        
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
              className="text-xs gap-1.5 border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="text-xs gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-purple-600/20"
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
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors ml-2"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Capturable Document Container (pdfcn Modern Style) */}
        <div className="p-4 sm:p-6 overflow-x-auto bg-[#18181f] flex justify-center print:p-0 print:bg-white">
          <div
            ref={printAreaRef}
            id="pdfcn-document"
            className="w-full max-w-[794px] bg-white text-slate-900 p-10 font-sans shadow-lg rounded-sm text-[12px] leading-relaxed border border-slate-200 print:border-none print:shadow-none print:p-6"
            style={{ minHeight: '1120px' }}
          >
            {/* 1. Modern Branded Header */}
            <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block" />
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
                <div className="mt-1">
                  <span
                    className={`inline-block text-[9.5px] font-bold uppercase px-2 py-0.5 rounded border ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : invoice.status === 'approved'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : invoice.status === 'void'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    Status: {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Metadata Columns (pdfcn metaRow) */}
            <div className="grid grid-cols-4 gap-4 py-5 border-b border-slate-200">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Invoice Date
                </span>
                <span className="font-semibold text-slate-900 text-[11px]">
                  {invoice.invoice_date || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Payment Due Date
                </span>
                <span className="font-semibold text-slate-900 text-[11px]">
                  {invoice.due_date || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Place of Supply
                </span>
                <span className="font-semibold text-slate-900 text-[11px]">
                  {invoice.place_of_supply || partyState || 'Maharashtra (27)'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tax Mechanism
                </span>
                <span className="font-semibold text-slate-900 text-[10px] tracking-tight">
                  {invoice.is_interstate ? 'INTER-STATE (IGST 18%)' : 'INTRA-STATE (CGST 9% + SGST 9%)'}
                </span>
              </div>
            </div>

            {/* 3. Billed To / Shipped To Cards */}
            <div className="grid grid-cols-2 gap-8 py-5 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isCustomer ? 'Billed To (Customer)' : 'Billed By (Vendor)'}
                </span>
                <p className="font-bold text-slate-950 text-[12px]">{partyName}</p>
                <p className="text-slate-600 text-[10px]">{partyAddress}</p>
                <p className="text-[10px] text-slate-700">
                  <span className="font-semibold">State:</span> {partyState}
                </p>
                <p className="text-[10px] text-slate-800">
                  <span className="font-bold">GSTIN:</span>{' '}
                  <span className="font-mono">{partyGstin}</span>
                </p>
              </div>

              <div className="space-y-1 pl-4 border-l border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Shipment & Delivery Details
                </span>
                <p className="font-medium text-slate-800 text-[11px]">
                  {isCustomer ? 'Destination Delivery Facility' : 'Urban Furniture MIDC Central Hub'}
                </p>
                <p className="text-slate-600 text-[10px]">
                  {party?.shipping_address || partyAddress}
                </p>
                <p className="text-[10px] text-slate-700">
                  <span className="font-semibold">Dispatch Note:</span> In conformity with Section 31
                  of CGST Act 2017.
                </p>
              </div>
            </div>

            {/* 4. GST Line Items Table */}
            <div className="pt-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-2 px-1 text-center w-8">#</th>
                    <th className="py-2 px-2">Item & Description</th>
                    <th className="py-2 px-2 text-center w-16">HSN</th>
                    <th className="py-2 px-2 text-right w-12">Qty</th>
                    <th className="py-2 px-2 text-right w-20">Rate</th>
                    <th className="py-2 px-2 text-right w-20">Taxable</th>
                    {invoice.is_interstate ? (
                      <th className="py-2 px-2 text-right w-20">IGST</th>
                    ) : (
                      <>
                        <th className="py-2 px-2 text-right w-16">CGST</th>
                        <th className="py-2 px-2 text-right w-16">SGST</th>
                      </>
                    )}
                    <th className="py-2 px-2 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10.5px]">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => {
                      const name = item.product?.name || item.product_name || item.description || 'Item';
                      const hsn = item.product?.hsn_code || item.hsn_code || '9403';
                      const taxable = Number(item.taxable_amount || item.quantity * item.unit_price);
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-1 text-center text-slate-400 font-mono text-[9px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-slate-900 block">{name}</span>
                            {item.description && item.description !== name && (
                              <span className="text-[9.5px] text-slate-500">{item.description}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[9.5px] text-slate-600">
                            {hsn}
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold text-slate-800">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                            ₹{formatNumber(item.unit_price)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                            ₹{formatNumber(taxable)}
                          </td>
                          {invoice.is_interstate ? (
                            <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                              <span className="text-[8px] text-slate-400 block">
                                {item.igst_rate || 18}%
                              </span>
                              ₹{formatNumber(item.igst_amount || taxable * 0.18)}
                            </td>
                          ) : (
                            <>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                                <span className="text-[8px] text-slate-400 block">
                                  {item.cgst_rate || 9}%
                                </span>
                                ₹{formatNumber(item.cgst_amount || taxable * 0.09)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                                <span className="text-[8px] text-slate-400 block">
                                  {item.sgst_rate || 9}%
                                </span>
                                ₹{formatNumber(item.sgst_amount || taxable * 0.09)}
                              </td>
                            </>
                          )}
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-950">
                            ₹{formatNumber(item.total_amount)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                        No individual line items specified.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Summary & Tax Card Section */}
            <div className="grid grid-cols-2 gap-8 pt-6 mt-4 border-t border-slate-200">
              <div className="space-y-4">
                {/* Bank / Remittance Details */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Payment Instructions & Bank Account
                  </span>
                  <div className="text-[10px] space-y-1 text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Bank:</span> {company.bank.name}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Account No:</span>{' '}
                      <span className="font-mono font-bold">{company.bank.accountNumber}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">IFSC Code:</span>{' '}
                      <span className="font-mono font-bold">{company.bank.ifsc}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Branch:</span>{' '}
                      {company.bank.branch}
                    </p>
                  </div>
                </div>

                {/* Terms / Notes */}
                <div className="text-[9.5px] text-slate-500 leading-relaxed">
                  <p className="font-semibold text-slate-700 mb-0.5">Terms & Conditions:</p>
                  <p>1. Goods once sold will not be accepted back unless manufacturing defect reported in 48 hours.</p>
                  <p>2. Interest @ 18% p.a. will be levied on overdue payments past {invoice.due_date}.</p>
                  <p>3. Subject to Pune jurisdiction only.</p>
                </div>
              </div>

              {/* Totals Calculation Box */}
              <div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Taxable Value (Subtotal):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{formatNumber(invoice.subtotal)}
                    </span>
                  </div>

                  {invoice.is_interstate ? (
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>IGST (18%):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        ₹{formatNumber(invoice.igst_amount || invoice.tax_amount)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>CGST (9%):</span>
                        <span className="font-mono font-semibold text-slate-900">
                          ₹{formatNumber(invoice.cgst_amount || invoice.tax_amount / 2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>SGST (9%):</span>
                        <span className="font-mono font-semibold text-slate-900">
                          ₹{formatNumber(invoice.sgst_amount || invoice.tax_amount / 2)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-slate-300 pt-2.5 flex justify-between items-baseline">
                    <div>
                      <span className="text-[12px] font-black uppercase text-slate-950 block">
                        Total Invoice Value:
                      </span>
                      <span className="text-[9px] text-slate-500">Includes all applicable GST</span>
                    </div>
                    <span className="text-lg font-black text-slate-950 font-mono tracking-tight">
                      ₹{formatNumber(invoice.total_amount)}
                    </span>
                  </div>

                  {(invoice.amount_paid ?? 0) > 0 && (
                    <>
                      <div className="flex justify-between text-[10.5px] text-emerald-700 pt-1">
                        <span>Amount Received / Paid:</span>
                        <span className="font-mono font-bold">
                          - ₹{formatNumber(invoice.amount_paid)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-900 border-t border-dashed border-slate-200 pt-1">
                        <span>Balance Due:</span>
                        <span className="font-mono text-rose-600">
                          ₹{formatNumber(invoice.balance_due ?? (invoice.total_amount - (invoice.amount_paid || 0)))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Authorized Signature Stamp */}
                <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div className="text-[8.5px] text-slate-400">
                    <p>Computer Generated Invoice</p>
                    <p>Valid without physical signature under IT Act 2000</p>
                  </div>
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 w-36 mb-1" />
                    <span className="text-[9.5px] font-bold text-slate-800 uppercase block">
                      Authorized Signatory
                    </span>
                    <span className="text-[8.5px] text-slate-500">For Urban Furniture Pvt. Ltd.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Footer Note */}
            <div className="mt-10 pt-4 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
              Urban Furniture Platform · E-Invoice Generation · Thank you for your partnership!
            </div>
          </div>
        </div>

      </div>
    </PortalModal>
  );
};
