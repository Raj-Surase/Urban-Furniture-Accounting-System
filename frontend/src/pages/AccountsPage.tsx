import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Sparkles,
  FolderTree,
  AlertCircle,
  HelpCircle,
  Check,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { BudgetExceededAlert } from '../components/common/BudgetExceededAlert';
import {
  ACCOUNT_CLASSIFICATIONS,
  PRESET_ACCOUNT_TEMPLATES,
  suggestNextAccountCode,
  PresetAccountTemplate,
} from '../constants/formOptions';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Ledger Drawer/Modal State
  const [ledgerAccount, setLedgerAccount] = useState<any>(null);
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [ledgerExceededBudgets, setLedgerExceededBudgets] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Inline Ledger Drilldown State
  const [expandedLedgerId, setExpandedLedgerId] = useState<number | null>(null);
  const [expandedLedgerLines, setExpandedLedgerLines] = useState<any[]>([]);
  const [expandedExceededBudgets, setExpandedExceededBudgets] = useState<any[]>([]);
  const [expandedLedgerLoading, setExpandedLedgerLoading] = useState(false);

  const handleToggleExpandLedger = async (acc: any) => {
    if (expandedLedgerId === acc.id) {
      setExpandedLedgerId(null);
      return;
    }
    setExpandedLedgerId(acc.id);
    setExpandedLedgerLines([]);
    setExpandedExceededBudgets([]);
    try {
      setExpandedLedgerLoading(true);
      const res = await accountsApi.getLedger(acc.id);
      const raw =
        res?.ledger?.data ??
        res?.ledger ??
        res?.data ??
        res?.lines ??
        res ??
        [];
      setExpandedLedgerLines(Array.isArray(raw) ? raw : []);
      setExpandedExceededBudgets(res?.exceeded_budgets || []);
    } catch (err) {
      console.error(err);
      setExpandedLedgerLines([]);
      setExpandedExceededBudgets([]);
    } finally {
      setExpandedLedgerLoading(false);
    }
  };

  // New Account Modal State
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'custom' | 'preset'>('custom');
  const [selectedPresetCode, setSelectedPresetCode] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('asset');
  const [subType, setSubType] = useState<string>('cash_bank');
  const [parentId, setParentId] = useState<number | ''>('');
  const [normalBalance, setNormalBalance] = useState<'debit' | 'credit'>('debit');
  const [openingBalance, setOpeningBalance] = useState<string>('0');
  const [description, setDescription] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await accountsApi.list();
      const accountList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setAccounts(accountList);
    } catch (err) {
      console.error(err);
      setAccounts([]);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load chart of accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    const handleRoleUpdated = () => {
      fetchAccounts();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, []);

  const handleOpenLedger = async (acc: any) => {
    setLedgerAccount(acc);
    setLedgerLines([]);
    setLedgerExceededBudgets([]);
    setIsLedgerOpen(true);
    try {
      setLedgerLoading(true);
      const res = await accountsApi.getLedger(acc.id);
      const raw =
        res?.ledger?.data ??
        res?.ledger ??
        res?.data ??
        res?.lines ??
        res ??
        [];
      const lines = Array.isArray(raw) ? raw : [];
      setLedgerLines(lines);
      setLedgerExceededBudgets(res?.exceeded_budgets || []);
    } catch (err) {
      console.error(err);
      setLedgerLines([]);
      setLedgerExceededBudgets([]);
      addToast({ type: 'error', title: 'Error', message: 'Could not fetch account ledger.' });
    } finally {
      setLedgerLoading(false);
    }
  };

  // Update suggested code and default normal balance when classification or subType changes
  useEffect(() => {
    if (creationMode !== 'custom') return;

    const config = ACCOUNT_CLASSIFICATIONS[type];
    if (config) {
      setNormalBalance(config.normalBalance);

      if (!isCodeManuallyEdited) {
        const sub = config.subTypes.find((s) => s.key === subType);
        const prefix = sub?.suggestedPrefix || config.prefix;
        const fallback = prefix + '10';
        const existingCodes = accounts.map((a) => String(a.code));
        const suggested = suggestNextAccountCode(existingCodes, prefix, fallback);
        setCode(suggested);
      }
    }
  }, [type, subType, accounts, creationMode, isCodeManuallyEdited]);

  const handleOpenNewModal = () => {
    setFieldErrors({});
    setFormError(null);
    setCreationMode('custom');
    setSelectedPresetCode('');
    setIsCodeManuallyEdited(false);
    setType('asset');
    setSubType('cash_bank');
    setName('');
    setDescription('');
    setOpeningBalance('0');
    setParentId('');

    // Pre-suggest initial code
    const existingCodes = accounts.map((a) => String(a.code));
    const suggested = suggestNextAccountCode(existingCodes, '111', '1111');
    setCode(suggested);
    setNormalBalance('debit');

    setIsNewOpen(true);
  };

  const handlePresetSelect = (presetCode: string) => {
    setSelectedPresetCode(presetCode);
    const template = PRESET_ACCOUNT_TEMPLATES.find((t) => t.code === presetCode);
    if (!template) return;

    setCode(template.code);
    setName(template.name);
    setType(template.type);
    setSubType(template.subType);
    setNormalBalance(template.normalBalance);
    setDescription(template.description);
    setIsCodeManuallyEdited(true);
    setFieldErrors({});
    setFormError(null);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    if (!code.trim()) errors.code = 'Account Code is required.';
    if (!name.trim()) errors.name = 'Account Title is required.';
    if (!type) errors.type = 'Account Classification is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast({ type: 'warning', title: 'Validation Error', message: 'Please fix the highlighted fields.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const openingNum = parseFloat(openingBalance.trim()) || 0;
      await accountsApi.create({
        code: code.trim(),
        name: name.trim(),
        type,
        sub_type: subType || null,
        parent_id: parentId ? Number(parentId) : null,
        normal_balance: normalBalance,
        opening_balance: openingNum,
        description: description.trim() || null,
      });

      addToast({ type: 'success', title: 'Account Created', message: `${code.trim()} - ${name.trim()} added to Chart of Accounts.` });
      setIsNewOpen(false);
      fetchAccounts();
    } catch (err: any) {
      const formatted = formatApiError(err);
      setFormError(formatted.message);
      if (formatted.fieldErrors && Object.keys(formatted.fieldErrors).length > 0) {
        setFieldErrors(formatted.fieldErrors);
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

  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter((acc) => {
    const matchesSearch =
      acc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || acc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeOrderMap: Record<string, number> = {
    asset: 1,
    liability: 2,
    equity: 3,
    revenue: 4,
    expense: 5,
  };

  const typeMeta: Record<string, { label: string; range: string; color: string; badge: string }> = {
    asset: { label: 'Assets', range: '1000 - 1999', color: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    liability: { label: 'Liabilities & Statutory GST', range: '2000 - 2999', color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    equity: { label: 'Equity & Capital Reserves', range: '3000 - 3999', color: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    revenue: { label: 'Revenue & Operating Income', range: '4000 - 4999', color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    expense: { label: 'Cost of Goods Sold & Expenses', range: '5000 - 5999', color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  };

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    const tA = typeOrderMap[a.type] || 99;
    const tB = typeOrderMap[b.type] || 99;
    if (tA !== tB) return tA - tB;
    return String(a.code || '').localeCompare(String(b.code || ''));
  });

  let lastAccountType = '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-purple-400" />
            Chart of Accounts & General Ledger
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Standard double-entry chart of accounts, GST statutory ledgers, and running balances.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <Button
            onClick={handleOpenNewModal}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-2 shadow-lg shadow-purple-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add General Ledger Account
          </Button>
        )}
      </div>

      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search code or account title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 w-64"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Account Types</option>
              <option value="asset">Assets (1xxx)</option>
              <option value="liability">Liabilities & GST (2xxx)</option>
              <option value="equity">Equity (3xxx)</option>
              <option value="revenue">Revenue (4xxx)</option>
              <option value="expense">Expenses & COGS (5xxx)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Normal Balance</th>
                <th className="py-3 px-4 text-right">Current Balance (₹)</th>
                <th className="py-3 px-4 text-right">Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <TableSkeleton columns={6} rows={6} />
              ) : sortedAccounts.length === 0 ? (
                <EmptyState
                  colSpan={6}
                  icon={BookOpen}
                  title="No accounts found"
                  description={
                    searchQuery
                      ? 'No chart accounts match your search filter.'
                      : 'Initialize standard chart of accounts or create custom ledgers.'
                  }
                  actionLabel={isAdmin || isManager ? 'Add General Ledger Account' : undefined}
                  onAction={isAdmin || isManager ? handleOpenNewModal : undefined}
                />
              ) : (
                sortedAccounts.map((acc) => {
                  const isNewGroup = acc.type !== lastAccountType;
                  if (isNewGroup) {
                    lastAccountType = acc.type;
                  }
                  const isExpanded = expandedLedgerId === acc.id;

                  return (
                    <React.Fragment key={acc.id}>
                      {isNewGroup && (
                        <tr className="bg-[#181822] border-y border-white/[0.08]">
                          <td colSpan={6} className="py-2.5 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${typeMeta[acc.type]?.badge || ''}`}>
                                  {typeMeta[acc.type]?.label || acc.type}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400">
                                  {typeMeta[acc.type]?.range}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-500 font-medium">
                                {sortedAccounts.filter((a) => a.type === acc.type).length} accounts
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr
                        onClick={() => handleToggleExpandLedger(acc)}
                        className={`hover:bg-white/[0.04] transition-colors cursor-pointer group ${
                          isExpanded ? 'bg-purple-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-purple-400 group-hover:underline">
                          {acc.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{acc.name}</span>
                            {isExpanded && (
                              <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                Ledger Open
                              </span>
                            )}
                          </div>
                          {acc.description && (
                            <span className="block text-[10px] text-neutral-500 font-normal">
                              {acc.description}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              acc.type === 'asset'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : acc.type === 'liability'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : acc.type === 'equity'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : acc.type === 'revenue'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {acc.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-neutral-400 uppercase text-[10px]">
                          {acc.type === 'asset' || acc.type === 'expense' ? 'Debit' : 'Credit'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          ₹{Number(acc.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleExpandLedger(acc)}
                              className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                              title="Toggle inline ledger"
                            >
                              {isExpanded ? 'Collapse' : 'Drilldown'}
                            </button>
                            <button
                              onClick={() => handleOpenLedger(acc)}
                              className="px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                              title="Open Full Ledger Modal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline Expanded Ledger View */}
                      {isExpanded && (
                        <tr className="bg-[#121218]">
                          <td colSpan={6} className="p-4 border-y border-purple-500/20">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white font-mono">
                                    Ledger: {acc.code} — {acc.name}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    Normal Balance: {acc.type === 'asset' || acc.type === 'expense' ? 'Debit' : 'Credit'}
                                  </span>
                                </div>
                                <div className="text-xs font-mono font-bold text-white">
                                  Ending Balance: ₹{Number(acc.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              </div>

                              {expandedExceededBudgets.length > 0 && (
                                <div className="py-1">
                                  <BudgetExceededAlert
                                    compact
                                    items={expandedExceededBudgets.map((b) => ({
                                      accountName: b.analytic_name,
                                      budgetName: b.budget_name,
                                      budgetId: b.budget_id,
                                      committed: b.committed_amount,
                                      achieved: b.achieved_amount,
                                      exceededBy: b.exceeded_amount,
                                    }))}
                                  />
                                </div>
                              )}

                              {expandedLedgerLoading ? (
                                <div className="py-4 text-center text-xs text-neutral-400">Loading ledger entries…</div>
                              ) : expandedLedgerLines.length === 0 ? (
                                <div className="py-4 text-center text-xs text-neutral-500">
                                  No transaction journal lines found for this account.
                                </div>
                              ) : (
                                <div className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.06]">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-[#161620] text-[10px] text-neutral-400 uppercase font-bold sticky top-0">
                                      <tr>
                                        <th className="py-2 px-3">Date</th>
                                        <th className="py-2 px-3">Entry #</th>
                                        <th className="py-2 px-3">Description</th>
                                        <th className="py-2 px-3 text-right">Debit (₹)</th>
                                        <th className="py-2 px-3 text-right">Credit (₹)</th>
                                        <th className="py-2 px-3 text-right">Running (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04]">
                                      {expandedLedgerLines.map((line, idx) => (
                                        <tr key={line.id || idx} className="hover:bg-white/[0.02]">
                                          <td className="py-1.5 px-3 font-mono text-neutral-400 text-[11px]">
                                            {line.journal_entry?.posting_date
                                              ? String(line.journal_entry.posting_date).slice(0, 10)
                                              : line.entry_date || (line.created_at ? String(line.created_at).slice(0, 10) : '-')}
                                          </td>
                                          <td className="py-1.5 px-3 font-mono text-purple-300">
                                            {line.journal_entry?.entry_number || line.reference || '-'}
                                          </td>
                                          <td className="py-1.5 px-3 text-neutral-300">
                                            {line.description || line.journal_entry?.description || '-'}
                                          </td>
                                          <td className="py-1.5 px-3 text-right font-mono text-neutral-200">
                                            {Number(line.debit) > 0 ? `₹${Number(line.debit).toLocaleString('en-IN')}` : '-'}
                                          </td>
                                          <td className="py-1.5 px-3 text-right font-mono text-neutral-200">
                                            {Number(line.credit) > 0 ? `₹${Number(line.credit).toLocaleString('en-IN')}` : '-'}
                                          </td>
                                          <td className="py-1.5 px-3 text-right font-mono font-bold text-white">
                                            ₹{Number(line.running_balance || 0).toLocaleString('en-IN')}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ledger Drawer/Modal */}
      <PortalModal
        isOpen={isLedgerOpen && Boolean(ledgerAccount)}
        onClose={() => setIsLedgerOpen(false)}
        zIndex="z-[60]"
        maxWidth="max-w-3xl"
      >
        {ledgerAccount && (
          <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121216]">
              <div>
                <h3 className="text-base font-bold font-mono">
                  {ledgerAccount.code} - {ledgerAccount.name}
                </h3>
                <p className="text-xs text-neutral-400">Account General Ledger Activity & Running Balance</p>
              </div>
              <button onClick={() => setIsLedgerOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Budget Limit Exceeded Alert Banner */}
              {ledgerExceededBudgets.length > 0 && (
                <div className="mb-4">
                  <BudgetExceededAlert
                    title="Budget Limit Exceeded Alert"
                    subtitle={`Analytic accounts associated with ${ledgerAccount.name} have exceeded approved budget limits!`}
                    items={ledgerExceededBudgets.map((b) => ({
                      accountName: b.analytic_name,
                      budgetName: b.budget_name,
                      budgetId: b.budget_id,
                      committed: b.committed_amount,
                      achieved: b.achieved_amount,
                      exceededBy: b.exceeded_amount,
                      type: 'expense',
                      message: `Actual: ₹${Number(b.achieved_amount).toLocaleString('en-IN')} vs Committed: ₹${Number(b.committed_amount).toLocaleString('en-IN')} (${b.percentage}%)`,
                    }))}
                    onReviseBudget={(bId) => {
                      setIsLedgerOpen(false);
                      navigate(bId ? `/accounting/budgets?id=${bId}` : '/accounting/budgets');
                    }}
                  />
                </div>
              )}

              {ledgerLoading ? (
                <div className="py-12 text-center text-neutral-400">Loading ledger lines...</div>
              ) : !Array.isArray(ledgerLines) || ledgerLines.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 italic">No transactions posted to this account yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase">
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Entry #</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 text-right">Debit (₹)</th>
                      <th className="py-2 px-2 text-right">Credit (₹)</th>
                      <th className="py-2 px-2 text-right">Running (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {ledgerLines.map((line, idx) => (
                      <tr key={line.id || idx} className="hover:bg-white/[0.01]">
                        <td className="py-2 px-2 text-neutral-400 font-mono text-[11px]">
                          {line.journal_entry?.posting_date
                            ? String(line.journal_entry.posting_date).slice(0, 10)
                            : line.entry_date || (line.created_at ? String(line.created_at).slice(0, 10) : '-')}
                        </td>
                        <td className="py-2 px-2 font-mono text-purple-300">
                          {line.journal_entry?.entry_number || line.reference || '-'}
                        </td>
                        <td className="py-2 px-2 text-neutral-300">
                          {line.description || line.journal_entry?.description || '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-neutral-200">
                          {Number(line.debit) > 0 ? `₹${Number(line.debit).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-neutral-200">
                          {Number(line.credit) > 0 ? `₹${Number(line.credit).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-white">
                          ₹{Number(line.running_balance || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </PortalModal>

      {/* New Account Modal */}
      <PortalModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        zIndex="z-[60]"
        maxWidth="max-w-2xl"
      >
        <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121216]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Add General Ledger Account
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Double-Entry Chart
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Standard double-entry chart of accounts with statutory code classification.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNewOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="px-6 pt-4 pb-0 bg-[#141418] flex gap-2 border-b border-neutral-800/60">
            <button
              type="button"
              onClick={() => setCreationMode('custom')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                creationMode === 'custom'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Custom Ledger (Intelligent Code Gen)
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('preset')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                creationMode === 'preset'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Standard Corporate Presets
            </button>
          </div>

          <form onSubmit={handleCreateAccount} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            {creationMode === 'preset' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Select Standard Statutory Ledger <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedPresetCode}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select from standard statutory templates...</option>
                    {PRESET_ACCOUNT_TEMPLATES.map((t) => {
                      const alreadyExists = accounts.some((a) => String(a.code) === t.code);
                      return (
                        <option key={t.code} value={t.code} disabled={alreadyExists}>
                          {t.code} - {t.name} ({t.type.toUpperCase()}) {alreadyExists ? '— (Already exists)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Select a standard corporate or GST ledger to auto-fill statutory code, classification, and normal balance.
                  </p>
                </div>

                {selectedPresetCode && (
                  <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-400 text-sm">{code}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        {type} · Normal {normalBalance}
                      </span>
                    </div>
                    <div className="font-semibold text-white">{name}</div>
                    <div className="text-neutral-400 text-[11px]">{description}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Account Classification Buttons */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                    Account Classification <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {Object.entries(ACCOUNT_CLASSIFICATIONS).map(([key, config]) => {
                      const isSelected = type === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setType(key);
                            setSubType(config.subTypes[0]?.key || '');
                            setIsCodeManuallyEdited(false);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/30'
                              : 'bg-[#1a1a22] border-neutral-700/60 text-neutral-400 hover:text-white hover:border-neutral-600'
                          }`}
                        >
                          <div className="text-[11px] font-bold capitalize">{key}</div>
                          <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{config.prefix}xxx</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Sub-Type Selection */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Account Group / Sub-Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={subType}
                    onChange={(e) => {
                      setSubType(e.target.value);
                      setIsCodeManuallyEdited(false);
                    }}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {(ACCOUNT_CLASSIFICATIONS[type]?.subTypes || []).map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.name} ({st.suggestedPrefix}xx) — {st.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Code & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-300">
                        Account Code <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-purple-400">
                        {isCodeManuallyEdited ? 'Custom' : 'Suggested'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setIsCodeManuallyEdited(true);
                          if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: '' }));
                        }}
                        required
                        placeholder="e.g. 1135"
                        className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white font-mono font-bold focus:outline-none ${
                          fieldErrors.code
                            ? 'border-rose-500 ring-1 ring-rose-500'
                            : 'border-neutral-700 focus:border-purple-500'
                        }`}
                      />
                    </div>
                    {fieldErrors.code && (
                      <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.code}</span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Account Title / Ledger Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      required
                      placeholder="e.g. Teak Wood Seasoning & Inventory"
                      className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                        fieldErrors.name
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-neutral-700 focus:border-purple-500'
                      }`}
                    />
                    {fieldErrors.name && (
                      <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.name}</span>
                    )}
                  </div>
                </div>

                {/* 4. Parent Account & Normal Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1 flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-neutral-400" />
                      Parent Account (Hierarchical Grouping)
                    </label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">None (Top-level Ledger)</option>
                      {accounts
                        .filter((a) => a.type === type)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Normal Balance
                    </label>
                    <div className="flex items-center gap-2 h-9">
                      <span
                        className={`text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-lg border flex-1 text-center ${
                          normalBalance === 'debit'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {normalBalance} Normal
                      </span>
                      <span className="text-[11px] text-neutral-400 leading-tight">
                        {normalBalance === 'debit' ? 'Increased by Debits' : 'Increased by Credits'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Opening Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Opening Balance (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Description / Statutory Purpose
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Raw teakwood timber holding"
                      className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
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
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Create General Ledger Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </PortalModal>
    </div>
  );
};

