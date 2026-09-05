import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { paymentsApi, customersApi, vendorsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export interface PaymentsPageProps {
  openNew?: boolean;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ openNew = false }) => {
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
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
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

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchPayments();

    const handleRoleUpdated = () => {
      fetchPayments();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, []);

  // Deep linking and navigation support (Record Payment from Dashboard / Transactions)
  useEffect(() => {
    if (openNew || searchParams.get('new') === 'true') {
      setIsNewOpen(true);
    }
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [openNew, searchParams]);

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && payments.length > 0) {
      const found = payments.find(
        (p) => String(p.id) === String(idParam) || String(p.payment_number) === String(idParam)
      );
      if (found) {
        setDetailPayment(found);
      }
    }
  }, [searchParams, payments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    if (!partyId) {
      errors.party_id = `Please select a ${paymentType === 'customer_receipt' ? 'customer' : 'vendor'}.`;
    }

    const trimmedAmount = amount.trim();
    const numAmount = parseFloat(trimmedAmount);
    if (!trimmedAmount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0.';
    }

    if (!paymentDate) {
      errors.payment_date = 'Please select a payment date.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please complete all required fields correctly.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const isCust = paymentType === 'customer_receipt';
      await paymentsApi.create({
        type: isCust ? 'received' : 'made',
        party_type: isCust ? 'customer' : 'vendor',
        party_id: Number(partyId),
        payment_type: paymentType,
        customer_id: isCust ? Number(partyId) : null,
        vendor_id: !isCust ? Number(partyId) : null,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: reference.trim() || `TXN-${Date.now()}`,
        notes: notes.trim() || null,
        status: 'reconciled',
      });

      addToast({
        type: 'success',
        title: 'Payment Recorded & Reconciled',
        message: 'Auto double-entry posted between Cash & Bank and AR/AP ledgers.',
      });
      setIsNewOpen(false);
      setAmount('');
      setReference('');
      setNotes('');
      setFieldErrors({});
      setFormError(null);
      fetchPayments();
    } catch (err: any) {
      const formatted = formatApiError(err);
      setFormError(formatted.message);
      if (formatted.fieldErrors && Object.keys(formatted.fieldErrors).length > 0) {
        setFieldErrors(formatted.fieldErrors);
      }
      addToast({
        type: 'error',
        title: formatted.isValidationError ? 'Validation Failed' : 'Payment Error',
        message: formatted.message,
      });
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
    const isCustomerPayment = p.payment_type === 'customer_receipt' || p.type === 'received';
    const partyName = p.customer?.name || p.vendor?.name || p.party?.name || '';
    const matchesSearch =
      p.payment_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'customer_receipt' && isCustomerPayment) ||
      (typeFilter === 'vendor_payment' && !isCustomerPayment) ||
      p.payment_type === typeFilter ||
      p.type === typeFilter;
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
                <TableSkeleton rows={5} cols={8} />
              ) : filteredPayments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  colSpan={8}
                  title="No payments found"
                  description="Record a customer receipt or vendor payment to begin tracking transactions."
                  actionLabel="Record Payment"
                  onAction={() => setIsNewOpen(true)}
                  secondaryActionLabel={searchQuery || typeFilter !== 'all' ? 'Clear Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                  }}
                />
              ) : (
                filteredPayments.map((p) => {
                  const isInflow = p.payment_type === 'customer_receipt' || p.type === 'received';
                  const partyName = isInflow ? (p.customer?.name || p.party?.name) : (p.vendor?.name || p.party?.name);
                  const isCleared = p.status === 'reconciled' || p.status === 'cleared';

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
                            isCleared
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
      <PortalModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        zIndex="z-[60]"
        containerClassName="max-w-lg"
      >
        <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold">Record Payment Voucher</h3>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Voucher Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e: any) => {
                      setPaymentType(e.target.value);
                      setPartyId('');
                      if (fieldErrors.party_id) setFieldErrors((prev) => ({ ...prev, party_id: '' }));
                    }}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="customer_receipt">Customer Receipt (Inflow)</option>
                    <option value="vendor_payment">Vendor Disbursement (Outflow)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {paymentType === 'customer_receipt' ? 'Customer' : 'Vendor'} <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={partyId}
                    onChange={(e) => {
                      setPartyId(e.target.value ? Number(e.target.value) : '');
                      if (fieldErrors.party_id) setFieldErrors((prev) => ({ ...prev, party_id: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-[#1a1a22] border ${
                      fieldErrors.party_id ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-neutral-700 focus:border-emerald-500'
                    } rounded-lg text-xs text-white focus:outline-none`}
                  >
                    <option value="">Select party...</option>
                    {(paymentType === 'customer_receipt' ? customers : vendors).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.party_id && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.party_id}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Payment Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-[#1a1a22] border ${
                      fieldErrors.amount ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-neutral-700 focus:border-emerald-500'
                    } rounded-lg text-xs text-white font-mono font-bold focus:outline-none`}
                  />
                  {fieldErrors.amount && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.amount}</span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Payment Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => {
                      setPaymentDate(e.target.value);
                      if (fieldErrors.payment_date) setFieldErrors((prev) => ({ ...prev, payment_date: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-[#1a1a22] border ${
                      fieldErrors.payment_date ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-neutral-700 focus:border-emerald-500'
                    } rounded-lg text-xs text-white focus:outline-none`}
                  />
                  {fieldErrors.payment_date && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.payment_date}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Payment Method <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Narration / Notes</label>
                <textarea
                  placeholder="Optional payment narration or reference notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsNewOpen(false);
                    setAmount('');
                    setReference('');
                    setNotes('');
                    setFieldErrors({});
                    setFormError(null);
                  }}
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
      </PortalModal>

      {/* Payment Voucher Detail Modal */}
      <PortalModal
        isOpen={!!detailPayment}
        onClose={() => setDetailPayment(null)}
        zIndex="z-[60]"
        containerClassName="max-w-lg"
      >
        {detailPayment && (() => {
          const isDetailInflow = detailPayment.payment_type === 'customer_receipt' || detailPayment.type === 'received';
          const detailPartyName = detailPayment.customer?.name || detailPayment.vendor?.name || detailPayment.party?.name || 'General / Direct';
          const isDetailCleared = detailPayment.status === 'reconciled' || detailPayment.status === 'cleared';

          return (
          <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{detailPayment.payment_number}</span>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isDetailCleared
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {detailPayment.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {isDetailInflow ? 'Customer Collection Receipt' : 'Vendor Disbursement Voucher'}
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
              isDetailInflow
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/20'
            }`}>
              <div>
                <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  {isDetailInflow ? 'Receipt Inflow' : 'Disbursement Outflow'}
                </div>
                <div className="text-2xl font-mono font-bold text-white mt-0.5">
                  {isDetailInflow ? '+' : '-'}₹
                  {Number(detailPayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                isDetailInflow
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}>
                {detailPayment.payment_type?.replace('_', ' ') || (isDetailInflow ? 'customer receipt' : 'vendor payment')}
              </span>
            </div>

            {/* Detail Attributes */}
            <div className="space-y-3 bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl text-xs">
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <span className="text-neutral-500">Party Account:</span>
                  <div className="font-semibold text-white mt-0.5">
                    {detailPartyName}
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
          );
        })()}
      </PortalModal>
    </div>
  );
};

