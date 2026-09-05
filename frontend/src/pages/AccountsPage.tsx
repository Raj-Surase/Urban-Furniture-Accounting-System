import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { accountsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const AccountsPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Ledger Drawer/Modal State
  const [ledgerAccount, setLedgerAccount] = useState<any>(null);
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // New Account Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('asset');
  const [description, setDescription] = useState('');
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
    } catch (err) {
      console.error(err);
      setLedgerLines([]);
      addToast({ type: 'error', title: 'Error', message: 'Could not fetch account ledger.' });
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await accountsApi.create({
        code,
        name,
        type,
        description,
      });
      addToast({ type: 'success', title: 'Account Created', message: `${code} - ${name} added.` });
      setIsNewOpen(false);
      setCode('');
      setName('');
      setDescription('');
      fetchAccounts();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Creation Failed', message: err.response?.data?.message || 'Failed' });
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
            onClick={() => setIsNewOpen(true)}
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
              ) : filteredAccounts.length === 0 ? (
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
                  onAction={isAdmin || isManager ? () => setIsNewOpen(true) : undefined}
                />
              ) : (
                filteredAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => handleOpenLedger(acc)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-purple-400 group-hover:underline">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {acc.name}
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
                      <button
                        onClick={() => handleOpenLedger(acc)}
                        className="px-2 py-1 rounded bg-white/[0.04] hover:bg-purple-600 hover:text-white text-neutral-300 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ledger View
                      </button>
                    </td>
                  </tr>
                ))
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
        maxWidth="max-w-md"
      >
        <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-4 shadow-2xl">
          <h3 className="text-base font-bold">Add Account to Chart</h3>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Account Code</label>
              <input
                type="text"
                placeholder="e.g. 1130 or 5010"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Account Title</label>
              <input
                type="text"
                placeholder="e.g. Teakwood Raw Materials Inventory"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Account Classification</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
              >
                <option value="asset">Asset (1xxx) — Cash, HDFC Bank, Inventory, AR</option>
                <option value="liability">Liability (2xxx) — AP, GST Payables, Advances</option>
                <option value="equity">Capital / Equity (3xxx) — Owner Capital, Reserves</option>
                <option value="revenue">Income / Revenue (4xxx) — Furniture Sales, Service Fees</option>
                <option value="expense">Expense (5xxx) — COGS, Workshop Rent, Scrap</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Description / Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      </PortalModal>
    </div>
  );
};

