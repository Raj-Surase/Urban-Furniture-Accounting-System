import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CreditCard, CheckCircle2, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { invoicesApi } from '../lib/api';
import { ExcalidrawPaymentModal } from '../components/payments/ExcalidrawPaymentModal';
import { InvoiceStatus, InvoiceType } from '../types';

export const CustomerPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const fetchMyDocuments = async () => {
    setLoading(true);
    try {
      const res = await invoicesApi.list();
      setInvoices(res?.data || []);
    } catch (err) {
      console.error('Failed to load user portal invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDocuments();
  }, []);

  const handlePay = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentModalOpen(true);
  };

  const unpaid = invoices.filter((i) => i.balance_due > 0);
  const paid = invoices.filter((i) => i.balance_due <= 0);
  const totalDue = unpaid.reduce((sum, i) => sum + Number(i.balance_due), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#7042f4]/20 via-[#18181f] to-[#18181f] border border-[#7042f4]/30 shadow-obsidian-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30 inline-block mb-2">
            Client Self-Service Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-[#8a8a9a] mt-1">
            Review your outstanding invoices, bills, and execute dues payment directly online.
          </p>
        </div>

        <div className="text-left sm:text-right bg-[#121216]/80 p-4 rounded-xl border border-white/[0.08]">
          <span className="text-xs text-[#8a8a9a] block">Total Outstanding Dues</span>
          <span className="text-2xl font-mono font-extrabold text-white">
            ₹{totalDue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Invoices & Bills Table */}
      <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-obsidian-card space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#7042f4]" />
            <span>My Invoices & Settlements</span>
          </h2>
          <span className="text-xs text-[#8a8a9a] font-mono">
            {unpaid.length} Unpaid • {paid.length} Settled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141418] text-[#707080] border-b border-white/[0.08] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Document No.</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#7042f4]" />
                    <span>{inv.invoice_number}</span>
                  </td>
                  <td className="py-3 px-4 text-[#a0a0b0] font-mono">{inv.invoice_date}</td>
                  <td className="py-3 px-4 text-[#a0a0b0] font-mono">{inv.due_date}</td>
                  <td className="py-3 px-4 text-right font-mono text-white">
                    ₹{Number(inv.total_amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                    ₹{Number(inv.balance_due).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === InvoiceStatus.PAID
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.balance_due > 0 ? (
                      <button
                        onClick={() => handlePay(inv)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md mx-auto transition-all cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Dues</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#707080]">
                    No invoices recorded for your account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <ExcalidrawPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => fetchMyDocuments()}
          invoiceId={selectedInvoice.id}
          partnerName={selectedInvoice.customer?.name || user?.name || 'Customer'}
          amountDue={Number(selectedInvoice.balance_due)}
          mode={InvoiceType.INVOICE}
        />
      )}
    </div>
  );
};
