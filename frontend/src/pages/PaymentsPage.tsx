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
  X,
  Building2,
  FolderTree,
  Landmark,
  Receipt,
  Sparkles,
  IndianRupee,
  Zap,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { paymentsApi, customersApi, vendorsApi, accountsApi, invoicesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { TransactionLedgerTab } from '../components/payments/TransactionLedgerTab';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import {
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  InvoiceStatus,
  InvoiceType,
  ContactType,
  AccountClassification,
} from '../types';

const paymentFilterConfigs: FieldFilterConfig[] = [
  { key: 'payment_number', label: 'Payment #', type: 'text', placeholder: 'e.g. PAY-2026' },
  { key: 'party_name', label: 'Party / Entity', type: 'text', placeholder: 'Customer or vendor...' },
  { key: 'reference_number', label: 'Reference / UTR', type: 'text', placeholder: 'Ref / UTR...' },
  {
    key: 'payment_type',
    label: 'Flow / Type',
    type: 'select',
    options: [
      { label: 'Customer Receipts (Inflow)', value: PaymentType.CUSTOMER_RECEIPT },
      { label: 'Vendor Payments (Outflow)', value: PaymentType.VENDOR_PAYMENT },
    ],
  },
  {
    key: 'payment_method',
    label: 'Method',
    type: 'select',
    options: [
      { label: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER },
      { label: 'Cheque', value: PaymentMethod.CHEQUE },
      { label: 'Cash', value: PaymentMethod.CASH },
      { label: 'UPI / Razorpay', value: PaymentMethod.UPI },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Draft', value: PaymentStatus.DRAFT },
      { label: 'Posted', value: PaymentStatus.POSTED },
      { label: 'Reconciled', value: PaymentStatus.RECONCILED },
    ],
  },
  { key: 'payment_date', label: 'Date', type: 'date' },
  { key: 'amount', label: 'Amount', type: 'number', placeholder: 'Min ₹...' },
];

const paymentColumnDefs: ColumnFilterDef[] = [
  { key: 'payment_number', filterType: 'text', placeholder: 'Filter #...' },
  {
    key: 'payment_type',
    filterType: 'select',
    options: [
      { label: 'Customer Receipt', value: PaymentType.CUSTOMER_RECEIPT },
      { label: 'Vendor Payment', value: PaymentType.VENDOR_PAYMENT },
    ],
  },
  { key: 'party_name', filterType: 'text', placeholder: 'Filter entity...' },
  { key: 'payment_date', filterType: 'date' },
  {
    key: 'payment_method',
    filterType: 'select',
    options: [
      { label: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER },
      { label: 'Cheque', value: PaymentMethod.CHEQUE },
      { label: 'Cash', value: PaymentMethod.CASH },
      { label: 'UPI', value: PaymentMethod.UPI },
    ],
  },
  { key: 'amount', filterType: 'number', placeholder: 'Min amount...' },
  {
    key: 'status',
    filterType: 'select',
    options: [
      { label: 'Draft', value: PaymentStatus.DRAFT },
      { label: 'Posted', value: PaymentStatus.POSTED },
      { label: 'Reconciled', value: PaymentStatus.RECONCILED },
    ],
  },
  { key: 'actions', filterType: 'none' },
];

export interface PaymentsPageProps {
  openNew?: boolean;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ openNew = false }) => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [mainTab, setMainTab] = useState<'vouchers' | 'transactions'>('vouchers');

  // Detail Modal
  const [detailPayment, setDetailPayment] = useState<any>(null);

  // New Payment Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CUSTOMER_RECEIPT);
  const [partyId, setPartyId] = useState<number | ''>('');
  const [bankAccountId, setBankAccountId] = useState<number | ''>('');
  const [invoiceId, setInvoiceId] = useState<number | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>(PaymentMethod.BANK_TRANSFER);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [payRes, custRes, vendRes, accRes, invRes] = await Promise.all([
        paymentsApi.list(),
        customersApi.list(),
        vendorsApi.list(),
        accountsApi.list().catch(() => ({ data: [] })),
        invoicesApi.list().catch(() => ({ data: [] })),
      ]);
      setPayments(payRes?.data || payRes || []);
      setCustomers(custRes?.data || custRes || []);
      setVendors(vendRes?.data || vendRes || []);
      const accList = accRes?.data || accRes || [];
      setAccounts(Array.isArray(accList) ? accList : []);
      const invList = invRes?.data || invRes || [];
      setInvoices(Array.isArray(invList) ? invList : []);

      const defaultBank = (Array.isArray(accList) ? accList : []).find(
        (a: any) => a.code === '1110' || (a.type === AccountClassification.ASSET && a.name.toLowerCase().includes('bank'))
      );
      if (defaultBank && !bankAccountId) {
        setBankAccountId(defaultBank.id);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load payments.' });
    } finally {
      setLoading(false);
    }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchPayments();

    const handleRoleUpdated = () => {
      fetchPayments();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, []);

  // Deep linking and navigation support (Record Payment from Dashboard / Transactions / Invoices)
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'receive' || typeParam === PaymentType.CUSTOMER_RECEIPT) {
      setPaymentType(PaymentType.CUSTOMER_RECEIPT);
      setTypeFilter(PaymentType.CUSTOMER_RECEIPT);
    } else if (typeParam === 'send' || typeParam === PaymentType.VENDOR_PAYMENT) {
      setPaymentType(PaymentType.VENDOR_PAYMENT);
      setTypeFilter(PaymentType.VENDOR_PAYMENT);
    }

    const tabParam = searchParams.get('tab');
    if (tabParam === 'transactions' || tabParam === 'gateway' || tabParam === 'razorpay') {
      setMainTab('transactions');
    }

    const invIdParam = searchParams.get('invoice_id');
    if (invIdParam) {
      setInvoiceId(Number(invIdParam));
      setIsNewOpen(true);
    }

    const partyParam = searchParams.get('party_id');
    if (partyParam) {
      setPartyId(Number(partyParam));
    }

    const amountParam = searchParams.get('amount');
    if (amountParam) {
      setAmount(amountParam);
    }

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
      errors.party_id = `Please select a ${paymentType === PaymentType.CUSTOMER_RECEIPT ? 'customer' : 'vendor'}.`;
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
      const isCust = paymentType === PaymentType.CUSTOMER_RECEIPT;
      await paymentsApi.create({
        type: isCust ? 'received' : 'made',
        party_type: isCust ? ContactType.CUSTOMER : ContactType.VENDOR,
        party_id: Number(partyId),
        payment_type: paymentType,
        customer_id: isCust ? Number(partyId) : null,
        vendor_id: !isCust ? Number(partyId) : null,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: reference.trim() || `TXN-${Date.now()}`,
        bank_account_id: bankAccountId ? Number(bankAccountId) : undefined,
        invoice_id: invoiceId ? Number(invoiceId) : undefined,
        notes: notes.trim() || null,
        status: PaymentStatus.RECONCILED,
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
      setInvoiceId('');
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

  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);

  const preparedPayments = React.useMemo(() => {
    return payments.map((p) => ({
      ...p,
      party_name: p.customer?.name || p.vendor?.name || p.party?.name || '',
    }));
  }, [payments]);

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = paymentFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key,
          operator: cfg?.type === 'number' || cfg?.type === 'date' ? 'gte' : cfg?.type === 'select' ? 'equals' : 'contains',
          value: val.trim(),
        });
      }
    });
    if (typeFilter !== 'all') {
      merged.push({
        id: 'quick-type',
        field: 'payment_type',
        operator: 'equals',
        value: typeFilter,
      });
    }
    return merged;
  }, [activeFilters, columnFilters, typeFilter]);

  const filteredPayments = React.useMemo(() => {
    return filterItems(
      preparedPayments,
      searchQuery,
      ['payment_number', 'reference_number', 'party_name', 'notes'],
      allActiveFilters
    );
  }, [preparedPayments, searchQuery, allActiveFilters]);

  const {
    visibleItems: visiblePayments,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredPayments,
    pageSize: 15,
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

      {/* Top Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
        <button
          onClick={() => setMainTab('vouchers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            mainTab === 'vouchers'
              ? 'bg-[#18181f] text-white border border-white/10 shadow-sm'
              : 'text-[#8a8a9a] hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Treasury Vouchers ({payments.length})</span>
        </button>

        <button
          onClick={() => setMainTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            mainTab === 'transactions'
              ? 'bg-[#18181f] text-white border border-white/10 shadow-sm'
              : 'text-[#8a8a9a] hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Zap className="w-4 h-4 text-[#a855f7]" />
          <span>Razorpay Gateway Transactions</span>
        </button>
      </div>

      {mainTab === 'transactions' ? (
        <TransactionLedgerTab />
      ) : (
        <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
          <FieldFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search payment #, ref, party, notes..."
            filterConfigs={paymentFilterConfigs}
            activeFilters={activeFilters}
            onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
            onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
            onClearAll={() => {
              setSearchQuery('');
              setActiveFilters([]);
              setColumnFilters({});
              setTypeFilter('all');
            }}
            showColumnFilters={showColumnFilters}
            onToggleColumnFilters={() => setShowColumnFilters((prev) => !prev)}
            presets={{
              field: 'type',
              currentValue: typeFilter,
              onChange: setTypeFilter,
              options: [
                { label: 'All Transactions', value: 'all' },
                { label: 'Customer Receipts (Inflow)', value: PaymentType.CUSTOMER_RECEIPT },
                { label: 'Vendor Payments (Outflow)', value: PaymentType.VENDOR_PAYMENT },
              ],
            }}
          />

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
                {showColumnFilters && (
                  <ColumnFilterRow
                    columns={paymentColumnDefs}
                    values={columnFilters}
                    onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                  />
                )}
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {loading ? (
                  <TableSkeleton rows={5} cols={8} />
                ) : visiblePayments.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    colSpan={8}
                    title="No payments found"
                    description="Record a customer receipt or vendor payment to begin tracking transactions."
                    actionLabel="Record Payment"
                    onAction={() => setIsNewOpen(true)}
                    secondaryActionLabel={searchQuery || typeFilter !== 'all' || activeFilters.length > 0 ? 'Clear Filters' : undefined}
                    onSecondaryAction={() => {
                      setSearchQuery('');
                      setTypeFilter('all');
                      setActiveFilters([]);
                      setColumnFilters({});
                    }}
                  />
                ) : (
                  visiblePayments.map((p) => {
                    const isInflow = p.payment_type === PaymentType.CUSTOMER_RECEIPT || p.type === 'received';
                    const partyName = isInflow ? (p.customer?.name || p.party?.name) : (p.vendor?.name || p.party?.name);
                    const isCleared = p.status === PaymentStatus.RECONCILED || p.status === PaymentStatus.CLEARED;

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
                          {p.status === PaymentStatus.DRAFT && (isAdmin || isManager) && (
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
          <ScrollSentinel
            sentinelRef={sentinelRef}
            loadingMore={loadingMore}
            hasMore={hasMore}
            totalCount={totalCount}
            visibleCount={visiblePayments.length}
            onLoadMore={loadMore}
            entityName="payments"
          />
        </Card>
      )}

      {/* New Payment Modal */}
      <PortalModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        zIndex="z-[60]"
        containerClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  paymentType === PaymentType.CUSTOMER_RECEIPT
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Record Payment Voucher</h3>
                <p className="text-xs text-neutral-400">
                  Treasury cash/bank clearing, double-entry journal posting, and invoice settlement.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="flex-1">{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Voucher Type Segmented Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentType(PaymentType.CUSTOMER_RECEIPT);
                  setPartyId('');
                  setInvoiceId('');
                  if (fieldErrors.party_id) setFieldErrors((prev) => ({ ...prev, party_id: '' }));
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentType === PaymentType.CUSTOMER_RECEIPT
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : 'bg-[#1a1a22] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Customer Receipt (Inflow / AR)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType(PaymentType.VENDOR_PAYMENT);
                  setPartyId('');
                  setInvoiceId('');
                  if (fieldErrors.party_id) setFieldErrors((prev) => ({ ...prev, party_id: '' }));
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentType === PaymentType.VENDOR_PAYMENT
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-500/10'
                    : 'bg-[#1a1a22] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                Vendor Disbursement (Outflow / AP)
              </button>
            </div>

            {/* Party Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                {paymentType === PaymentType.CUSTOMER_RECEIPT ? 'Customer Account' : 'Supplier / Vendor Account'} <span className="text-rose-400">*</span>
              </label>
              <select
                value={partyId}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setPartyId(val);
                  setInvoiceId('');
                  if (fieldErrors.party_id) setFieldErrors((prev) => ({ ...prev, party_id: '' }));
                }}
                className={`w-full px-3 py-2 bg-[#1a1a22] border ${
                  fieldErrors.party_id ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-neutral-700 focus:border-emerald-500'
                } rounded-lg text-xs text-white focus:outline-none`}
              >
                <option value="">Select {paymentType === PaymentType.CUSTOMER_RECEIPT ? 'customer' : 'supplier'}...</option>
                {(paymentType === PaymentType.CUSTOMER_RECEIPT ? customers : vendors).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.gstin ? `(${p.gstin})` : ''} {p.state ? `— ${p.state}` : ''}
                  </option>
                ))}
              </select>
              {fieldErrors.party_id && (
                <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.party_id}</span>
              )}
            </div>

            {/* Selected Party Balance Strip */}
            {(() => {
              if (!partyId) return null;
              const selectedParty = (paymentType === PaymentType.CUSTOMER_RECEIPT ? customers : vendors).find(
                (p) => Number(p.id) === Number(partyId)
              );
              if (!selectedParty) return null;
              const bal = Number(selectedParty.outstanding_balance || 0);

              return (
                <div className="p-3 bg-[#17171e] border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400">Current Outstanding Balance:</span>
                    <span
                      className={`font-mono font-bold ${
                        bal > 0
                          ? paymentType === PaymentType.CUSTOMER_RECEIPT
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                          : 'text-neutral-300'
                      }`}
                    >
                      ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {bal > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(bal.toFixed(2))}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-200 text-[11px] font-medium border border-white/10 transition-colors"
                    >
                      Fill Full Balance
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Linked Open Invoices (Optional) */}
            {(() => {
              if (!partyId) return null;
              const partyInvoices = invoices.filter(
                (inv) =>
                  Number(inv.party_id) === Number(partyId) &&
                  (paymentType === PaymentType.CUSTOMER_RECEIPT
                    ? inv.type === InvoiceType.RECEIVABLE || inv.party_type === ContactType.CUSTOMER
                    : inv.type === InvoiceType.PAYABLE || inv.party_type === ContactType.VENDOR) &&
                  inv.status !== InvoiceStatus.PAID &&
                  inv.status !== InvoiceStatus.VOID
              );

              if (partyInvoices.length === 0) return null;

              return (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      Settle Specific Open Invoice (Optional)
                    </label>
                    <span className="text-[10.5px] text-neutral-500">{partyInvoices.length} open invoice(s)</span>
                  </div>
                  <select
                    value={invoiceId}
                    onChange={(e) => {
                      const invVal = e.target.value ? Number(e.target.value) : '';
                      setInvoiceId(invVal);
                      if (invVal) {
                        const targetInv = partyInvoices.find((i) => Number(i.id) === invVal);
                        if (targetInv) {
                          const due = Number(targetInv.balance_due || targetInv.grand_total || 0);
                          if (due > 0) setAmount(due.toFixed(2));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  >
                    <option value="">Direct On-Account Payment (Unlinked Advance)</option>
                    {partyInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} — Due: ₹{Number(inv.balance_due || inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Total: ₹{Number(inv.grand_total).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Payment Amount (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-500">₹</span>
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
                    className={`w-full pl-7 pr-3 py-2 bg-[#1a1a22] border ${
                      fieldErrors.amount ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-neutral-700 focus:border-emerald-500'
                    } rounded-lg text-xs text-white font-mono font-bold focus:outline-none`}
                  />
                </div>
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

            {/* Treasury & Bank Account Mapping */}
            <div className="p-3.5 bg-[#17171e] border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-neutral-200">Deposit To / Disburse From Treasury Ledger</span>
                <span className="text-[10px] text-neutral-500 ml-auto">Real-Time GL Double Entry</span>
              </div>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Default (1110 Cash & Bank)</option>
                {accounts
                  .filter((a) => a.type === AccountClassification.ASSET)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Payment Method & Dynamic Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Payment Method <span className="text-rose-400">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value={PaymentMethod.UPI}>UPI / Instant QR Payment</option>
                  <option value={PaymentMethod.CASH}>Cash Counter Voucher</option>
                  <option value={PaymentMethod.CHEQUE}>Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  {paymentMethod === PaymentMethod.BANK_TRANSFER
                    ? 'Bank UTR / Transaction Ref #'
                    : paymentMethod === PaymentMethod.UPI
                    ? 'UPI Reference ID'
                    : paymentMethod === PaymentMethod.CHEQUE
                    ? 'Cheque # & Issuing Bank'
                    : 'Cash Voucher #'}
                </label>
                <input
                  type="text"
                  placeholder={
                    paymentMethod === 'bank_transfer'
                      ? 'e.g. HDFCR520260905...'
                      : paymentMethod === 'upi'
                      ? 'e.g. 423910283921'
                      : paymentMethod === 'cheque'
                      ? 'e.g. CHQ-882014 (HDFC Bank)'
                      : 'e.g. CSH-VCH-0042'
                  }
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Narration / Notes */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Narration / Audit Notes</label>
              <textarea
                placeholder="e.g. Advance payment for PO-2026-003, verified by treasury manager."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsNewOpen(false);
                  setAmount('');
                  setReference('');
                  setNotes('');
                  setInvoiceId('');
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
                className={`text-white font-semibold shadow-md ${
                  paymentType === 'customer_receipt'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                {isSubmitting ? 'Posting Payment...' : 'Record & Reconcile'}
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
          const isDetailInflow = detailPayment.payment_type === PaymentType.CUSTOMER_RECEIPT || detailPayment.type === 'received';
          const detailPartyName = detailPayment.customer?.name || detailPayment.vendor?.name || detailPayment.party?.name || 'General / Direct';
          const isDetailCleared = detailPayment.status === PaymentStatus.RECONCILED || detailPayment.status === PaymentStatus.CLEARED;

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
                {detailPayment.status === PaymentStatus.DRAFT && (isAdmin || isManager) && (
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

