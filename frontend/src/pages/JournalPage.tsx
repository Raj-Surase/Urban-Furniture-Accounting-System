import React, { useEffect, useState } from 'react';
import {
  FileCode2,
  Plus,
  RotateCcw,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { journalApi, accountsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const JournalPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});

  // New Journal Entry Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<
    Array<{ account_id: number | ''; debit: number; credit: number; description: string }>
  >([
    { account_id: '', debit: 0, credit: 0, description: '' },
    { account_id: '', debit: 0, credit: 0, description: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const [jRes, accRes] = await Promise.all([journalApi.list(), accountsApi.list()]);
      setEntries(jRes.data || jRes || []);
      setAccounts(accRes.data || accRes || []);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load journal entries.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedEntries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReverse = async (id: number) => {
    if (!confirm('Are you sure you want to reverse this journal entry? A contra-entry will be posted.')) {
      return;
    }
    try {
      await journalApi.reverse(id);
      addToast({
        type: 'success',
        title: 'Entry Reversed',
        message: 'A reversing contra journal entry was successfully posted.',
      });
      fetchEntries();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Reverse Failed', message: err.response?.data?.message || 'Error' });
    }
  };

  // Calculate totals for manual entry modal
  const totalDebits = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleAddLine = () => {
    setLines([...lines, { account_id: '', debit: 0, credit: 0, description: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      addToast({
        type: 'warning',
        title: 'Unbalanced Entry',
        message: 'Total Debits must exactly equal Total Credits before posting.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await journalApi.create({
        entry_date: entryDate,
        reference_number: reference,
        description,
        source: 'manual',
        lines: lines.map((l) => ({
          account_id: l.account_id,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          description: l.description || description,
        })),
      });

      addToast({
        type: 'success',
        title: 'Journal Entry Posted',
        message: 'Balanced double-entry journal posted to General Ledger.',
      });
      setIsNewOpen(false);
      setLines([
        { account_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', debit: 0, credit: 0, description: '' },
      ]);
      fetchEntries();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Post Failed', message: err.response?.data?.message || 'Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = entries.filter(
    (je) =>
      je.entry_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      je.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      je.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileCode2 className="w-7 h-7 text-indigo-400" />
            General Ledger & Journal Entries
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Immutable double-entry transaction log, automated system postings, and audit trails.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <Button
            onClick={() => setIsNewOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Post Manual Journal Entry
          </Button>
        )}
      </div>

      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search entry #, reference, or narration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-72"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Entry Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Narration / Description</th>
                <th className="py-3 px-4">Origin / Source</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    Loading journal entries...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500 italic">
                    No journal entries recorded.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((je) => {
                  const isExpanded = !!expandedEntries[je.id];
                  const entryTotal = (je.lines || []).reduce(
                    (s: number, l: any) => s + Number(l.debit || 0),
                    0
                  );

                  return (
                    <React.Fragment key={je.id}>
                      <tr
                        onClick={() => toggleExpand(je.id)}
                        className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 text-neutral-500">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{je.entry_number}</td>
                        <td className="py-3 px-4 text-neutral-400">{je.entry_date}</td>
                        <td className="py-3 px-4 text-neutral-200">
                          <div>{je.description}</div>
                          {je.reference_number && (
                            <div className="text-[10px] text-neutral-500 font-mono">Ref: {je.reference_number}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-neutral-300 border border-white/10 uppercase">
                            {je.source || 'manual'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ₹{entryTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-400">
                          ₹{entryTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {je.is_reversed ? (
                            <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              Reversed
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Posted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {!je.is_reversed && (isAdmin || isManager) && (
                            <button
                              onClick={() => handleReverse(je.id)}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-600 hover:text-white text-neutral-400 transition-colors"
                              title="Reverse this Journal Entry"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Sub-lines */}
                      {isExpanded && (
                        <tr className="bg-[#121218] border-b border-white/[0.04]">
                          <td colSpan={9} className="p-4 pl-12">
                            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] text-neutral-400 uppercase">
                                    <th className="py-2 px-3">Account Code</th>
                                    <th className="py-2 px-3">Account Name</th>
                                    <th className="py-2 px-3">Narration</th>
                                    <th className="py-2 px-3 text-right">Debit (₹)</th>
                                    <th className="py-2 px-3 text-right">Credit (₹)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                  {(je.lines || []).map((line: any) => (
                                    <tr key={line.id} className="hover:bg-white/[0.01]">
                                      <td className="py-2 px-3 font-mono text-purple-400">
                                        {line.account?.code || '—'}
                                      </td>
                                      <td className="py-2 px-3 font-semibold text-white">
                                        {line.account?.name || 'Account'}
                                      </td>
                                      <td className="py-2 px-3 text-neutral-400 text-[11px]">
                                        {line.description || je.description}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-emerald-400">
                                        {Number(line.debit) > 0
                                          ? `₹${Number(line.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                          : '—'}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-indigo-400">
                                        {Number(line.credit) > 0
                                          ? `₹${Number(line.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                          : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

      {/* New Manual Journal Entry Modal */}
      {isNewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-3xl bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Post General Ledger Journal Entry</h3>
              <button onClick={() => setIsNewOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Entry Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ADJ-2026-001"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Description / Narration</label>
                <input
                  type="text"
                  placeholder="e.g. Month-end inventory adjustment for timber scrap / COGS"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                />
              </div>

              {/* Lines Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-neutral-400">
                  <span>Debits & Credits</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="border border-neutral-800 rounded-xl overflow-hidden bg-[#181820]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 text-[10px] uppercase">
                        <th className="py-2.5 px-3">Account</th>
                        <th className="py-2.5 px-2">Line Narration</th>
                        <th className="py-2.5 px-2 w-28 text-right">Debit (₹)</th>
                        <th className="py-2.5 px-2 w-28 text-right">Credit (₹)</th>
                        <th className="py-2.5 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <select
                              value={line.account_id}
                              onChange={(e) => {
                                const updated = [...lines];
                                updated[idx].account_id = Number(e.target.value);
                                setLines(updated);
                              }}
                              required
                              className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white"
                            >
                              <option value="">Select Account...</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} - {a.name} ({a.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="Line description"
                              value={line.description}
                              onChange={(e) => {
                                const updated = [...lines];
                                updated[idx].description = e.target.value;
                                setLines(updated);
                              }}
                              className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={line.debit}
                              onChange={(e) => {
                                const updated = [...lines];
                                updated[idx].debit = Number(e.target.value);
                                if (Number(e.target.value) > 0) updated[idx].credit = 0;
                                setLines(updated);
                              }}
                              className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white text-right font-mono"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={line.credit}
                              onChange={(e) => {
                                const updated = [...lines];
                                updated[idx].credit = Number(e.target.value);
                                if (Number(e.target.value) > 0) updated[idx].debit = 0;
                                setLines(updated);
                              }}
                              className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded text-xs text-white text-right font-mono"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            {lines.length > 2 && (
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
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Balance validation bar */}
                <div className="p-3 bg-[#181820] border border-neutral-800 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="flex gap-4">
                    <span>
                      Total Debits: <strong className="text-emerald-400">₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </span>
                    <span>
                      Total Credits: <strong className="text-indigo-400">₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>

                  <div>
                    {isBalanced ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> BALANCED
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        DIFF: ₹{Math.abs(totalDebits - totalCredits).toFixed(2)} (Out of Balance)
                      </span>
                    )}
                  </div>
                </div>
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
                  disabled={!isBalanced || isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {isSubmitting ? 'Posting...' : 'Post Journal Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

