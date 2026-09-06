import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Plus,
  Check,
  ArrowLeft,
  RotateCw,
  XCircle,
  Link as LinkIcon,
  ExternalLink,
  Trash2,
  Calendar,
  Layers,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { BudgetExceededAlert } from '../components/common/BudgetExceededAlert';
import { ExcalidrawGuideBanner } from '../components/common/ExcalidrawGuideBanner';
import { budgetsApi, analyticAccountsApi, contactsApi } from '../lib/api';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import { BudgetStatus, BudgetLineType, ContactType } from '../types';

const budgetFilterConfigs: FieldFilterConfig[] = [
  { key: 'name', label: 'Budget Name', type: 'text', placeholder: 'Budget name...' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Draft', value: BudgetStatus.DRAFT },
      { label: 'Confirmed', value: BudgetStatus.CONFIRM },
      { label: 'Revised', value: BudgetStatus.REVISED },
      { label: 'Cancelled', value: BudgetStatus.CANCELLED },
    ],
  },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date', type: 'date' },
  { key: 'total_committed', label: 'Committed Amount', type: 'number', placeholder: 'Min committed ₹...' },
  { key: 'total_achieved', label: 'Achieved Amount', type: 'number', placeholder: 'Min achieved ₹...' },
];

const budgetColumnDefs: ColumnFilterDef[] = [
  { key: 'name', filterType: 'text', placeholder: 'Filter budget...' },
  { key: 'start_date', filterType: 'date' },
  { key: 'end_date', filterType: 'date' },
  {
    key: 'status',
    filterType: 'select',
    options: [
      { label: 'Draft', value: BudgetStatus.DRAFT },
      { label: 'Confirmed', value: BudgetStatus.CONFIRM },
      { label: 'Revised', value: BudgetStatus.REVISED },
      { label: 'Cancelled', value: BudgetStatus.CANCELLED },
    ],
  },
  { key: 'total_committed', filterType: 'number', placeholder: 'Min committed...' },
  { key: 'total_achieved', filterType: 'number', placeholder: 'Min achieved...' },
  { key: 'progress_percent', filterType: 'number', placeholder: 'Min %...' },
];

interface BudgetLineItem {
  id?: number;
  analytic_account_id: number;
  analytic_account_name?: string;
  type: BudgetLineType;
  committed_amount: number;
  achieved_amount?: number;
  achieved_percent?: number;
  amount_to_achieve?: number;
  is_exceeded?: boolean;
  exceeded_amount?: number;
}

interface BudgetRecord {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: BudgetStatus;
  responsible_id?: number;
  responsible_type?: ContactType | 'user';
  responsible?: { id: number; name: string; contact_type?: string; email?: string };
  original_budget_id?: number;
  original_budget?: { id: number; name: string; status?: string };
  revised_budget_id?: number;
  revised_budget?: { id: number; name: string; status?: string };
  computed_lines?: BudgetLineItem[];
  total_committed?: number;
  total_achieved?: number;
  progress_percent?: number;
  has_exceeded_lines?: boolean;
  is_over_budget?: boolean;
  total_exceeded_amount?: number;
}

export const BudgetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: paramId } = useParams<{ id?: string }>();
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'form'>('list');
  const [search, setSearch] = useState<string>('');

  // Filter States
  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [activeBudget, setActiveBudget] = useState<BudgetRecord | null>(null);
  const [name, setName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');
  const [responsibleValue, setResponsibleValue] = useState<string>(''); // format: `${contact_type}:${id}`
  const [lines, setLines] = useState<BudgetLineItem[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State for Achieved Transactions Breakdown
  const [transactionModalOpen, setTransactionModalOpen] = useState<boolean>(false);
  const [modalTransactions, setModalTransactions] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalAnalyticName, setModalAnalyticName] = useState<string>('');

  const handleBackToList = () => {
    setViewMode('list');
    setActiveBudget(null);
    if (paramId) {
      navigate('/budgets');
    } else {
      setSearchParams({});
    }
  };

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const auxLoadedRef = useRef(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const bRes = await budgetsApi.list({ per_page: 'all' });
      setBudgets(bRes?.data || []);
    } catch (err) {
      console.error('Failed to fetch budgets data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureAuxiliaryData = useCallback(async () => {
    if (auxLoadedRef.current) return;
    try {
      const [aRes, cRes] = await Promise.all([
        analyticAccountsApi.list({ per_page: 'all' }),
        contactsApi.list({ per_page: 'all' }),
      ]);
      setAnalytics(aRes?.data || []);
      setContacts(cRes?.data || []);
      auxLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load auxiliary data:', err);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenForm = async (budgetId?: number) => {
    ensureAuxiliaryData();
    setError(null);
    setSuccessMessage(null);
    if (budgetId) {
      if (searchParams.get('id') !== String(budgetId) && !paramId) {
        setSearchParams({ id: String(budgetId) });
      }
      try {
        const full = await budgetsApi.get(budgetId);
        const b: BudgetRecord = full?.data;
        setActiveBudget(b);
        setName(b.name);
        setStartDate(b.start_date);
        setEndDate(b.end_date);
        if (b.responsible_id) {
          const rType = b.responsible_type || b.responsible?.contact_type || ContactType.CUSTOMER;
          setResponsibleValue(`${rType}:${b.responsible_id}`);
        } else {
          setResponsibleValue('');
        }
        setLines(b.computed_lines && b.computed_lines.length > 0 ? b.computed_lines : []);
      } catch (err) {
        console.error('Failed to load budget record:', err);
      }
    } else {
      setActiveBudget(null);
      setName('');
      setStartDate('2026-01-01');
      setEndDate('2026-01-31');
      if (contacts && contacts.length > 0) {
        setResponsibleValue(`${contacts[0].contact_type || ContactType.CUSTOMER}:${contacts[0].id}`);
      } else {
        setResponsibleValue('');
      }
      if (analytics && analytics.length > 0) {
        const first = analytics[0];
        setLines([
          {
            analytic_account_id: first.id,
            type: first.type === BudgetLineType.INCOME ? BudgetLineType.INCOME : BudgetLineType.EXPENSE,
            committed_amount: 100000,
          },
        ]);
      } else {
        setLines([]);
      }
    }
    setViewMode('form');
  };

  // Deep-linking: auto-open budget when id is in URL params or query, or when ?new=true
  useEffect(() => {
    if (loading) return;
    const rawId = paramId || searchParams.get('id');
    if (rawId) {
      const bId = parseInt(rawId, 10);
      if (!isNaN(bId) && (!activeBudget || activeBudget.id !== bId)) {
        handleOpenForm(bId);
      }
    } else if (searchParams.get('new') === 'true') {
      if (!activeBudget && viewMode !== 'form') {
        handleOpenForm();
      }
    }
  }, [paramId, searchParams, loading]);

  useEffect(() => {
    if (viewMode === 'form' && !activeBudget && lines.length === 0 && analytics.length > 0) {
      const first = analytics[0];
      setLines([
        {
          analytic_account_id: first.id,
          type: first.type === BudgetLineType.INCOME ? BudgetLineType.INCOME : BudgetLineType.EXPENSE,
          committed_amount: 100000,
        },
      ]);
    }
  }, [viewMode, activeBudget, lines.length, analytics]);

  useEffect(() => {
    if (viewMode === 'form' && !activeBudget && !responsibleValue && contacts.length > 0) {
      setResponsibleValue(`${contacts[0].contact_type || ContactType.CUSTOMER}:${contacts[0].id}`);
    }
  }, [viewMode, activeBudget, responsibleValue, contacts]);

  const handleAddLine = () => {
    if (analytics.length === 0) return;
    const defaultAcc = analytics[0];
    setLines([
      ...lines,
      {
        analytic_account_id: defaultAcc.id,
        type: defaultAcc.type === BudgetLineType.INCOME ? BudgetLineType.INCOME : BudgetLineType.EXPENSE,
        committed_amount: 50000,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleAnalyticAccountChange = (idx: number, accountId: number) => {
    const matched = analytics.find((a) => a.id === accountId);
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      analytic_account_id: accountId,
      type: matched?.type === BudgetLineType.INCOME ? BudgetLineType.INCOME : BudgetLineType.EXPENSE,
    };
    setLines(updated);
  };

  const handleLineFieldChange = (idx: number, field: keyof BudgetLineItem, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  // Dynamic recalculation of budget limit overruns as user modifies any form operations
  const exceededLines = lines
    .map((l, idx) => {
      const comm = Number(l.committed_amount) || 0;
      const ach = Number(l.achieved_amount) || 0;
      const isExceeded = comm > 0 && ach > comm;
      const exceededBy = isExceeded ? ach - comm : 0;
      const anObj = analytics.find((a) => a.id === l.analytic_account_id);
      const anName = anObj?.name || l.analytic_account_name || `Line #${idx + 1}`;
      return {
        lineIndex: idx,
        accountName: anName,
        budgetName: name || activeBudget?.name || 'Current Budget',
        budgetId: activeBudget?.id,
        committed: comm,
        achieved: ach,
        exceededBy,
        type: l.type,
        isExceeded,
      };
    })
    .filter((l) => l.isExceeded);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Budget Name is required.');
      setSaving(false);
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End Date cannot be earlier than Start Date.');
      setSaving(false);
      return;
    }

    if (lines.length === 0) {
      setError('Please add at least one analytic account budget line.');
      setSaving(false);
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.analytic_account_id) {
        setError(`Line ${i + 1}: Please select a valid analytic account.`);
        setSaving(false);
        return;
      }
      if (isNaN(Number(l.committed_amount)) || Number(l.committed_amount) <= 0) {
        setError(`Line ${i + 1}: Committed amount must be greater than 0.`);
        setSaving(false);
        return;
      }
    }

    try {
      let respId: number | null = null;
      let respType: string | null = null;
      if (responsibleValue) {
        const [cType, cId] = responsibleValue.split(':');
        if (cId) {
          respId = parseInt(cId, 10);
          respType = cType;
        }
      }

      const payload = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        responsible_id: respId,
        responsible_type: respType,
        lines: lines.map((l) => ({
          analytic_account_id: l.analytic_account_id,
          type: l.type,
          committed_amount: parseFloat(l.committed_amount as any) || 0,
        })),
      };

      if (activeBudget) {
        await budgetsApi.update(activeBudget.id, payload);
        setSuccessMessage('Budget updated successfully.');
      } else {
        await budgetsApi.create(payload);
        setSuccessMessage('Budget created in Draft state.');
      }

      await fetchBudgets();
      setViewMode('list');
    } catch (err: any) {
      console.error('Failed to save budget:', err);
      setError(err?.response?.data?.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!activeBudget) return;
    setSaving(true);
    setError(null);
    try {
      const res = await budgetsApi.confirm(activeBudget.id);
      setActiveBudget(res.data);
      setSuccessMessage('Budget confirmed successfully.');
      await fetchBudgets();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to confirm budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevise = async () => {
    if (!activeBudget) return;
    setSaving(true);
    setError(null);
    try {
      const res = await budgetsApi.revise(activeBudget.id);
      setSuccessMessage('Revision created in Draft state.');
      await fetchBudgets();
      // Open the newly created revised budget
      const newId = res.data?.id;
      if (newId) {
        if (paramId) {
          navigate(`/budgets/${newId}`);
        } else {
          setSearchParams({ id: String(newId) });
        }
        await handleOpenForm(newId);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to revise budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!activeBudget) return;
    setSaving(true);
    setError(null);
    try {
      const res = await budgetsApi.cancel(activeBudget.id);
      setActiveBudget(res.data);
      setSuccessMessage('Budget marked as cancelled.');
      await fetchBudgets();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeBudget) return;
    if (!window.confirm(`Are you sure you want to delete budget "${activeBudget.name}"?`)) return;
    setSaving(true);
    setError(null);
    try {
      await budgetsApi.delete(activeBudget.id);
      setSuccessMessage('Budget deleted successfully.');
      await fetchBudgets();
      handleBackToList();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAchievedBreakdown = async (analyticId: number, lineType: string, analyticName: string) => {
    if (!activeBudget) return;
    setModalLoading(true);
    setModalAnalyticName(analyticName);
    setTransactionModalOpen(true);

    try {
      const res = await budgetsApi.getAnalyticTransactions(activeBudget.id, {
        analytic_account_id: analyticId,
        type: lineType,
      });
      setModalTransactions(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch analytic breakdown:', err);
      setModalTransactions([]);
    } finally {
      setModalLoading(false);
    }
  };

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = budgetFilterConfigs.find((c) => c.key === key);
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

  const filteredBudgets = React.useMemo(() => {
    return filterItems(budgets, search, ['name'], allActiveFilters);
  }, [budgets, search, allActiveFilters]);

  const {
    visibleItems: visibleBudgets,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredBudgets,
    pageSize: 15,
    isLoading: loading,
  });

  return (
    <MasterViewLayout
      title={viewMode === 'form' ? (activeBudget ? `Budget: ${activeBudget.name}` : 'New Budget') : 'Analytical Budgets'}
      subtitle={viewMode === 'form' ? 'Lifecycle revision tracking and dimensional budget vs achieved variance' : 'Analytical Budget & Expenditure Management'}
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m)}
      onNew={() => handleOpenForm()}
      onBack={handleBackToList}
    >
      {/* Notifications Banner across list/form */}
      <AnimatePresence>
        {successMessage && viewMode !== 'form' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM VIEW */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSaveBudget} className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-6 shadow-obsidian-card space-y-6">
          {/* Real-time Budget Exceeded Limit Alert */}
          {exceededLines.length > 0 && (
            <BudgetExceededAlert
              title="Budget Exceeded Limit Alert"
              subtitle={`Committed budget limit is less than actual expenditures for ${exceededLines.length} analytic account line(s)! Adjust limits or revise budget.`}
              items={exceededLines}
              showReviseButton={activeBudget?.status === BudgetStatus.CONFIRM}
              onReviseBudget={() => {
                if (activeBudget) handleRevise();
              }}
            />
          )}

          {/* Form Notifications */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button type="button" onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {analytics.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>No Analytic Accounts found. Create an Analytic Account before configuring a Budget.</span>
                </div>
                <Link
                  to="/analyticals?new=true"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold inline-flex items-center gap-1 transition-all whitespace-nowrap"
                >
                  Create Analytic Account <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Control Bar matching Excalidraw Stages: Draft, Confirm, Revise, Cancel */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2">
              {/* Draft actions */}
              {(!activeBudget || activeBudget.status === BudgetStatus.DRAFT) && (
                <>
                  <button
                    type="submit"
                    disabled={saving || analytics.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Draft
                  </button>
                  {activeBudget && (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}
                  {activeBudget && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-white/[0.08] transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </>
              )}

              {/* Confirmed Stage actions */}
              {activeBudget?.status === BudgetStatus.CONFIRM && (
                <>
                  <button
                    type="button"
                    onClick={handleRevise}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Revise
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-white/[0.08] transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}

              {/* Delete button for draft and cancelled budgets */}
              {activeBudget && (activeBudget.status === BudgetStatus.DRAFT || activeBudget.status === BudgetStatus.CANCELLED) && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
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

            {/* Status & Navigation */}
            <div className="flex items-center gap-3">
              {activeBudget && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  activeBudget.status === BudgetStatus.CONFIRM
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : activeBudget.status === BudgetStatus.REVISED
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : activeBudget.status === BudgetStatus.CANCELLED
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'bg-white/[0.08] text-[#c084fc] border border-white/10'
                }`}>
                  {activeBudget.status}
                </span>
              )}
              <button
                type="button"
                onClick={handleBackToList}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-[#8a8a9a] hover:text-white border border-white/[0.08]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>
          </div>

          {/* Bi-directional Revision Linking matching Excalidraw Wireframe */}
          {activeBudget?.revised_budget && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-200">
              <span className="font-semibold flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-amber-400" />
                Revised With: {activeBudget.revised_budget.name}
              </span>
              <button
                type="button"
                onClick={() => handleOpenForm(activeBudget.revised_budget_id)}
                className="underline hover:text-white font-bold flex items-center gap-1"
              >
                Open Revised Budget <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeBudget?.original_budget && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between text-xs text-indigo-200">
              <span className="font-semibold flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-400" />
                Revision Of: {activeBudget.original_budget.name}
              </span>
              <button
                type="button"
                onClick={() => handleOpenForm(activeBudget.original_budget_id)}
                className="underline hover:text-white font-bold flex items-center gap-1"
              >
                (Original Budget Clickable link) <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Header Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Budget Name *
              </label>
              <input
                type="text"
                required
                disabled={activeBudget?.status === BudgetStatus.CONFIRM || activeBudget?.status === BudgetStatus.REVISED}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. January 2026 / Project A"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              />
              <span className="text-[10px] text-[#606070] mt-1 block">
                Alpha Numeric (Appends "Revised" upon revision)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                required
                disabled={activeBudget?.status === BudgetStatus.CONFIRM || activeBudget?.status === BudgetStatus.REVISED}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                required
                disabled={activeBudget?.status === BudgetStatus.CONFIRM || activeBudget?.status === BudgetStatus.REVISED}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Responsible Contact
              </label>
              <select
                value={responsibleValue}
                disabled={activeBudget?.status === BudgetStatus.CONFIRM || activeBudget?.status === BudgetStatus.REVISED}
                onChange={(e) => setResponsibleValue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              >
                <option value="">-- Select Contact / Responsible --</option>
                {contacts.map((c) => (
                  <option key={`${c.contact_type}-${c.id}`} value={`${c.contact_type}:${c.id}`}>
                    [{c.contact_type === ContactType.VENDOR ? 'Vendor' : 'Customer'}] {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#606070] mt-1 block">
                Select from Contacts (Customers or Vendors)
              </span>
            </div>
          </div>

          {/* Analytic Budget Lines Table */}
          <div className="space-y-3 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7042f4]" />
                <span>Analytic Budget Matrix</span>
              </h3>
              {(!activeBudget || activeBudget.status === BudgetStatus.DRAFT) && (
                <button
                  type="button"
                  onClick={handleAddLine}
                  disabled={analytics.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7042f4]/20 hover:bg-[#7042f4]/30 text-[#c084fc] text-xs font-semibold border border-[#7042f4]/30 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Analytic Line
                </button>
              )}
            </div>

            <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#121216]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181f] text-[#707080] border-b border-white/[0.08] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Analytic Account</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Committed Amount</th>
                      <th className="py-3 px-4 text-right">Achieved Amount</th>
                      <th className="py-3 px-4 text-right">Achieved %</th>
                      <th className="py-3 px-4 text-right">Amount To Achieve</th>
                      {(!activeBudget || activeBudget.status === BudgetStatus.DRAFT) && (
                        <th className="py-3 px-4 text-center w-12">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {lines.map((line, idx) => {
                      const comm = Number(line.committed_amount) || 0;
                      const ach = Number(line.achieved_amount) || 0;
                      const isLineExceeded = comm > 0 && ach > comm;
                      const pct = comm > 0 ? ((ach / comm) * 100).toFixed(1) : '0';
                      const rem = Math.max(0, comm - ach);
                      const anObj = analytics.find((a) => a.id === line.analytic_account_id);
                      const anName = anObj?.name || line.analytic_account_name || 'Analytic';

                      return (
                        <tr key={idx} className={isLineExceeded ? 'bg-rose-500/[0.08] hover:bg-rose-500/[0.14] border-l-2 border-rose-500 transition-colors' : 'hover:bg-white/[0.02]'}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {activeBudget?.status === BudgetStatus.CONFIRM || activeBudget?.status === BudgetStatus.REVISED ? (
                                <span className="font-semibold text-white">{anName}</span>
                              ) : (
                                <select
                                  value={line.analytic_account_id}
                                  onChange={(e) => handleAnalyticAccountChange(idx, parseInt(e.target.value, 10))}
                                  className="px-2.5 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-[#7042f4]"
                                >
                                  {analytics.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name} ({a.type})
                                    </option>
                                  ))}
                                </select>
                              )}
                              {isLineExceeded && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                  Exceeded
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {activeBudget?.status === BudgetStatus.CONFIRM || activeBudget?.status === BudgetStatus.REVISED ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                line.type === BudgetLineType.INCOME
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-300'
                              }`}>
                                {line.type}
                              </span>
                            ) : (
                              <select
                                value={line.type}
                                onChange={(e) => handleLineFieldChange(idx, 'type', e.target.value)}
                                className="px-2.5 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-lg text-xs text-white capitalize focus:outline-none focus:border-[#7042f4]"
                              >
                                <option value={BudgetLineType.EXPENSE}>Expense</option>
                                <option value={BudgetLineType.INCOME}>Income</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {activeBudget?.status === BudgetStatus.CONFIRM || activeBudget?.status === BudgetStatus.REVISED ? (
                              <span className={`font-mono font-semibold ${isLineExceeded ? 'text-rose-400' : 'text-white'}`}>₹{comm.toLocaleString()}</span>
                            ) : (
                              <div className="inline-flex flex-col items-end">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.committed_amount}
                                  onChange={(e) => handleLineFieldChange(idx, 'committed_amount', e.target.value)}
                                  className={`w-28 text-right px-2.5 py-1.5 bg-[#18181f] border rounded-lg text-xs focus:outline-none ${
                                    isLineExceeded
                                      ? 'border-rose-500 text-rose-300 focus:border-rose-400'
                                      : 'border-white/[0.08] text-white focus:border-[#7042f4]'
                                  }`}
                                />
                                {isLineExceeded && (
                                  <span className="text-[10px] text-rose-400 mt-0.5">
                                    Limit &lt; Achieved
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {/* Achieved Amount Clickable Button matching wireframe */}
                            {activeBudget ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAchievedBreakdown(line.analytic_account_id, line.type, anName)}
                                className={`font-mono font-semibold underline inline-flex items-center gap-1 ${
                                  isLineExceeded ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'
                                }`}
                                title="Click to view all Invoices/Bills having this analytic account for the budget period"
                              >
                                ₹{ach.toLocaleString()}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="font-mono text-[#606070]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-mono font-semibold ${isLineExceeded ? 'text-rose-400' : 'text-[#a0a0b0]'}`}>
                              {pct}% {isLineExceeded && '⚠️'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isLineExceeded ? (
                              <span className="font-mono text-rose-400 font-bold inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                +₹{Math.round(ach - comm).toLocaleString()} over
                              </span>
                            ) : (
                              <span className="font-mono text-amber-300 font-semibold">₹{rem.toLocaleString()}</span>
                            )}
                          </td>
                          {(!activeBudget || activeBudget.status === BudgetStatus.DRAFT) && (
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
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
            <p className="text-[11px] text-[#707080]">
              * Note: Income matches customer invoices; Expenses match vendor bills for the selected period.
            </p>
          </div>
        </form>
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => (
            <motion.div
              key={b.id}
              onClick={() => handleOpenForm(b.id)}
              whileHover={{ y: -3, scale: 1.01 }}
              className="p-5 rounded-2xl bg-[#18181f]/90 border border-white/[0.08] hover:border-[#7042f4]/50 shadow-obsidian-card cursor-pointer transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">{b.name}</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    b.status === BudgetStatus.CONFIRM
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : b.status === BudgetStatus.REVISED
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-white/[0.08] text-[#c084fc] border border-white/10'
                  }`}>
                    {b.status}
                  </span>
                  {(b.is_over_budget || b.has_exceeded_lines) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" /> Over Budget
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8a8a9a]">
                <Calendar className="w-3.5 h-3.5 text-[#7042f4]" />
                <span>{b.start_date} to {b.end_date}</span>
              </div>

              {/* Progress Bar & Numbers */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a0a0b0]">Achieved vs Committed</span>
                  <span className="font-mono font-bold text-white">{b.progress_percent || 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${(b.is_over_budget || b.has_exceeded_lines) ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-[#7042f4] to-emerald-400'}`}
                    style={{ width: `${Math.min(100, b.progress_percent || 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-[#707080] pt-1">
                  <span>₹{(b.total_achieved || 0).toLocaleString()}</span>
                  <span>₹{(b.total_committed || 0).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          <ExcalidrawGuideBanner
            module="Account (Master Data)"
            concept="Analytical Budgets & Multi-Stage Lifecycle"
            description="Excalidraw budget management: Budgets track planned spending across Analytic Accounts (e.g., Luxury Sofas, Teak Tables). The lifecycle enforces controls: Draft -> Confirm -> Revise / Cancelled. Real-time progress is computed as (Achieved / Committed) * 100 with active purchase validation."
            accountingRules={[
              {
                type: 'Debit',
                account: 'Analytic Cost Center (Expense Tracking)',
                amountDesc: 'Accumulates from Vendor Bills & Adjustments',
              },
              {
                type: 'Credit',
                account: 'Budget Committed Limit (Target Ceiling)',
                amountDesc: 'Max planned expenditure for period',
              },
            ]}
            badges={['Draft -> Confirm -> Revise', 'Real-time Limit Check', 'PO & Bill Blocking', 'Progress Formula']}
            defaultOpen={false}
          />

          <FieldFilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search budgets by name..."
            filterConfigs={budgetFilterConfigs}
            activeFilters={activeFilters}
            onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
            onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
            onClearAll={() => {
              setActiveFilters([]);
              setColumnFilters({});
              setSearch('');
              setStatusFilter('all');
            }}
            presets={{
              field: 'status',
              currentValue: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Draft', value: BudgetStatus.DRAFT },
                { label: 'Confirmed', value: BudgetStatus.CONFIRM },
                { label: 'Revised', value: BudgetStatus.REVISED },
                { label: 'Cancelled', value: BudgetStatus.CANCELLED },
              ],
            }}
            showColumnFilters={showColumnFilters}
            onToggleColumnFilters={() => setShowColumnFilters(!showColumnFilters)}
          />

          <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-obsidian-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141418] text-[#707080] border-b border-white/[0.08] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Budget</th>
                    <th className="py-3.5 px-4">Start Date</th>
                    <th className="py-3.5 px-4">End Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Committed</th>
                    <th className="py-3.5 px-4 text-right">Achieved</th>
                    <th className="py-3.5 px-4 text-center">Progress</th>
                  </tr>
                  {showColumnFilters && (
                    <ColumnFilterRow
                      columns={budgetColumnDefs}
                      values={columnFilters}
                      onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                    />
                  )}
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading && visibleBudgets.length === 0 ? (
                    <TableSkeleton columns={7} rows={6} />
                  ) : (
                    visibleBudgets.map((b) => {
                      const isOver = b.is_over_budget || b.has_exceeded_lines || (b.total_committed && b.total_achieved && b.total_achieved > b.total_committed);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => handleOpenForm(b.id)}
                          className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2 flex-wrap">
                              <PieChart className="w-4 h-4 text-[#7042f4] shrink-0" />
                              <span>{b.name}</span>
                              {isOver && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                  Limit Exceeded
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#a0a0b0] font-mono">{b.start_date}</td>
                          <td className="py-3.5 px-4 text-[#a0a0b0] font-mono">{b.end_date}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === BudgetStatus.CONFIRM
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : b.status === BudgetStatus.REVISED
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-white/[0.08] text-[#c084fc] border border-white/10'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-white">
                            ₹{(b.total_committed || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                            ₹{(b.total_achieved || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono text-xs text-[#a0a0b0]">{b.progress_percent || 0}%</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {loadingMore && (
                    <TableSkeleton isPaginationLoader columns={7} rows={3} />
                  )}
                  {visibleBudgets.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#707080]">
                        No budgets found matching the filters.
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
              visibleCount={visibleBudgets.length}
              onLoadMore={loadMore}
              entityName="budgets"
            />
          </div>
        </div>
      )}

      {/* Achieved Amount Transactions Modal */}
      <AnimatePresence>
        {transactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#18181f] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141418]">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Achieved Transactions Breakdown — {modalAnalyticName}
                  </h3>
                  <p className="text-[11px] text-[#8a8a9a]">
                    Matching Sales Invoices / Vendor Bills for budget period
                  </p>
                </div>
                <button
                  onClick={() => setTransactionModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#707080] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {modalLoading ? (
                  <div className="text-center py-8 text-[#8a8a9a]">Loading transactions...</div>
                ) : modalTransactions.length === 0 ? (
                  <div className="text-center py-8 text-[#707080]">
                    No transactions recorded against this analytic account in this period.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121216] text-[#707080] border-b border-white/[0.08]">
                      <tr>
                        <th className="py-2.5 px-3">Document</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Party</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {modalTransactions.map((tx, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {tx.invoice_number}
                          </td>
                          <td className="py-2.5 px-3 text-[#a0a0b0] font-mono">{tx.issue_date}</td>
                          <td className="py-2.5 px-3 text-[#a0a0b0]">{tx.customer_name || tx.vendor_name || '—'}</td>
                          <td className="py-2.5 px-3 text-[#8a8a9a]">{tx.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                            ₹{Number(tx.line_total).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MasterViewLayout>
  );
};
