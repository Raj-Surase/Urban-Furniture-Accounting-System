import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CreditCard,
  Percent,
  AlertCircle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { invoicesApi, customersApi, vendorsApi, productsApi, paymentsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { InvoicePdfModal, InvoicePdfData } from '../components/pdf/InvoicePdfModal';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const InvoicesPage: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'vendor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // PDF Preview State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoicePdfData | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Row Tap Invoice Detail Modal State
  const [detailInvoice, setDetailInvoice] = useState<any>(null);

  // Create Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'customer' | 'vendor'>('customer');
  const [selectedPartyId, setSelectedPartyId] = useState<number | ''>('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<
    Array<{
      product_id: number | '';
      description: string;
      hsn_code: string;
      quantity: number;
      unit_price: number;
      gst_rate: number;
    }>
  >([{ product_id: '', description: '', hsn_code: '9403', quantity: 1, unit_price: 0, gst_rate: 18 }]);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payReference, setPayReference] = useState('');
  const [payFieldErrors, setPayFieldErrors] = useState<Record<string, string>>({});
  const [payFormError, setPayFormError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes, vendRes, prodRes] = await Promise.all([
        invoicesApi.list(),
        customersApi.list(),
        vendorsApi.list(),
        productsApi.list(),
      ]);
      setInvoices(invRes.data || invRes || []);
      setCustomers(custRes.data || custRes || []);
      setVendors(vendRes.data || vendRes || []);
      setProducts(prodRes.data || prodRes || []);
    } catch (err) {
      console.error('Failed to fetch invoice data:', err);
      addToast({
        type: 'error',
        title: 'Error loading invoices',
        message: 'Could not retrieve invoices and billing entities.',
      });
    } finally {
      setLoading(false);
    }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchData();

    const handleRoleUpdated = () => {
      fetchData();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, [user?.id, user?.role]);

  // Deep-link handling from Dashboard / Recent Transactions
  useEffect(() => {
    const idParam = searchParams.get('id');
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (idParam && invoices.length > 0) {
      const found = invoices.find(
        (inv) => inv && (String(inv.id) === String(idParam) || String(inv.invoice_number) === String(idParam))
      );
      if (found) {
        setDetailInvoice(found);
      }
    }
  }, [searchParams, invoices]);

  // Determine place of supply and interstate
  const selectedParty =
    createType === 'customer'
      ? customers.find((c) => c.id === Number(selectedPartyId))
      : vendors.find((v) => v.id === Number(selectedPartyId));

  const isInterstate =
    selectedParty?.state &&
    !selectedParty.state.toLowerCase().includes('maharashtra') &&
    !selectedParty.gstin?.startsWith('27');

  // Calculate live totals for new invoice
  const calculateTotals = () => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    lineItems.forEach((item) => {
      const lineTaxable = Number(item.quantity || 0) * Number(item.unit_price || 0);
      subtotal += lineTaxable;
      const rate = Number(item.gst_rate || 18);
      if (isInterstate) {
        totalIgst += (lineTaxable * rate) / 100;
      } else {
        totalCgst += (lineTaxable * (rate / 2)) / 100;
      }
    });

    if (!isInterstate) {
      totalSgst = totalCgst;
    }

    const taxAmount = totalCgst + totalSgst + totalIgst;
    const totalAmount = subtotal + taxAmount;

    return { subtotal, totalCgst, totalSgst, totalIgst, taxAmount, totalAmount };
  };

  const handleProductSelect = (index: number, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      product_id: prod.id,
      description: prod.name,
      hsn_code: prod.hsn_code || '9403',
      unit_price: createType === 'customer' ? Number(prod.price) : Number(prod.cost_price || prod.price * 0.7),
      gst_rate: Number(prod.gst_rate || 18),
    };
    setLineItems(updated);
  };

  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      { product_id: '', description: '', hsn_code: '9403', quantity: 1, unit_price: 0, gst_rate: 18 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);
    const errors: Record<string, string> = {};

    if (!selectedPartyId) {
      errors.party_id = `Please select a ${createType === 'customer' ? 'customer' : 'vendor'}.`;
    }

    const validItems = lineItems.filter((item) => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      errors.items = 'Please add at least one product line with valid quantity.';
    }

    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      addToast({ type: 'warning', title: 'Validation Error', message: 'Please correct the form fields before saving.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type: createType === 'customer' ? 'receivable' : 'payable',
        party_type: createType,
        party_id: Number(selectedPartyId),
        invoice_date: invoiceDate,
        due_date: dueDate,
        notes: notes.trim() || null,
        items: validItems.map((item) => ({
          product_id: item.product_id,
          description: item.description,
          hsn_code: item.hsn_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.gst_rate,
        })),
      };

      const res = await invoicesApi.create(payload);
      addToast({
        type: 'success',
        title: 'Invoice Draft Created',
        message: `${res.invoice_number || 'Invoice'} created in Draft status.`,
      });
      setIsCreateModalOpen(false);
      setCreateFieldErrors({});
      setCreateFormError(null);
      // Reset form
      setLineItems([{ product_id: '', description: '', hsn_code: '9403', quantity: 1, unit_price: 0, gst_rate: 18 }]);
      fetchData();
    } catch (err: any) {
      const formatted = formatApiError(err);
      setCreateFormError(formatted.message);
      if (formatted.fieldErrors && Object.keys(formatted.fieldErrors).length > 0) {
        setCreateFieldErrors(formatted.fieldErrors);
      }
      addToast({
        type: 'error',
        title: formatted.isValidationError ? 'Validation Failed' : 'Creation Failed',
        message: formatted.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Automatic Posting on Approval
  const handleApprove = async (id: number) => {
    try {
      const res = await invoicesApi.approve(id);
      addToast({
        type: 'success',
        title: 'Approved & Auto-Posted to General Ledger',
        message: `Invoice approved! Balanced journal entry ${res.journal_entry_id ? `#${res.journal_entry_id}` : ''} created automatically.`,
      });
      fetchData();
    } catch (err: any) {
      const formatted = formatApiError(err);
      addToast({
        type: 'error',
        title: 'Approval Failed',
        message: formatted.message,
      });
    }
  };

  // Void Invoice & Contra-Reversal
  const handleVoid = async (id: number) => {
    if (!confirm('Are you sure you want to void this invoice? A reversing journal contra-entry will be posted.')) {
      return;
    }
    try {
      await invoicesApi.void(id);
      addToast({
        type: 'warning',
        title: 'Invoice Voided',
        message: 'Invoice has been voided and reversing contra journal entry posted.',
      });
      fetchData();
    } catch (err: any) {
      const formatted = formatApiError(err);
      addToast({
        type: 'error',
        title: 'Void Failed',
        message: formatted.message,
      });
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayFormError(null);
    setPayFieldErrors({});

    if (!payInvoice) return;

    const trimmed = payAmount.trim();
    const numAmount = parseFloat(trimmed);
    if (!trimmed || isNaN(numAmount) || numAmount <= 0) {
      setPayFieldErrors({ amount: 'Please enter a valid payment amount greater than 0.' });
      addToast({ type: 'warning', title: 'Validation', message: 'Payment amount must be greater than 0.' });
      return;
    }

    try {
      setIsPaying(true);
      const isCust = payInvoice.type === 'receivable' || payInvoice.party_type === 'customer' || payInvoice.type === 'customer';
      const resolvedPartyId = payInvoice.party_id || (isCust ? payInvoice.customer_id : payInvoice.vendor_id);
      await paymentsApi.create({
        type: isCust ? 'received' : 'made',
        party_type: isCust ? 'customer' : 'vendor',
        party_id: resolvedPartyId ? Number(resolvedPartyId) : undefined,
        invoice_id: payInvoice.id,
        payment_type: isCust ? 'customer_receipt' : 'vendor_payment',
        customer_id: isCust ? Number(resolvedPartyId) : null,
        vendor_id: !isCust ? Number(resolvedPartyId) : null,
        amount: numAmount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: payMethod,
        reference_number: payReference.trim() || `TXN-${Date.now()}`,
        status: 'reconciled', // Reconcile to trigger auto journal posting
      });

      addToast({
        type: 'success',
        title: 'Payment Reconciled',
        message: `Recorded ₹${numAmount.toLocaleString('en-IN')} payment and posted journal entry.`,
      });
      setIsPayModalOpen(false);
      setPayInvoice(null);
      setPayAmount('');
      setPayFieldErrors({});
      setPayFormError(null);
      fetchData();
    } catch (err: any) {
      const formatted = formatApiError(err);
      setPayFormError(formatted.message);
      if (formatted.fieldErrors && Object.keys(formatted.fieldErrors).length > 0) {
        setPayFieldErrors(formatted.fieldErrors);
      }
      addToast({
        type: 'error',
        title: formatted.isValidationError ? 'Validation Failed' : 'Payment Failed',
        message: formatted.message,
      });
    } finally {
      setIsPaying(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const isCust = inv.type === 'receivable' || inv.party_type === 'customer' || inv.type === 'customer';
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'customer' && isCust) ||
      (activeTab === 'vendor' && !isCust);

    const party = isCust ? inv.customer : inv.vendor;
    const partyName = party?.company_name || party?.name || inv.party?.name || '';
    const matchesQuery =
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesTab && matchesQuery && matchesStatus;
  });

  // Calculate high level metrics
  const totalReceivables = invoices
    .filter((inv) => (inv.type === 'receivable' || inv.party_type === 'customer' || inv.type === 'customer') && (inv.status === 'approved' || inv.status === 'draft'))
    .reduce((sum, inv) => sum + Number(inv.balance_due ?? inv.total_amount), 0);

  const totalPayables = invoices
    .filter((inv) => (inv.type === 'payable' || inv.party_type === 'vendor' || inv.type === 'vendor') && (inv.status === 'approved' || inv.status === 'draft'))
    .reduce((sum, inv) => sum + Number(inv.balance_due ?? inv.total_amount), 0);

  const totalGst = invoices
    .filter((inv) => inv.status === 'approved' || inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);

  const pendingApprovals = invoices.filter((inv) => inv.status === 'draft').length;

  const currentTotals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-purple-400" />
            Invoices & GST Billing
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Accounts Receivable, Vendor Bills, Double-Entry Auto-Posting, and Tax Invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setCreateType('customer');
              setSelectedPartyId('');
              setCreateFieldErrors({});
              setCreateFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-2 shadow-lg shadow-purple-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Tax Invoice (AR)
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setCreateType('vendor');
              setSelectedPartyId('');
              setCreateFieldErrors({});
              setCreateFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 gap-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Vendor Bill (AP)
          </Button>
        </div>
      </div>

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#141418] border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Receivables (AR)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            ₹{totalReceivables.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Due from commercial buyers</p>
        </Card>

        <Card className="p-4 bg-[#141418] border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Payables (AP)</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            ₹{totalPayables.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Due to timber & hardware vendors</p>
        </Card>

        <Card className="p-4 bg-[#141418] border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">GST Collected / Input</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            ₹{totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Total CGST + SGST + IGST</p>
        </Card>

        <Card className="p-4 bg-[#141418] border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Pending Approvals</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-400 mt-2 font-mono">{pendingApprovals}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Require Manager / Admin approval</p>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        {/* Filter Navigation Bar */}
        <div className="p-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'customer'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Customer Invoices (AR)
            </button>
            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vendor'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Vendor Bills (AP)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search invoice or party..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 w-52 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Entity & GSTIN</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">GST (₹)</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <TableSkeleton rows={6} cols={9} />
              ) : filteredInvoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  colSpan={9}
                  title="No matching invoices found"
                  description="Try adjusting your filters or search query, or create a new invoice or vendor bill."
                  actionLabel="New Invoice"
                  onAction={() => setIsCreateModalOpen(true)}
                  secondaryActionLabel={searchQuery || activeTab !== 'all' || statusFilter !== 'all' ? 'Clear Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                    setStatusFilter('all');
                  }}
                />
              ) : (
                filteredInvoices.map((inv) => {
                  const isCust = inv.type === 'receivable' || inv.party_type === 'customer' || inv.type === 'customer';
                  const party = isCust ? inv.customer : inv.vendor;
                  const partyName = party?.company_name || party?.name || inv.party?.name || (isCust ? 'Customer' : 'Vendor');

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setDetailInvoice(inv)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                        <span>{inv.invoice_number}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isCust
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {isCust ? 'Tax Invoice' : 'Vendor Bill'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-200">{partyName}</div>
                        <div className="text-[10.5px] text-neutral-500 font-mono">
                          {party?.gstin || 'Unregistered'} · {inv.place_of_supply || 'MH'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-neutral-400">
                        <div>Date: {inv.invoice_date}</div>
                        <div className="text-[10.5px] text-neutral-500">Due: {inv.due_date}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-neutral-300">
                        ₹{Number(inv.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-neutral-400">
                        ₹{Number(inv.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        <span className="text-[10px] text-neutral-500 block">
                          {inv.is_interstate ? 'IGST' : 'CGST+SGST'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        {(inv.amount_paid ?? 0) > 0 && (
                          <span className="text-[10px] text-emerald-400 block font-normal">
                            Paid: ₹{Number(inv.amount_paid).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : inv.status === 'approved'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : inv.status === 'void'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* pdfcn PDF Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                              setIsPdfModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600 hover:text-white text-neutral-300 transition-colors cursor-pointer"
                            title="Generate & View PDF (pdfcn)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approve & Auto-Post Button */}
                          {inv.status === 'draft' && (isAdmin || isManager) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(inv.id);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Approve and Auto-Post to General Ledger"
                            >
                              Approve & Post
                            </button>
                          )}

                          {/* Record Payment Button */}
                          {inv.status === 'approved' && (inv.balance_due === undefined || inv.balance_due > 0) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPayInvoice(inv);
                                setPayAmount(String(inv.balance_due ?? inv.total_amount ?? ''));
                                setPayFieldErrors({});
                                setPayFormError(null);
                                setIsPayModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Record Payment & Reconcile"
                            >
                              Pay
                            </button>
                          )}

                          {/* Void Button */}
                          {inv.status === 'approved' && (isAdmin || isManager) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoid(inv.id);
                              }}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-600 hover:text-white text-neutral-400 transition-colors cursor-pointer"
                              title="Void Invoice (Auto Contra-Reversal)"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PDF Modal Styled with pdfcn principles */}
      <InvoicePdfModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      {/* Create Invoice / Bill Modal */}
      <PortalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        zIndex="z-[60]"
        containerClassName="max-w-3xl"
      >
        <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121216]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold">
                  Create {createType === 'customer' ? 'Customer Tax Invoice (AR)' : 'Vendor Bill (AP)'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-6">
              {createFormError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{createFormError}</span>
                </div>
              )}

              {/* Party selection & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {createType === 'customer' ? 'Customer (Buyer)' : 'Vendor (Supplier)'} <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedPartyId}
                    onChange={(e) => {
                      setSelectedPartyId(Number(e.target.value));
                      if (createFieldErrors.party_id) {
                        setCreateFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.party_id;
                          return next;
                        });
                      }
                    }}
                    required
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                      createFieldErrors.party_id
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-purple-500'
                    }`}
                  >
                    <option value="">Select party...</option>
                    {(createType === 'customer' ? customers : vendors).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gstin || 'No GSTIN'}) - {p.state || 'MH'}
                      </option>
                    ))}
                  </select>
                  {createFieldErrors.party_id && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{createFieldErrors.party_id}</span>
                  )}
                  {selectedParty && (
                    <div className="text-[10px] text-neutral-400 mt-1">
                      GSTIN: {selectedParty.gstin || 'Unregistered'} · Supply: {selectedParty.state || 'MH'} (
                      {isInterstate ? 'Inter-state IGST' : 'Intra-state CGST+SGST'})
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Invoice Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => {
                      setInvoiceDate(e.target.value);
                      if (createFieldErrors.invoice_date) {
                        setCreateFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.invoice_date;
                          return next;
                        });
                      }
                    }}
                    required
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                      createFieldErrors.invoice_date
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-purple-500'
                    }`}
                  />
                  {createFieldErrors.invoice_date && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{createFieldErrors.invoice_date}</span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Due Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      if (createFieldErrors.due_date) {
                        setCreateFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.due_date;
                          return next;
                        });
                      }
                    }}
                    required
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                      createFieldErrors.due_date
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-purple-500'
                    }`}
                  />
                  {createFieldErrors.due_date && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{createFieldErrors.due_date}</span>
                  )}
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Line Items & GST Breakdown <span className="text-rose-400">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    + Add Item
                  </button>
                </div>
                {createFieldErrors.items && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createFieldErrors.items}</span>
                  </div>
                )}

                <div className="border border-neutral-800 rounded-xl overflow-hidden bg-[#181820]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 text-[10px] uppercase">
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-2 w-20">HSN</th>
                        <th className="py-2.5 px-2 w-16 text-right">Qty</th>
                        <th className="py-2.5 px-2 w-24 text-right">Price (₹)</th>
                        <th className="py-2.5 px-2 w-16 text-right">GST %</th>
                        <th className="py-2.5 px-2 w-28 text-right">Total (₹)</th>
                        <th className="py-2.5 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {lineItems.map((line, idx) => {
                        const lineTaxable = Number(line.quantity || 0) * Number(line.unit_price || 0);
                        const lineTax = (lineTaxable * Number(line.gst_rate || 18)) / 100;
                        const lineTotal = lineTaxable + lineTax;

                        return (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="py-2 px-3">
                              <select
                                value={line.product_id}
                                onChange={(e) => handleProductSelect(idx, Number(e.target.value))}
                                required
                                className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white"
                              >
                                <option value="">Select product SKU...</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={line.hsn_code}
                                onChange={(e) => {
                                  const updated = [...lineItems];
                                  updated[idx].hsn_code = e.target.value;
                                  setLineItems(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white font-mono text-center"
                              />
                            </td>

                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={line.quantity === 0 ? '' : line.quantity}
                                onChange={(e) => {
                                  const updated = [...lineItems];
                                  const val = e.target.value;
                                  updated[idx].quantity = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                  setLineItems(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white text-right"
                              />
                            </td>

                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={line.unit_price === 0 ? '' : line.unit_price}
                                onChange={(e) => {
                                  const updated = [...lineItems];
                                  const val = e.target.value;
                                  updated[idx].unit_price = val === '' ? 0 : Number(val);
                                  setLineItems(updated);
                                }}
                                className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white text-right font-mono"
                              />
                            </td>

                            <td className="py-2 px-2 text-right">
                              <select
                                value={line.gst_rate}
                                onChange={(e) => {
                                  const updated = [...lineItems];
                                  updated[idx].gst_rate = Number(e.target.value);
                                  setLineItems(updated);
                                }}
                                className="w-full px-1 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white text-right"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>

                            <td className="py-2 px-2 text-right font-mono font-bold text-white">
                              ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-2 px-2 text-center">
                              {lineItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-neutral-500 hover:text-rose-400"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Notes & Terms</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="bg-[#181820] p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono text-white">
                      ₹{currentTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isInterstate ? (
                    <div className="flex justify-between text-neutral-400">
                      <span>IGST (18%):</span>
                      <span className="font-mono text-white">
                        ₹{currentTotals.totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-neutral-400">
                        <span>CGST (9%):</span>
                        <span className="font-mono text-white">
                          ₹{currentTotals.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>SGST (9%):</span>
                        <span className="font-mono text-white">
                          ₹{currentTotals.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-neutral-700 pt-2 flex justify-between items-center font-bold text-sm text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-purple-400 text-base">
                      ₹{currentTotals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-neutral-700 bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  {isSubmitting ? 'Creating...' : 'Save Draft Invoice'}
                </Button>
              </div>
            </form>
          </div>
      </PortalModal>

      {/* Record Payment Modal */}
      <PortalModal
        isOpen={isPayModalOpen && !!payInvoice}
        onClose={() => setIsPayModalOpen(false)}
        zIndex="z-[70]"
        containerClassName="max-w-md"
      >
        {payInvoice && (
          <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121216]">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Record Payment</h3>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {payFormError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{payFormError}</span>
                </div>
              )}

              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs space-y-1">
                <div className="text-neutral-400">
                  Invoice No: <span className="font-mono font-bold text-white">{payInvoice?.invoice_number}</span>
                </div>
                <div className="text-neutral-400">
                  Party: <span className="font-semibold text-white">{payInvoice?.customer?.name || payInvoice?.vendor?.name}</span>
                </div>
                <div className="text-neutral-400">
                  Balance Due: <span className="font-mono font-bold text-emerald-400">₹{Number(payInvoice?.balance_due ?? payInvoice?.total_amount ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Payment Amount (₹) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    if (payFieldErrors.amount) {
                      setPayFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.amount;
                        return next;
                      });
                    }
                  }}
                  required
                  className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none font-mono font-bold ${
                    payFieldErrors.amount
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-emerald-500'
                  }`}
                />
                {payFieldErrors.amount && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{payFieldErrors.amount}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="upi">UPI / Instant QR</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-987654321"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPayModalOpen(false)}
                  className="border-neutral-700 bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPaying}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {isPaying ? 'Recording...' : 'Confirm Payment & Reconcile'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </PortalModal>

      {/* Invoice Detail Modal on Tap Row */}
      <PortalModal
        isOpen={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        zIndex="z-[60]"
        containerClassName="max-w-3xl"
      >
        {detailInvoice && (
          <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-white/[0.06] pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white font-mono">{detailInvoice.invoice_number}</h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      detailInvoice.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : detailInvoice.status === 'approved'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : detailInvoice.status === 'void'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {detailInvoice.status}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      detailInvoice.type === 'receivable' || detailInvoice.party_type === 'customer'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {detailInvoice.type === 'receivable' || detailInvoice.party_type === 'customer' ? 'Tax Invoice (AR)' : 'Vendor Bill (AP)'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Issued to {detailInvoice.customer?.company_name || detailInvoice.customer?.name || detailInvoice.vendor?.company_name || detailInvoice.vendor?.name || detailInvoice.party?.name || 'Party'}
                </p>
              </div>

              <button
                onClick={() => setDetailInvoice(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05]"
              >
                ✕
              </button>
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#1a1a22] border border-white/[0.06] text-xs">
              <div>
                <span className="text-[#8e8e9f] block text-[11px]">Invoice Date</span>
                <span className="font-mono font-semibold text-white mt-0.5 block">{detailInvoice.invoice_date}</span>
              </div>
              <div>
                <span className="text-[#8e8e9f] block text-[11px]">Payment Due Date</span>
                <span className="font-mono font-semibold text-white mt-0.5 block">{detailInvoice.due_date}</span>
              </div>
              <div>
                <span className="text-[#8e8e9f] block text-[11px]">GSTIN</span>
                <span className="font-mono text-purple-300 mt-0.5 block">
                  {detailInvoice.customer?.gstin || detailInvoice.vendor?.gstin || detailInvoice.gstin || 'Unregistered'}
                </span>
              </div>
              <div>
                <span className="text-[#8e8e9f] block text-[11px]">Place of Supply</span>
                <span className="text-neutral-300 mt-0.5 block">{detailInvoice.place_of_supply || 'Maharashtra (27)'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8e8e9f] font-mono">
                Itemized GST Line Items
              </span>
              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#1a1a22]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#20202a] text-[#8e8e9f] text-[10.5px] uppercase font-mono border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3 text-center">HSN</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Taxable</th>
                      <th className="py-2.5 px-3 text-right">GST (₹)</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(detailInvoice.items || []).map((item: any, idx: number) => {
                      const qty = Number(item.quantity || 1);
                      const unitPrice = Number(item.unit_price || 0);
                      const taxable = qty * unitPrice;
                      const taxAmt = Number(item.tax_amount || 0);
                      const total = Number(item.line_total || (taxable + taxAmt));
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-medium text-white">{item.description || item.product?.name || 'Item'}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-neutral-400">{item.hsn_code || '9403'}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{qty}</td>
                          <td className="py-2.5 px-3 text-right font-mono">₹{unitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-neutral-300">₹{taxable.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-300">₹{taxAmt.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">₹{total.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-[#1a1a22] border border-white/[0.06] gap-4">
              <div className="text-xs text-neutral-400 space-y-1">
                {detailInvoice.notes && <p><strong>Notes:</strong> {detailInvoice.notes}</p>}
                <p className="text-[11px] text-[#8e8e9f]">General Ledger sync: Double-entry balanced posting with auto reverse on void.</p>
              </div>
              <div className="w-full sm:w-64 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span>₹{Number(detailInvoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-purple-300">
                  <span>GST ({detailInvoice.is_interstate ? 'IGST' : 'CGST+SGST'}):</span>
                  <span>₹{Number(detailInvoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-white/10 pt-1 text-sm">
                  <span>Total Amount:</span>
                  <span>₹{Number(detailInvoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span>Amount Paid:</span>
                  <span>₹{Number(detailInvoice.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-400 text-xs">
                  <span>Balance Due:</span>
                  <span>₹{Number(detailInvoice.balance_due ?? detailInvoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedInvoice(detailInvoice);
                    setIsPdfModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View & Print PDF (pdfcn)
                </button>

                {detailInvoice.status === 'draft' && (isAdmin || isManager) && (
                  <button
                    onClick={async () => {
                      await handleApprove(detailInvoice.id);
                      setDetailInvoice(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve & Auto-Post
                  </button>
                )}

                {detailInvoice.status === 'approved' && (detailInvoice.balance_due === undefined || detailInvoice.balance_due > 0) && (
                  <button
                    onClick={() => {
                      setPayInvoice(detailInvoice);
                      setPayAmount(String(detailInvoice.balance_due ?? detailInvoice.total_amount ?? ''));
                      setPayFieldErrors({});
                      setPayFormError(null);
                      setIsPayModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                )}

                {detailInvoice.status === 'approved' && (isAdmin || isManager) && (
                  <button
                    onClick={async () => {
                      await handleVoid(detailInvoice.id);
                      setDetailInvoice(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Void Invoice
                  </button>
                )}
              </div>

              <button
                onClick={() => setDetailInvoice(null)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </PortalModal>
    </div>
  );
};

