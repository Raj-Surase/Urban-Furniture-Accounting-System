import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PieChart,
  Plus,
  Check,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Layers,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { BudgetExceededAlert } from '../components/common/BudgetExceededAlert';
import { analyticAccountsApi } from '../lib/api';

interface RelatedBudget {
  budget_id: number;
  budget_name: string;
  start_date: string;
  end_date: string;
  status: string;
  committed: number;
  achieved: number;
  is_exceeded?: boolean;
  exceeded_amount?: number;
  achieved_percent?: number;
}

interface AnalyticAccount {
  id: number;
  name: string;
  code?: string;
  type: 'income' | 'expense';
  description?: string;
  is_active?: boolean;
  related_budgets?: RelatedBudget[];
  has_budget_exceeded?: boolean;
  max_exceeded_amount?: number;
  exceeded_budget_name?: string;
}

export const AnalyticAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [analytics, setAnalytics] = useState<AnalyticAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'form'>('list');
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Form State
  const [activeAccount, setActiveAccount] = useState<AnalyticAccount | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [relatedBudgets, setRelatedBudgets] = useState<RelatedBudget[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await analyticAccountsApi.list({ search: search || undefined });
      setAnalytics(res?.data || []);
    } catch (err) {
      console.error('Failed to load analytic accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search]);

  // Handle URL query parameter ?new=true to open form view
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleOpenForm();
      // Remove query param to keep URL clean
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleOpenForm = async (account?: AnalyticAccount) => {
    setError(null);
    setSuccessMessage(null);
    if (account) {
      setActiveAccount(account);
      setName(account.name);
      setCode(account.code || '');
      setType(account.type);
      setDescription(account.description || '');
      setIsActive(account.is_active !== false);

      try {
        const full = await analyticAccountsApi.get(account.id);
        setRelatedBudgets(full?.data?.related_budgets || []);
      } catch {
        setRelatedBudgets([]);
      }
    } else {
      setActiveAccount(null);
      setName('');
      setCode('');
      setType('expense');
      setDescription('');
      setIsActive(true);
      setRelatedBudgets([]);
    }
    setViewMode('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Analytic Account Name is required.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || null,
        type,
        description: description.trim() || null,
        is_active: isActive,
      };

      if (activeAccount) {
        const res = await analyticAccountsApi.update(activeAccount.id, payload);
        setActiveAccount(res?.data || activeAccount);
        setSuccessMessage('Analytic Account updated successfully!');
      } else {
        const res = await analyticAccountsApi.create(payload);
        setActiveAccount(res?.data || null);
        setSuccessMessage('Analytic Account created successfully!');
      }

      await fetchAccounts();
      setTimeout(() => {
        setViewMode('list');
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      console.error('Save failed:', err);
      const backendMessage =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : null) ||
        'Failed to save Analytic Account.';
      setError(backendMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeAccount) return;
    if (!window.confirm(`Are you sure you want to delete "${activeAccount.name}"?`)) return;

    setDeleting(true);
    setError(null);
    try {
      await analyticAccountsApi.delete(activeAccount.id);
      await fetchAccounts();
      setViewMode('list');
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err?.response?.data?.message || 'Failed to delete Analytic Account.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredAnalytics = analytics.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  return (
    <MasterViewLayout
      title={viewMode === 'form' ? (activeAccount ? `Analytic Account: ${activeAccount.name}` : 'New Analytic Account') : 'Analytic Accounts'}
      subtitle={viewMode === 'form' ? 'Dimensional cost and revenue centers for project budgeting and financial variance tracking' : 'Dimensional cost centers for project budgeting and performance tracking'}
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m)}
      onNew={() => handleOpenForm()}
      onBack={() => setViewMode('list')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search analytic accounts..."
    >
      {viewMode === 'form' ? (
        <form onSubmit={handleSave} className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-6 shadow-obsidian-card space-y-6">
          {/* Real-time Budget Exceeded Limit Alert */}
          {relatedBudgets.some((b) => b.is_exceeded || (b.committed > 0 && b.achieved > b.committed)) && (
            <BudgetExceededAlert
              title="Budget Exceeded Limit Alert"
              subtitle={`Operations on analytic account "${name || activeAccount?.name || 'Account'}" have exceeded the allocated budget limit!`}
              items={relatedBudgets
                .filter((b) => b.is_exceeded || (b.committed > 0 && b.achieved > b.committed))
                .map((b) => ({
                  accountName: name || activeAccount?.name || 'Analytic Account',
                  budgetName: b.budget_name,
                  budgetId: b.budget_id,
                  committed: b.committed,
                  achieved: b.achieved,
                  exceededBy: b.exceeded_amount ?? Math.max(0, b.achieved - b.committed),
                  type,
                }))}
              onReviseBudget={() => navigate('/budgets')}
            />
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : (activeAccount ? 'Save Changes' : 'Confirm & Save')}
              </button>
              <button
                type="button"
                onClick={() => handleOpenForm()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.08]"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
              {activeAccount && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/20 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-[#8a8a9a] hover:text-white border border-white/[0.08]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Analytic Account Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Furniture / Project 1 / Urban Seating"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              />
              <span className="text-[10px] text-[#606070] mt-1 block">
                Unique identifier for tracking dimensional cost/revenue
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ANA-FURN, AC-001"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              />
              <span className="text-[10px] text-[#606070] mt-1 block">
                Short code or reference tag
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              >
                <option value="expense">Expense (Procurement & Vendor Bills)</option>
                <option value="income">Income (Sales & Customer Invoices)</option>
              </select>
              <span className="text-[10px] text-[#606070] mt-1 block">
                Expense matches Vendor Bills; Income matches Sales Invoices
              </span>
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#121216] text-[#7042f4] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-[#a0a0b0] font-medium">
                Active in Accounting Matrices & Invoices
              </span>
            </label>
          </div>

          {/* Description — full width */}
          <div>
            <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for operational purpose, location, or department..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] resize-none"
            />
          </div>

          {/* Sub-Table: All the Budget List where the Analytic Account is used */}
          <div className="pt-4 border-t border-white/[0.08]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#7042f4]" />
              <span>All the Budget List where the Analytic Account is used</span>
            </h3>
            <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#121216]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181f] text-[#707080] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-2.5 px-3">Budget</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">End Date</th>
                    <th className="py-2.5 px-3 text-right">Committed</th>
                    <th className="py-2.5 px-3 text-right">Achieved</th>
                    <th className="py-2.5 px-3 text-right">Achievement %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {relatedBudgets.map((b) => {
                    const achievementPct = b.committed > 0 ? Math.round((b.achieved / b.committed) * 100) : 0;
                    const isRowExceeded = b.is_exceeded || (b.committed > 0 && b.achieved > b.committed);
                    const statusMap: Record<string, string> = {
                      draft: 'bg-[#2a2a3a] text-[#9090a0] border-white/[0.06]',
                      confirm: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                      revised: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                      cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
                    };
                    const statusLabel: Record<string, string> = {
                      draft: 'Draft', confirm: 'Confirmed', revised: 'Revised', cancelled: 'Cancelled',
                    };
                    return (
                      <tr key={b.budget_id} className={isRowExceeded ? 'bg-rose-500/[0.08] hover:bg-rose-500/[0.14] border-l-2 border-rose-500 transition-colors' : 'hover:bg-white/[0.02]'}>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => navigate('/budgets')}
                            className="font-semibold text-[#7042f4] hover:underline text-left flex items-center gap-1.5"
                          >
                            <span>{b.budget_name}</span>
                            {isRowExceeded && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 inline" />}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMap[b.status] || statusMap.draft}`}>
                            {statusLabel[b.status] || b.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#a0a0b0]">{b.start_date}</td>
                        <td className="py-2.5 px-3 text-[#a0a0b0]">{b.end_date}</td>
                        <td className="py-2.5 px-3 text-right text-white font-mono">₹{b.committed.toLocaleString('en-IN')}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-semibold ${isRowExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ₹{b.achieved.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isRowExceeded ? (
                            <div className="flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                {achievementPct}% EXCEEDED
                              </span>
                              <span className="text-[10px] text-rose-400 font-mono mt-0.5">
                                +₹{Math.round(b.exceeded_amount ?? (b.achieved - b.committed)).toLocaleString('en-IN')} over
                              </span>
                            </div>
                          ) : (
                            <span className={`text-xs font-bold font-mono ${achievementPct >= 80 ? 'text-emerald-400' : achievementPct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {achievementPct}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {relatedBudgets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-[#606070]">
                        {activeAccount ? 'No active budgets linked to this analytic account yet.' : 'Budgets using this analytic account will appear here after creation.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === 'all'
                  ? 'bg-[#7042f4] text-white shadow-md'
                  : 'bg-[#18181f] text-[#8a8a9a] hover:text-white border border-white/[0.06]'
              }`}
            >
              All ({analytics.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                typeFilter === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-[#18181f] text-[#8a8a9a] hover:text-white border border-white/[0.06]'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-rose-400" />
              Expense ({analytics.filter((a) => a.type === 'expense').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                typeFilter === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-[#18181f] text-[#8a8a9a] hover:text-white border border-white/[0.06]'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Income ({analytics.filter((a) => a.type === 'income').length})
            </button>
          </div>

          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAnalytics.map((a) => (
                <motion.div
                  key={a.id}
                  onClick={() => handleOpenForm(a)}
                  whileHover={{ y: -3 }}
                  className="p-5 rounded-2xl bg-[#18181f]/90 border border-white/[0.08] hover:border-[#7042f4]/50 shadow-obsidian-card cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#7042f4]/15 border border-[#7042f4]/30 text-[#c084fc]">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{a.name}</h3>
                        {a.code && <span className="text-[10px] font-mono text-[#808090]">{a.code}</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex items-center gap-1 ${
                      a.type === 'income'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {a.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {a.type}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-xs text-[#8a8a9a] line-clamp-2">{a.description}</p>
                  )}
                  {a.has_budget_exceeded && (
                    <div className="pt-2 border-t border-rose-500/20">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold w-full">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                        <span>Budget Exceeded (+₹{Math.round(a.max_exceeded_amount || 0).toLocaleString('en-IN')})</span>
                      </span>
                    </div>
                  )}
                  {a.is_active === false && (
                    <span className="inline-block text-[10px] text-amber-400 font-medium">Inactive</span>
                  )}
                </motion.div>
              ))}
              {filteredAnalytics.length === 0 && !loading && (
                <div className="col-span-full text-center py-12 text-[#707080] bg-[#18181f]/40 border border-white/[0.06] rounded-2xl">
                  No analytic accounts found matching current filters. Click "+ New" to create one.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-obsidian-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141418] text-[#707080] border-b border-white/[0.08] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Analytic Account</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredAnalytics.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => handleOpenForm(a)}
                        className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2 flex-wrap">
                            <FolderTree className="w-4 h-4 text-[#7042f4] shrink-0" />
                            <span>{a.name}</span>
                            {a.has_budget_exceeded && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                Exceeded Limit
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`capitalize px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            a.type === 'income'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                          }`}>
                            {a.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#a0a0b0]">{a.code || '—'}</td>
                        <td className="py-3.5 px-4 text-[#8a8a9a]">{a.description || '—'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            a.is_active !== false
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-white/[0.06] text-[#707080]'
                          }`}>
                            {a.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredAnalytics.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-[#707080]">
                          No analytic accounts found. Click "+ New" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </MasterViewLayout>
  );
};
