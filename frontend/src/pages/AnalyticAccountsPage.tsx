import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PieChart, Plus, Check, ArrowLeft, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { analyticAccountsApi } from '../lib/api';

interface RelatedBudget {
  budget_id: number;
  budget_name: string;
  start_date: string;
  end_date: string;
  status: string;
  committed: number;
  achieved: number;
}

interface AnalyticAccount {
  id: number;
  name: string;
  code?: string;
  type: 'income' | 'expense';
  description?: string;
  related_budgets?: RelatedBudget[];
}

export const AnalyticAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'form'>('list');
  const [search, setSearch] = useState<string>('');

  // Form State
  const [activeAccount, setActiveAccount] = useState<AnalyticAccount | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState<string>('');
  const [relatedBudgets, setRelatedBudgets] = useState<RelatedBudget[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleOpenForm = async (account?: AnalyticAccount) => {
    if (account) {
      setActiveAccount(account);
      setName(account.name);
      setCode(account.code || '');
      setType(account.type);
      setDescription(account.description || '');

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
      setRelatedBudgets([]);
    }
    setError(null);
    setViewMode('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name.trim()) {
      setError('Analytic Account Name is required.');
      setSaving(false);
      return;
    }

    try {
      const payload = { name, code, type, description };
      if (activeAccount) {
        await analyticAccountsApi.update(activeAccount.id, payload);
      } else {
        await analyticAccountsApi.create(payload);
      }
      await fetchAccounts();
      setViewMode('list');
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err?.response?.data?.message || 'Failed to save Analytic Account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MasterViewLayout
      title={viewMode === 'form' ? (activeAccount ? 'Analytic Account Form' : 'New Analytic Account') : 'Analytic Accounts'}
      subtitle="Dimensional cost centers for project budgeting and performance tracking"
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
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenForm()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.08]"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-[#8a8a9a] hover:text-white border border-white/[0.08]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. AC-001"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              />
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
                <option value="income">Income (Sales & Invoices)</option>
              </select>
              <span className="text-[10px] text-[#606070] mt-1 block">
                Drop down selection: Income / Expense
              </span>
            </div>
          </div>

          {/* Description — full width */}
          <div>
            <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this analytic account..."
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
                      <tr key={b.budget_id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => navigate('/budgets')}
                            className="font-semibold text-[#7042f4] hover:underline text-left"
                          >
                            {b.budget_name}
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
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">₹{b.achieved.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-xs font-bold font-mono ${achievementPct >= 80 ? 'text-emerald-400' : achievementPct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {achievementPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {relatedBudgets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-[#606070]">
                        No active budgets linked to this analytic account yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.map((a) => (
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
            </motion.div>
          ))}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {analytics.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => handleOpenForm(a)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#7042f4]" />
                      <span>{a.name}</span>
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
                  </tr>
                ))}
                {analytics.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[#707080]">
                      No analytic accounts found. Click "+ New" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MasterViewLayout>
  );
};
