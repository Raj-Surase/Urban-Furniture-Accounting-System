import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Check,
  CreditCard,
  RotateCcw,
  ArrowLeft,
  ExternalLink,
  Building2,
  Trash2,
  Calendar,
  Layers,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { BudgetExceededAlert } from '../components/common/BudgetExceededAlert';
import { invoicesApi, vendorsApi, productsApi, accountsApi, analyticAccountsApi, purchaseOrdersApi, budgetsApi } from '../lib/api';
import { ExcalidrawPaymentModal } from '../components/payments/ExcalidrawPaymentModal';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import { InvoiceStatus, InvoiceType, ContactType, BudgetStatus, BudgetLineType, AccountClassification } from '../types';

const billFilterConfigs: FieldFilterConfig[] = [
  { key: 'invoice_number', label: 'Bill #', type: 'text', placeholder: 'e.g. BILL-2026' },
  { key: 'vendor.name', label: 'Vendor Name', type: 'text', placeholder: 'Vendor name...' },
  { key: 'notes', label: 'Bill Reference', type: 'text', placeholder: 'Reference notes...' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Draft', value: InvoiceStatus.DRAFT },
      { label: 'Approved', value: InvoiceStatus.APPROVED },
      { label: 'Paid', value: InvoiceStatus.PAID },
      { label: 'Void', value: InvoiceStatus.VOID },
    ],
  },
  { key: 'invoice_date', label: 'Bill Date', type: 'date' },
  { key: 'due_date', label: 'Due Date', type: 'date' },
  { key: 'total_amount', label: 'Total Amount', type: 'number', placeholder: 'Min ₹...' },
  { key: 'balance_due', label: 'Amount Due', type: 'number', placeholder: 'Min ₹...' },
];

const billColumnDefs: ColumnFilterDef[] = [
  { key: 'invoice_number', filterType: 'text', placeholder: 'Filter #...' },
  { key: 'vendor.name', filterType: 'text', placeholder: 'Filter vendor...' },
  { key: 'notes', filterType: 'text', placeholder: 'Filter ref...' },
  { key: 'invoice_date', filterType: 'date' },
  { key: 'total_amount', filterType: 'number', placeholder: 'Min total...' },
  { key: 'balance_due', filterType: 'number', placeholder: 'Min due...' },
  {
    key: 'status',
    filterType: 'select',
    options: [
      { label: 'Draft', value: InvoiceStatus.DRAFT },
      { label: 'Approved', value: InvoiceStatus.APPROVED },
      { label: 'Paid', value: InvoiceStatus.PAID },
      { label: 'Void', value: InvoiceStatus.VOID },
    ],
  },
];

export const VendorBillsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bills, setBills] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'form'>('list');
  const [search, setSearch] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [activeBill, setActiveBill] = useState<any | null>(null);
  const [vendorId, setVendorId] = useState<string>('');
  const [billReference, setBillReference] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [originatingPoId, setOriginatingPoId] = useState<number | null>(null);
  const [lines, setLines] = useState<any[]>([
    { product_id: '', quantity: 1, unit_price: 0, tax_rate: 18, account_id: '', analytic_account_id: '' }
  ]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);

  const defaultPurchaseAccount = accounts.find((a) =>
    a.name.toLowerCase().includes('purchase') || a.code === '5001' || a.code === '5100'
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, vRes, pRes, aRes, anRes, bgRes] = await Promise.all([
        invoicesApi.list({ type: InvoiceType.PAYABLE, search: search || undefined }),
        vendorsApi.list(),
        productsApi.list(),
        accountsApi.list(),
        analyticAccountsApi.list(),
        budgetsApi.list().catch(() => ({ data: [] })),
      ]);
      setBills(bRes?.data || []);
      setVendors(vRes?.data || []);
      setProducts(pRes?.data || []);
      setAccounts(aRes?.data || []);
      setAnalytics(anRes?.data || []);
      setBudgets(bgRes?.data || []);
    } catch (err) {
      console.error('Failed to load vendor bills data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically calculate budget limit exceedances for current bill lines
  const exceededBillBudgets = React.useMemo(() => {
    if (!budgets.length || !lines.length) return [];

    // Sum proposed line costs by analytic_account_id
    const proposedPerAnalytic: Record<number, number> = {};
    lines.forEach((l) => {
      if (!l.analytic_account_id) return;
      const anId = Number(l.analytic_account_id);
      const subtotal = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0);
      proposedPerAnalytic[anId] = (proposedPerAnalytic[anId] || 0) + subtotal;
    });

    const exceeded: Array<{
      analyticId: number;
      analyticName: string;
      budgetName: string;
      budgetId: number;
      committed: number;
      currentAchieved: number;
      proposed: number;
      projected: number;
      exceededBy: number;
      percentage: number;
    }> = [];

    budgets.forEach((b: any) => {
      if (b.status === BudgetStatus.CANCELLED) return;
      const bLines = b.lines || [];
      bLines.forEach((bl: any) => {
        if (bl.type !== BudgetLineType.EXPENSE) return;
        const anId = Number(bl.analytic_account_id);
        if (proposedPerAnalytic[anId] !== undefined) {
          const committed = Number(bl.committed_amount) || 0;
          const currentAchieved = Number(bl.achieved_amount) || 0;
          const proposed = proposedPerAnalytic[anId] || 0;
          const projected = currentAchieved + proposed;

          if (committed > 0 && projected > committed) {
            const analyticObj = analytics.find((a) => a.id === anId) || bl.analytic_account;
            exceeded.push({
              budgetId: b.id,
              budgetName: b.name,
              analyticId: anId,
              analyticName: analyticObj?.name || bl.analytic_account?.name || `Analytic #${anId}`,
              committed,
              currentAchieved,
              proposed,
              projected,
              exceededBy: Math.round(projected - committed),
              percentage: Math.round((projected / committed) * 100),
            });
          }
        }
      });
    });

    return exceeded;
  }, [budgets, lines, analytics]);

  const exceededAnalyticIds = React.useMemo(() => {
    return new Set(exceededBillBudgets.map((eb) => eb.analyticId));
  }, [exceededBillBudgets]);

  useEffect(() => {
    fetchData();
  }, [search]);

  // Check URL params for prefilling from a Purchase Order
  useEffect(() => {
    const poIdParam = searchParams.get('from_po');
    if (poIdParam) {
      const vId = searchParams.get('vendor_id') || '';
      const ref = searchParams.get('po_number') || '';
      setOriginatingPoId(parseInt(poIdParam, 10));
      setVendorId(vId);
      setBillReference(ref);
      setViewMode('form');

      purchaseOrdersApi.get(parseInt(poIdParam, 10)).then((res: any) => {
        const poData = res?.data || res;
        if (poData && poData.items && poData.items.length > 0) {
          setLines(
            poData.items.map((it: any) => ({
              product_id: it.product_id,
              account_id: defaultPurchaseAccount?.id || '',
              analytic_account_id: it.analytic_account_id || '',
              quantity: it.quantity,
              unit_price: it.unit_price,
              description: it.product?.name || `PO Line Item`,
            }))
          );
        }
      }).catch((err) => console.error('Failed to prefill bill lines from PO:', err));
    }
  }, [searchParams, defaultPurchaseAccount?.id]);

  const handleOpenForm = (bill?: any) => {
    setError(null);
    if (bill) {
      setActiveBill(bill);
      setVendorId(bill.party_id?.toString() || '');
      setBillReference(bill.reference_id ? `PO-${bill.reference_id}` : bill.notes || '');
      setBillDate(bill.invoice_date);
      setDueDate(bill.due_date);
      setOriginatingPoId(bill.reference_type === 'purchase_order' ? bill.reference_id : null);
      setLines(
        bill.items?.map((it: any) => ({
          product_id: it.product_id,
          account_id: it.account_id || defaultPurchaseAccount?.id,
          analytic_account_id: it.analytic_account_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          description: it.description,
        })) || []
      );
    } else {
      setActiveBill(null);
      setVendorId(vendors[0]?.id ? vendors[0].id.toString() : '');
      setBillReference('');
      setBillDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date().toISOString().split('T')[0]);
      setOriginatingPoId(null);
      setLines([
        {
          product_id: products[0]?.id,
          account_id: defaultPurchaseAccount?.id,
          analytic_account_id: analytics[0]?.id,
          quantity: 1,
          unit_price: products[0]?.cost || 1000,
          description: products[0]?.name || 'Furniture Component',
        },
      ]);
    }
    setViewMode('form');
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        product_id: products[0]?.id,
        account_id: defaultPurchaseAccount?.id,
        analytic_account_id: analytics[0]?.id,
        quantity: 1,
        unit_price: 1000,
        description: 'Vendor line item',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'product_id') {
      const prod = products.find((p) => p.id === val);
      if (prod) {
        updated[idx].unit_price = prod.cost || prod.sales_price || 0;
        updated[idx].description = prod.name;
      }
    }
    setLines(updated);
  };

  const calculateTotal = () => {
    return lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!vendorId) {
      setError('Please select a Vendor.');
      setSaving(false);
      return;
    }

    if (lines.length === 0) {
      setError('Please add at least one line item.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        type: InvoiceType.PAYABLE,
        party_type: ContactType.VENDOR,
        party_id: parseInt(vendorId, 10),
        reference_type: originatingPoId ? 'purchase_order' : null,
        reference_id: originatingPoId,
        invoice_date: billDate,
        due_date: dueDate,
        notes: billReference,
        items: lines.map((l) => ({
          product_id: l.product_id,
          account_id: l.account_id || defaultPurchaseAccount?.id,
          analytic_account_id: l.analytic_account_id,
          description: l.description,
          quantity: parseFloat(l.quantity) || 1,
          unit_price: parseFloat(l.unit_price) || 0,
        })),
      };

      const res = await invoicesApi.create(payload);
      setActiveBill(res.data);
      await fetchData();
      setViewMode('list');
    } catch (err: any) {
      console.error('Failed to save vendor bill:', err);
      setError(err?.response?.data?.message || 'Failed to save Vendor Bill.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmBill = async () => {
    if (!activeBill) return;
    setSaving(true);
    try {
      await invoicesApi.approve(activeBill.id);
      await fetchData();
      const updated = await invoicesApi.get(activeBill.id);
      setActiveBill(updated.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to confirm Bill.');
    } finally {
      setSaving(false);
    }
  };

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = billFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key,
          operator: cfg?.type === 'number' || cfg?.type === 'date' ? 'gte' : cfg?.type === 'select' ? 'equals' : 'contains',
          value: val.trim(),
        });
      }
    });
    if (statusFilter !== 'all') {
      merged.push({
        id: 'quick-status',
        field: 'status',
        operator: 'equals',
        value: statusFilter,
      });
    }
    return merged;
  }, [activeFilters, columnFilters, statusFilter]);

  const filteredBills = React.useMemo(() => {
    return filterItems(bills, search, ['invoice_number', 'vendor.name', 'notes'], allActiveFilters);
  }, [bills, search, allActiveFilters]);

  const {
    visibleItems: visibleBills,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredBills,
    pageSize: 15,
  });

  const vendorName = vendors.find((v) => v.id === parseInt(vendorId, 10))?.name || activeBill?.vendor?.name || 'Vendor';
  const totalAmount = activeBill ? Number(activeBill.total_amount) : calculateTotal();
  const amountPaid = activeBill ? Number(activeBill.amount_paid) : 0;
  const amountDue = activeBill ? Number(activeBill.balance_due) : totalAmount;

  return (
    <MasterViewLayout
      title={viewMode === 'form' ? (activeBill ? `Vendor Bill: ${activeBill.invoice_number}` : 'New Vendor Bill') : 'Vendor Bills'}
      subtitle="Purchase invoices, automated general ledger posting, and accounts payable settlement"
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m)}
      onNew={() => handleOpenForm()}
      onBack={() => setViewMode('list')}
    >
      {viewMode === 'form' ? (
        <form onSubmit={handleSaveBill} className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-6 shadow-obsidian-card space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Action Bar matching Excalidraw: Confirm, Pay, Reset to Draft, Back */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2">
              {/* If Draft, show Confirm */}
              {(!activeBill || activeBill.status === InvoiceStatus.DRAFT) && (
                <>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Draft
                  </button>
                  {activeBill && (
                    <button
                      type="button"
                      onClick={handleConfirmBill}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirm Bill
                    </button>
                  )}
                </>
              )}

              {/* If Confirmed/Approved, show Pay button */}
              {activeBill && activeBill.status !== InvoiceStatus.DRAFT && amountDue > 0 && (
                <button
                  type="button"
                  onClick={() => setPayModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenForm()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.08]"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            {/* Smart Buttons matching Excalidraw: PO Button & Budget Analytics Button */}
            <div className="flex items-center gap-2">
              {originatingPoId && (
                <button
                  type="button"
                  onClick={() => navigate(`/purchase-orders`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7042f4]/15 border border-[#7042f4]/40 text-[#c084fc] hover:text-white text-xs font-semibold transition-all"
                  title="Open the PO from which Bill was created"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> PO
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(`/budgets`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold transition-all"
                title="On Click Open the Budget Analytic Report that is used in the Bill"
              >
                <Layers className="w-3.5 h-3.5" /> Budget
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-[#8a8a9a] hover:text-white border border-white/[0.08]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>
          </div>

          {/* Header Metadata Grid matching Excalidraw */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Vendor Bill No.
              </label>
              <input
                type="text"
                readOnly
                value={activeBill?.invoice_number || 'Bill/2026/0001 (Auto)'}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-[#606070] mt-1 block">
                (auto generate Bill Number +1 of Last Bill)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Vendor Name *
              </label>
              <select
                required
                disabled={activeBill && activeBill.status !== InvoiceStatus.DRAFT}
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.email})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#606070] mt-1 block">
                (from Contact master - Many to one)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Bill Reference
              </label>
              <input
                type="text"
                disabled={activeBill && activeBill.status !== InvoiceStatus.DRAFT}
                value={billReference}
                onChange={(e) => setBillReference(e.target.value)}
                placeholder="e.g. ABC-26-001"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              />
              <span className="text-[10px] text-[#606070] mt-1 block">
                Alpha numeric (Text)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Bill Date & Due Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  disabled={activeBill && activeBill.status !== InvoiceStatus.DRAFT}
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="px-2.5 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white disabled:opacity-60"
                />
                <input
                  type="date"
                  required
                  disabled={activeBill && activeBill.status !== InvoiceStatus.DRAFT}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-2.5 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Budget Limit Exceeded Alert Banner */}
          {exceededBillBudgets.length > 0 && (
            <div className="pt-2">
              <BudgetExceededAlert
                title="Budget Limit Exceeded Alert"
                subtitle="One or more line items in this vendor bill will cause expenditures to exceed the active budget limits!"
                items={exceededBillBudgets.map((b) => ({
                  accountName: b.analyticName,
                  budgetName: b.budgetName,
                  budgetId: b.budgetId,
                  committed: b.committed,
                  achieved: b.projected,
                  exceededBy: b.exceededBy,
                  type: BudgetLineType.EXPENSE,
                  message: `Projected: ₹${b.projected.toLocaleString('en-IN')} vs Committed: ₹${b.committed.toLocaleString('en-IN')} (${b.percentage}%)`,
                }))}
                onReviseBudget={(bId) => navigate(bId ? `/accounting/budgets?id=${bId}` : '/accounting/budgets')}
              />
            </div>
          )}

          {/* Line Items Table matching Excalidraw */}
          <div className="space-y-3 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7042f4]" />
                <span>Line Items</span>
              </h3>
              {(!activeBill || activeBill.status === InvoiceStatus.DRAFT) && (
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7042f4]/20 hover:bg-[#7042f4]/30 text-[#c084fc] text-xs font-semibold border border-[#7042f4]/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </button>
              )}
            </div>

            <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#121216]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181f] text-[#707080] border-b border-white/[0.08] font-semibold">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">Sr.</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Chart of Accounts</th>
                      <th className="py-3 px-4">Budget Analytics</th>
                      <th className="py-3 px-3 text-right w-20">Qty</th>
                      <th className="py-3 px-3 text-right w-28">Unit Price</th>
                      <th className="py-3 px-4 text-right w-32">Total</th>
                      {(!activeBill || activeBill.status === InvoiceStatus.DRAFT) && (
                        <th className="py-3 px-2 w-10 text-center"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {lines.map((l, idx) => {
                      const lineTotal = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0);
                      const isLineOverBudget = l.analytic_account_id && exceededAnalyticIds.has(Number(l.analytic_account_id));
                      const lineExceededInfo = exceededBillBudgets.find((eb) => eb.analyticId === Number(l.analytic_account_id));

                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            isLineOverBudget
                              ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-2 border-l-rose-500'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-[#707080] font-mono">{idx + 1}</td>
                          <td className="py-3 px-4">
                            {activeBill && activeBill.status !== InvoiceStatus.DRAFT ? (
                              <span className="text-white font-semibold">{l.description}</span>
                            ) : (
                              <select
                                value={l.product_id}
                                onChange={(e) => handleLineChange(idx, 'product_id', parseInt(e.target.value, 10))}
                                className="w-full px-2.5 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-lg text-xs text-white"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {activeBill && activeBill.status !== InvoiceStatus.DRAFT ? (
                              <span className="text-[#a0a0b0]">Purchase Expense A/c</span>
                            ) : (
                              <select
                                value={l.account_id}
                                onChange={(e) => handleLineChange(idx, 'account_id', parseInt(e.target.value, 10))}
                                className="w-full px-2.5 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-lg text-xs text-white"
                              >
                                {accounts.filter((a) => a.type === AccountClassification.EXPENSE || a.code === '5001' || a.code === '5100').map((a) => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {activeBill && activeBill.status !== InvoiceStatus.DRAFT ? (
                              <div>
                                <span className="text-[#c084fc] font-semibold">
                                  {analytics.find((an) => an.id === l.analytic_account_id)?.name || 'Project 1'}
                                </span>
                                {isLineOverBudget && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-rose-400">
                                    <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0 animate-pulse" />
                                    <span>Budget limit exceeded (+₹{lineExceededInfo?.exceededBy.toLocaleString('en-IN')} over)</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <select
                                  value={l.analytic_account_id}
                                  onChange={(e) => handleLineChange(idx, 'analytic_account_id', parseInt(e.target.value, 10))}
                                  className={`w-full px-2.5 py-1.5 bg-[#18181f] border rounded-lg text-xs text-white ${
                                    isLineOverBudget
                                      ? 'border-rose-500/60 bg-rose-950/20 text-rose-200 focus:border-rose-500'
                                      : 'border-white/[0.08]'
                                  }`}
                                >
                                  <option value="">-- None --</option>
                                  {analytics.map((an) => (
                                    <option key={an.id} value={an.id}>{an.name}</option>
                                  ))}
                                </select>
                                {isLineOverBudget && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-rose-400">
                                    <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0 animate-pulse" />
                                    <span>Budget limit exceeded (+₹{lineExceededInfo?.exceededBy.toLocaleString('en-IN')} over)</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {activeBill && activeBill.status !== InvoiceStatus.DRAFT ? (
                              <span className="font-mono text-white">{l.quantity}</span>
                            ) : (
                              <input
                                type="number"
                                step="1"
                                value={l.quantity}
                                onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                                className={`w-16 text-right px-2 py-1 bg-[#18181f] border rounded text-xs text-white ${
                                  isLineOverBudget ? 'border-rose-500/60 bg-rose-950/20' : 'border-white/[0.08]'
                                }`}
                              />
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {activeBill && activeBill.status !== InvoiceStatus.DRAFT ? (
                              <span className="font-mono text-white">₹{Number(l.unit_price).toLocaleString()}</span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                value={l.unit_price}
                                onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                                className={`w-24 text-right px-2 py-1 bg-[#18181f] border rounded text-xs text-white ${
                                  isLineOverBudget ? 'border-rose-500/60 bg-rose-950/20' : 'border-white/[0.08]'
                                }`}
                              />
                            )}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${isLineOverBudget ? 'text-rose-400' : 'text-white'}`}>
                            ₹{lineTotal.toLocaleString()}
                          </td>
                          {(!activeBill || activeBill.status === InvoiceStatus.DRAFT) && (
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="p-1 text-rose-400 hover:text-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Financial Summary Row matching Excalidraw Wireframe */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-white/[0.08] bg-[#141418] p-4 rounded-xl">
            <div>
              <span className="text-xs text-[#8a8a9a] block">Total</span>
              <span className="text-lg font-mono font-bold text-white">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#8a8a9a] block">Paid Via Bank</span>
              <span className="text-lg font-mono font-bold text-indigo-400">
                ₹{amountPaid.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#8a8a9a] block">Paid Via Cash</span>
              <span className="text-lg font-mono font-bold text-emerald-400">₹0</span>
            </div>
            <div>
              <span className="text-xs text-[#8a8a9a] block">Amount Due (Total - Paid)</span>
              <span className={`text-lg font-mono font-extrabold ${amountDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₹{amountDue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#7042f4]/10 border border-[#7042f4]/25 text-xs text-[#c084fc]">
            <span className="font-bold block mb-0.5">Automated Double-Entry Rule:</span>
            As soon as the Vendor Bill is confirmed, a balanced Journal Entry is created: Debit Purchase A/c (Expense) & Credit Creditor A/c (Liability) with Partner = {vendorName}.
          </div>
        </form>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          <FieldFilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by bill number, vendor, reference..."
            filterConfigs={billFilterConfigs}
            activeFilters={activeFilters}
            onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
            onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
            onClearAll={() => {
              setSearch('');
              setActiveFilters([]);
              setColumnFilters({});
              setStatusFilter('all');
            }}
            showColumnFilters={showColumnFilters}
            onToggleColumnFilters={() => setShowColumnFilters((prev) => !prev)}
            presets={{
              field: 'status',
              currentValue: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: 'All Bills', value: 'all' },
                { label: 'Draft', value: InvoiceStatus.DRAFT },
                { label: 'Approved', value: InvoiceStatus.APPROVED },
                { label: 'Paid', value: InvoiceStatus.PAID },
              ],
            }}
          />

          <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-obsidian-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141418] text-[#707080] border-b border-white/[0.08] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Vendor Bill No.</th>
                    <th className="py-3.5 px-4">Vendor Name</th>
                    <th className="py-3.5 px-4">Bill Reference</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-right">Amount Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                  {showColumnFilters && (
                    <ColumnFilterRow
                      columns={billColumnDefs}
                      values={columnFilters}
                      onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                    />
                  )}
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {visibleBills.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => handleOpenForm(b)}
                      className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-white font-mono flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#7042f4]" />
                        <span>{b.invoice_number}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">{b.vendor?.name || '—'}</td>
                      <td className="py-3.5 px-4 text-[#a0a0b0] font-mono">{b.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-[#a0a0b0] font-mono">{b.invoice_date}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-white">
                        ₹{Number(b.total_amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                        ₹{Number(b.balance_due).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === InvoiceStatus.PAID
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : b.status === InvoiceStatus.APPROVED
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'bg-white/[0.08] text-[#c084fc] border border-white/10'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visibleBills.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#707080]">
                        No vendor bills found matching your criteria. Click "+ New" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ScrollSentinel
              sentinelRef={sentinelRef}
              loadingMore={loadingMore}
              hasMore={hasMore}
              totalCount={totalCount}
              visibleCount={visibleBills.length}
              onLoadMore={loadMore}
              entityName="vendor bills"
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {activeBill && (
        <ExcalidrawPaymentModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          onSuccess={async () => {
            await fetchData();
            const updated = await invoicesApi.get(activeBill.id);
            setActiveBill(updated.data);
          }}
          invoiceId={activeBill.id}
          partnerName={vendorName}
          amountDue={amountDue}
          mode={InvoiceType.BILL}
        />
      )}
    </MasterViewLayout>
  );
};
