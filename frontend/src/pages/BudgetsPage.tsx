import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { budgetsApi, analyticAccountsApi, contactsApi } from '../lib/api';

interface BudgetLineItem {
  id?: number;
  analytic_account_id: number;
  analytic_account_name?: string;
  type: 'income' | 'expense';
  committed_amount: number;
  achieved_amount?: number;
  achieved_percent?: number;
  amount_to_achieve?: number;
}

interface BudgetRecord {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'confirm' | 'revised' | 'cancelled';
  responsible_id?: number;
  responsible?: { id: number; name: string };
  original_budget_id?: number;
  original_budget?: { id: number; name: string };
  revised_budget_id?: number;
  revised_budget?: { id: number; name: string };
  computed_lines?: BudgetLineItem[];
  total_committed?: number;
  total_achieved?: number;
  progress_percent?: number;
}

export const BudgetsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'form'>('list');
  const [search, setSearch] = useState<string>('');

  // Form State
  const [activeBudget, setActiveBudget] = useState<BudgetRecord | null>(null);
  const [name, setName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');
  const [responsibleId, setResponsibleId] = useState<string>('');
  const [lines, setLines] = useState<BudgetLineItem[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Achieved Transactions Breakdown
  const [transactionModalOpen, setTransactionModalOpen] = useState<boolean>(false);
  const [modalTransactions, setModalTransactions] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalAnalyticName, setModalAnalyticName] = useState<string>('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [bRes, aRes, cRes] = await Promise.all([
        budgetsApi.list({ search: search || undefined }),
        analyticAccountsApi.list(),
        contactsApi.list(),
      ]);
      setBudgets(bRes?.data || []);
      setAnalytics(aRes?.data || []);
      setContacts(cRes?.data || []);
    } catch (err) {
      console.error('Failed to fetch budgets data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [search]);

  // Auto-open new budget form when ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setActiveBudget(null);
      setViewMode('form');
    }
  }, [searchParams]);

  const handleOpenForm = async (budgetId?: number) => {
    setError(null);
    if (budgetId) {
      try {
        const full = await budgetsApi.get(budgetId);
        const b: BudgetRecord = full?.data;
        setActiveBudget(b);
        setName(b.name);
        setStartDate(b.start_date);
        setEndDate(b.end_date);
        setResponsibleId(b.responsible_id ? b.responsible_id.toString() : '');
        setLines(b.computed_lines || []);
      } catch (err) {
        console.error('Failed to load budget record:', err);
      }
    } else {
      setActiveBudget(null);
      setName('');
      setStartDate('2026-01-01');
      setEndDate('2026-01-31');
      setResponsibleId(contacts[0]?.id ? contacts[0].id.toString() : '');
      setLines([
        {
          analytic_account_id: analytics[0]?.id || 1,
          type: 'expense',
          committed_amount: 100000,
        },
      ]);
    }
    setViewMode('form');
  };

  const handleAddLine = () => {
    if (analytics.length === 0) return;
    setLines([
      ...lines,
      {
        analytic_account_id: analytics[0].id,
        type: 'expense',
        committed_amount: 50000,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof BudgetLineItem, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name.trim()) {
      setError('Budget Name is required.');
      setSaving(false);
      return;
    }

    if (lines.length === 0) {
      setError('Please add at least one analytic account budget line.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name,
        start_date: startDate,
        end_date: endDate,
        responsible_id: responsibleId ? parseInt(responsibleId, 10) : null,
        lines: lines.map((l) => ({
          analytic_account_id: l.analytic_account_id,
          type: l.type,
          committed_amount: parseFloat(l.committed_amount as any) || 0,
        })),
      };

      if (activeBudget) {
        await budgetsApi.update(activeBudget.id, payload);
      } else {
        await budgetsApi.create(payload);
      }

      await fetchInitialData();
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
    try {
      const res = await budgetsApi.confirm(activeBudget.id);
      setActiveBudget(res.data);
      await fetchInitialData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to confirm budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevise = async () => {
    if (!activeBudget) return;
    setSaving(true);
    try {
      const res = await budgetsApi.revise(activeBudget.id);
      await fetchInitialData();
      // Open the newly created revised budget
      handleOpenForm(res.data.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to revise budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!activeBudget) return;
    setSaving(true);
    try {
      const res = await budgetsApi.cancel(activeBudget.id);
      setActiveBudget(res.data);
      await fetchInitialData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel budget.');
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

  return (
    <MasterViewLayout
      title={viewMode === 'form' ? (activeBudget ? `Budget: ${activeBudget.name}` : 'New Budget') : 'Analytical Budgets'}
      subtitle={viewMode === 'form' ? 'Lifecycle revision tracking and dimensional budget vs achieved variance' : 'Analytical Budget & Expenditure Management'}
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m)}
      onNew={() => handleOpenForm()}
      onBack={() => setViewMode('list')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search budgets..."
    >
      {/* FORM VIEW */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSaveBudget} className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-6 shadow-obsidian-card space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Top Control Bar matching Excalidraw Stages: Draft, Confirm, Revise, Cancel */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2">
              {/* Draft actions */}
              {(!activeBudget || activeBudget.status === 'draft') && (
                <>
                  <button
                    type="submit"
                    disabled={saving}
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
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-white/[0.08] transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </>
              )}

              {/* Confirmed Stage actions */}
              {activeBudget?.status === 'confirm' && (
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-white/[0.08] transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
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
                  activeBudget.status === 'confirm'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : activeBudget.status === 'revised'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : activeBudget.status === 'cancelled'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'bg-white/[0.08] text-[#c084fc] border border-white/10'
                }`}>
                  {activeBudget.status}
                </span>
              )}
              <button
                type="button"
                onClick={() => setViewMode('list')}
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
                disabled={activeBudget?.status === 'confirm' || activeBudget?.status === 'revised'}
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
                disabled={activeBudget?.status === 'confirm' || activeBudget?.status === 'revised'}
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
                disabled={activeBudget?.status === 'confirm' || activeBudget?.status === 'revised'}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Responsible
              </label>
              <select
                value={responsibleId}
                disabled={activeBudget?.status === 'confirm' || activeBudget?.status === 'revised'}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] disabled:opacity-60"
              >
                <option value="">-- Select Contact / Responsible --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#606070] mt-1 block">
                Select from Contacts Created
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
              {(!activeBudget || activeBudget.status === 'draft') && (
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7042f4]/20 hover:bg-[#7042f4]/30 text-[#c084fc] text-xs font-semibold border border-[#7042f4]/30 transition-all"
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
                      {(!activeBudget || activeBudget.status === 'draft') && (
                        <th className="py-3 px-4 text-center w-12">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {lines.map((line, idx) => {
                      const comm = Number(line.committed_amount) || 0;
                      const ach = Number(line.achieved_amount) || 0;
                      const pct = comm > 0 ? ((ach / comm) * 100).toFixed(1) : '0';
                      const rem = Math.max(0, comm - ach);
                      const anObj = analytics.find((a) => a.id === line.analytic_account_id);
                      const anName = anObj?.name || line.analytic_account_name || 'Analytic';

                      return (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            {activeBudget?.status === 'confirm' || activeBudget?.status === 'revised' ? (
                              <span className="font-semibold text-white">{anName}</span>
                            ) : (
                              <select
                                value={line.analytic_account_id}
                                onChange={(e) => handleLineChange(idx, 'analytic_account_id', parseInt(e.target.value, 10))}
                                className="px-2.5 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-lg text-xs text-white"
                              >
                                {analytics.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name} ({a.type})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {activeBudget?.status === 'confirm' || activeBudget?.status === 'revised' ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                line.type === 'income'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-300'
                              }`}>
                                {line.type}
                              </span>
                            ) : (
                              <select
                                value={line.type}
                                onChange={(e) => handleLineChange(idx, 'type', e.target.value)}
                                className="px-2.5 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-lg text-xs text-white capitalize"
                              >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {activeBudget?.status === 'confirm' || activeBudget?.status === 'revised' ? (
                              <span className="font-mono text-white font-semibold">₹{comm.toLocaleString()}</span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                value={line.committed_amount}
                                onChange={(e) => handleLineChange(idx, 'committed_amount', e.target.value)}
                                className="w-28 text-right px-2.5 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-lg text-xs text-white"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {/* Achieved Amount Clickable Button matching wireframe */}
                            {activeBudget ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAchievedBreakdown(line.analytic_account_id, line.type, anName)}
                                className="font-mono font-semibold text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1"
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
                            <span className="font-mono text-[#a0a0b0] font-semibold">{pct}%</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono text-amber-300 font-semibold">₹{rem.toLocaleString()}</span>
                          </td>
                          {(!activeBudget || activeBudget.status === 'draft') && (
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
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  b.status === 'confirm'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : b.status === 'revised'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-white/[0.08] text-[#c084fc] border border-white/10'
                }`}>
                  {b.status}
                </span>
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
                    className="h-full bg-gradient-to-r from-[#7042f4] to-emerald-400 rounded-full"
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
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {budgets.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => handleOpenForm(b.id)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#7042f4]" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#a0a0b0] font-mono">{b.start_date}</td>
                    <td className="py-3.5 px-4 text-[#a0a0b0] font-mono">{b.end_date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'confirm'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : b.status === 'revised'
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
                ))}
                {budgets.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#707080]">
                      No budgets found. Click "+ New" to create a budget.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
