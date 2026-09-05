import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { paymentsApi, customersApi, vendorsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PaymentsPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // New Payment Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'customer_receipt' | 'vendor_payment'>('customer_receipt');
  const [partyId, setPartyId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [payRes, custRes, vendRes] = await Promise.all([
        paymentsApi.list(),
        customersApi.list(),
        vendorsApi.list(),
      ]);
      setPayments(payRes.data || payRes || []);
      setCustomers(custRes.data || custRes || []);
      setVendors(vendRes.data || vendRes || []);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load payments.' });
    } finally {
      setLoading(false);
    }
  };

  // Detail Payment Modal State
  const [detailPayment, setDetailPayment] = useState<any>(null);

  useEffect(() => {
    fetchPayments();

    const handleRoleUpdated = () => {
      fetchPayments();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId || amount <= 0) {
      addToast({ type: 'warning', title: 'Validation', message: 'Please select a party and positive amount.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const isCust = paymentType === 'customer_receipt';
      await paymentsApi.create({
        payment_type: paymentType,
        customer_id: isCust ? partyId : null,
        vendor_id: !isCust ? partyId : null,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: reference || `TXN-${Date.now()}`,
        notes,
        status: 'reconciled', // Reconcile directly to post journal entry
      });

      addToast({
        type: 'success',
        title: 'Payment Recorded & Reconciled',
        message: 'Auto double-entry posted between Cash & Bank and AR/AP ledgers.',
      });
      setIsNewOpen(false);
      setAmount(0);
      setReference('');
      fetchPayments();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReconcile = async (id: number) => {
    try {
      await paymentsApi.reconcile(id);
      addToast({
        type: 'success',
        title: 'Reconciled & Posted',
        message: 'Journal entry created and ledgers balanced.',
      });
      fetchPayments();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payment_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || p.payment_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            Treasury & Payment Vouchers
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Customer collections, vendor disbursements, bank reconciliation, and cash ledger postings.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <Button
            onClick={() => setIsNewOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Record Payment Voucher
          </Button>
        )}
      </div>

      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search payment #, ref, party..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 w-72"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Transactions</option>
              <option value="customer_receipt">Customer Receipts (Inflow)</option>
              <option value="vendor_payment">Vendor Payments (Outflow)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Flow / Type</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Date & Ref</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 italic">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isInflow = p.payment_type === 'customer_receipt';
                  const partyName = isInflow ? p.customer?.name : p.vendor?.name;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setDetailPayment(p)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-emerald-400 group-hover:underline">{p.payment_number}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isInflow
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isInflow ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" /> Receipt (In)
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> Payment (Out)
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-200">{partyName || 'Direct'}</td>
                      <td className="py-3 px-4 text-neutral-400">
                        <div>{p.payment_date}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Ref: {p.reference_number || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-mono text-neutral-300">
                        {p.payment_method?.replace('_', ' ')}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                          isInflow ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isInflow ? '+' : '-'}₹
                        {Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            p.status === 'reconciled'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {p.status === 'draft' && (isAdmin || isManager) && (
                          <button
                            onClick={() => handleReconcile(p.id)}
                            className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                          >
                            Reconcile
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Payment Modal */}
      {isNewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <h3 className="text-base font-bold">Record Payment Voucher</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Voucher Type</label>
                  <select
                    value={paymentType}
                    onChange={(e: any) => {
                      setPaymentType(e.target.value);
                      setPartyId('');
                    }}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  >
                    <option value="customer_receipt">Customer Receipt (Inflow)</option>
                    <option value="vendor_payment">Vendor Disbursement (Outflow)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {paymentType === 'customer_receipt' ? 'Customer' : 'Vendor'}
                  </label>
                  <select
                    value={partyId}
                    onChange={(e) => setPartyId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  >
                    <option value="">Select party...</option>
                    {(paymentType === 'customer_receipt' ? customers : vendors).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="upi">UPI / Instant QR</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Reference / UTR #</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-554433221"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Narration / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewOpen(false)}
                  className="border-neutral-700 bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {isSubmitting ? 'Posting...' : 'Record & Reconcile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Voucher Detail Modal */}
      {detailPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white my-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{detailPayment.payment_number}</span>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      detailPayment.status === 'reconciled'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {detailPayment.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {detailPayment.payment_type === 'customer_receipt' ? 'Customer Collection Receipt' : 'Vendor Disbursement Voucher'}
                </h3>
              </div>
              <button
                onClick={() => setDetailPayment(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Amount Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              detailPayment.payment_type === 'customer_receipt'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/20'
            }`}>
              <div>
                <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  {detailPayment.payment_type === 'customer_receipt' ? 'Receipt Inflow' : 'Disbursement Outflow'}
                </div>
                <div className="text-2xl font-mono font-bold text-white mt-0.5">
                  {detailPayment.payment_type === 'customer_receipt' ? '+' : '-'}₹
                  {Number(detailPayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                detailPayment.payment_type === 'customer_receipt'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}>
                {detailPayment.payment_type?.replace('_', ' ')}
              </span>
            </div>

            {/* Detail Attributes */}
            <div className="space-y-3 bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl text-xs">
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <span className="text-neutral-500">Party Account:</span>
                  <div className="font-semibold text-white mt-0.5">
                    {detailPayment.customer?.name || detailPayment.vendor?.name || 'General / Direct'}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Date Processed:</span>
                  <div className="font-mono text-neutral-200 mt-0.5">{detailPayment.payment_date}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Payment Channel:</span>
                  <div className="font-mono uppercase text-neutral-200 mt-0.5">
                    {detailPayment.payment_method?.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Bank Reference / UTR:</span>
                  <div className="font-mono text-emerald-400 mt-0.5">{detailPayment.reference_number || 'N/A'}</div>
                </div>
              </div>

              {detailPayment.notes && (
                <div className="pt-2 border-t border-white/[0.06] text-neutral-400">
                  <span className="text-neutral-500 font-semibold">Ledger Narration:</span> {detailPayment.notes}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] text-neutral-500 font-mono">
                Voucher #{detailPayment.id}
              </div>
              <div className="flex items-center gap-2">
                {detailPayment.status === 'draft' && (isAdmin || isManager) && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await handleReconcile(detailPayment.id);
                      setDetailPayment(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Reconcile & Post
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailPayment(null)}
                  className="border-neutral-700 bg-neutral-800 text-neutral-300 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

