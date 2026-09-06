import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileCode2,
  Plus,
  RotateCcw,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Scale,
  Sparkles,
  Trash2,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { journalApi, accountsApi, journalsApi, contactsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ExcalidrawGuideBanner } from '../components/common/ExcalidrawGuideBanner';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import { AccountClassification } from '../types';

const journalFilterConfigs: FieldFilterConfig[] = [
  { key: 'entry_number', label: 'Entry Number', type: 'text', placeholder: 'e.g. JE-2026...' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'Narration...' },
  { key: 'reference_number', label: 'Reference', type: 'text', placeholder: 'Ref...' },
  {
    key: 'derived_status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Posted', value: 'posted' },
      { label: 'Reversed', value: 'reversed' },
    ],
  },
  { key: 'entry_total', label: 'Amount (₹)', type: 'number', placeholder: 'Min ₹...' },
];

const journalColumnDefs: ColumnFilterDef[] = [
  { key: 'expand', filterType: 'none' },
  { key: 'entry_number', filterType: 'text', placeholder: 'Filter entry #...' },
  { key: 'journal', filterType: 'text', placeholder: 'Journal...' },
  { key: 'partner', filterType: 'text', placeholder: 'Partner...' },
  { key: 'date', filterType: 'date' },
  { key: 'description', filterType: 'text', placeholder: 'Narration...' },
  { key: 'source', filterType: 'text', placeholder: 'Source...' },
  { key: 'entry_total', filterType: 'number', placeholder: 'Min debit...' },
  { key: 'credit_total', filterType: 'none' },
  {
    key: 'derived_status',
    filterType: 'select',
    options: [
      { label: 'Posted', value: 'posted' },
      { label: 'Reversed', value: 'reversed' },
    ],
  },
  { key: 'actions', filterType: 'none' },
];

// Standard corporate journal entry templates
const JOURNAL_PRESETS = [
  {
    name: 'Depreciation Expense',
    description: 'Monthly plant, machinery & showroom fixtures depreciation',
    debitType: AccountClassification.EXPENSE,
    creditType: AccountClassification.ASSET,
    debitCodeHint: '5200',
    creditCodeHint: '1220',
  },
  {
    name: 'Salaries & Wages',
    description: 'Accrual of monthly carpenter wages & corporate salaries',
    debitType: AccountClassification.EXPENSE,
    creditType: AccountClassification.LIABILITY,
    debitCodeHint: '5300',
    creditCodeHint: '2130',
  },
  {
    name: 'Workshop Rent',
    description: 'Monthly furniture manufacturing facility rental',
    debitType: AccountClassification.EXPENSE,
    creditType: AccountClassification.LIABILITY,
    debitCodeHint: '5210',
    creditCodeHint: '2110',
  },
  {
    name: 'Factory Utilities',
    description: 'Electricity & utility bills accrual',
    debitType: AccountClassification.EXPENSE,
    creditType: AccountClassification.LIABILITY,
    debitCodeHint: '5220',
    creditCodeHint: '2110',
  },
  {
    name: 'Bank Charges',
    description: 'Bank processing fees and financial transaction charges',
    debitType: AccountClassification.EXPENSE,
    creditType: AccountClassification.ASSET,
    debitCodeHint: '5240',
    creditCodeHint: '1110',
  },
];

export const JournalPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});

  // Field & Column Filter States
  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Journal Entry Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [journalId, setJournalId] = useState<number | ''>('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<
    Array<{ account_id: number | ''; partner_id?: number | ''; debit: number; credit: number; description: string }>
  >([
    { account_id: '', partner_id: '', debit: 0, credit: 0, description: '' },
    { account_id: '', partner_id: '', debit: 0, credit: 0, description: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Entry Modal
  const [detailEntry, setDetailEntry] = useState<any>(null);

  const auxLoadedRef = useRef(false);
  const [loadingAux, setLoadingAux] = useState(false);

  const ensureAuxiliaryData = useCallback(async () => {
    if (auxLoadedRef.current) return;
    setLoadingAux(true);
    try {
      const [accRes, journalsRes, contactsRes] = await Promise.all([
        accountsApi.list({ per_page: 'all' }).catch(() => ({ data: [] })),
        journalsApi.list({ per_page: 'all' }).catch(() => ({ data: [] })),
        contactsApi.list({ per_page: 'all' }).catch(() => ({ data: [] })),
      ]);
      setAccounts(accRes.data || accRes || []);
      const jList = Array.isArray(journalsRes?.data) ? journalsRes.data : Array.isArray(journalsRes) ? journalsRes : [];
      setJournals(jList);
      const cList = Array.isArray(contactsRes?.data) ? contactsRes.data : Array.isArray(contactsRes) ? contactsRes : [];
      setContacts(cList);
      auxLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load journal auxiliary data:', err);
    } finally {
      setLoadingAux(false);
    }
  }, []);

  const handleOpenNewModal = useCallback(() => {
    ensureAuxiliaryData();
    setIsNewOpen(true);
  }, [ensureAuxiliaryData]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const jRes = await journalApi.list({ per_page: 'all' });
      const entryList = Array.isArray(jRes?.data) ? jRes.data : Array.isArray(jRes) ? jRes : [];
      setEntries(entryList);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load journal entries.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();

    const handleRoleUpdated = () => {
      fetchEntries();
      if (auxLoadedRef.current) {
        auxLoadedRef.current = false;
        ensureAuxiliaryData();
      }
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, [ensureAuxiliaryData]);

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

  // Group accounts by classification for semantic dropdown optgroups
  const groupedAccounts = {
    [AccountClassification.ASSET]: accounts.filter((a) => a.type === AccountClassification.ASSET),
    [AccountClassification.LIABILITY]: accounts.filter((a) => a.type === AccountClassification.LIABILITY),
    [AccountClassification.EQUITY]: accounts.filter((a) => a.type === AccountClassification.EQUITY),
    [AccountClassification.REVENUE]: accounts.filter((a) => a.type === AccountClassification.REVENUE),
    [AccountClassification.EXPENSE]: accounts.filter((a) => a.type === AccountClassification.EXPENSE),
  };

  const applyPreset = (preset: typeof JOURNAL_PRESETS[0]) => {
    setDescription(preset.description);
    const debitAcc =
      accounts.find((a) => a.code === preset.debitCodeHint) ||
      accounts.find((a) => a.type === preset.debitType);
    const creditAcc =
      accounts.find((a) => a.code === preset.creditCodeHint) ||
      accounts.find((a) => a.type === preset.creditType && a.id !== debitAcc?.id);

    setLines([
      { account_id: debitAcc ? debitAcc.id : '', debit: 0, credit: 0, description: preset.description },
      { account_id: creditAcc ? creditAcc.id : '', debit: 0, credit: 0, description: preset.description },
    ]);
    addToast({
      type: 'info',
      title: 'Template Applied',
      message: `Loaded accounts for "${preset.name}". Fill in voucher amounts.`,
    });
  };

  const handleAutoBalance = () => {
    const diff = totalDebits - totalCredits;
    if (Math.abs(diff) < 0.01) return;

    if (diff > 0) {
      const posDiff = Number(diff.toFixed(2));
      const lastLine = lines[lines.length - 1];
      if (lastLine && !lastLine.debit && !lastLine.credit) {
        const updated = [...lines];
        updated[lines.length - 1].credit = posDiff;
        setLines(updated);
      } else {
        setLines([
          ...lines,
          { account_id: '', debit: 0, credit: posDiff, description: description || 'Balancing line' },
        ]);
      }
    } else {
      const posDiff = Number(Math.abs(diff).toFixed(2));
      const lastLine = lines[lines.length - 1];
      if (lastLine && !lastLine.debit && !lastLine.credit) {
        const updated = [...lines];
        updated[lines.length - 1].debit = posDiff;
        setLines(updated);
      } else {
        setLines([
          ...lines,
          { account_id: '', debit: posDiff, credit: 0, description: description || 'Balancing line' },
        ]);
      }
    }
  };

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
        journal_id: journalId ? Number(journalId) : undefined,
        posting_date: entryDate,
        entry_date: entryDate,
        reference_number: reference,
        description,
        source: 'manual',
        lines: lines.map((l) => ({
          account_id: l.account_id,
          partner_id: l.partner_id ? Number(l.partner_id) : null,
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
      setJournalId('');
      setReference('');
      setDescription('');
      setLines([
        { account_id: '', partner_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', partner_id: '', debit: 0, credit: 0, description: '' },
      ]);
      fetchEntries();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Post Failed', message: err.response?.data?.message || 'Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const preparedEntries = React.useMemo(() => {
    return (entries || []).map((je) => {
      const entryTotal = (je.lines || []).reduce(
        (s: number, l: any) => s + Number(l.debit || 0),
        0
      );
      const status = je.is_reversed ? 'reversed' : 'posted';
      const date = je.posting_date || je.entry_date || '';
      return {
        ...je,
        entry_total: entryTotal,
        derived_status: status,
        date,
        journal_name: je.journal?.name || 'General',
      };
    });
  }, [entries]);

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = journalFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key === 'journal' ? 'journal_name' : key,
          operator: cfg?.type === 'number' || cfg?.type === 'date' ? 'gte' : cfg?.type === 'select' ? 'equals' : 'contains',
          value: val.trim(),
        });
      }
    });
    if (statusFilter !== 'all') {
      merged.push({
        id: 'quick-status',
        field: 'derived_status',
        operator: 'equals',
        value: statusFilter,
      });
    }
    return merged;
  }, [activeFilters, columnFilters, statusFilter]);

  const filteredEntries = React.useMemo(() => {
    return filterItems(
      preparedEntries,
      searchQuery,
      ['entry_number', 'description', 'reference_number', 'journal_name'],
      allActiveFilters
    );
  }, [preparedEntries, searchQuery, allActiveFilters]);

  const {
    visibleItems: visibleEntries,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredEntries,
    pageSize: 15,
    isLoading: loading,
  });

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
            onClick={handleOpenNewModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Post Manual Journal Entry
          </Button>
        )}
      </div>

      <ExcalidrawGuideBanner
        module="Account (Master Data)"
        concept="General Ledger & Balanced Double-Entry Rule"
        description="The heart of the Excalidraw accounting architecture: every financial transaction must satisfy the fundamental accounting equation (Total Debits == Total Credits). System journals (Sales, Purchase, Bank, Cash, General) automatically post immutable entries upon transaction confirmation."
        accountingRules={[
          {
            type: 'Debit',
            account: 'Asset Increase / Expense Incurred',
            amountDesc: 'Sum of all debit lines',
          },
          {
            type: 'Credit',
            account: 'Liability Increase / Revenue Earned / Asset Decrease',
            amountDesc: 'Sum of all credit lines (Must strictly equal Debit)',
          },
        ]}
        badges={['Debit = Credit Rule', 'Multi-Currency / GST Ready', 'Auditable Reversal Workflow', 'Automated Posting']}
        defaultOpen={false}
      />

      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <FieldFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search entry #, reference, or narration..."
          filterConfigs={journalFilterConfigs}
          activeFilters={activeFilters}
          onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
          onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
          onClearAll={() => {
            setSearchQuery('');
            setActiveFilters([]);
            setColumnFilters({});
            setStatusFilter('all');
          }}
          presets={{
            field: 'status',
            currentValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Entries', value: 'all' },
              { label: 'Posted', value: 'posted' },
              { label: 'Reversed', value: 'reversed' },
            ],
          }}
          showColumnFilters={showColumnFilters}
          onToggleColumnFilters={() => setShowColumnFilters(!showColumnFilters)}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Entry Number</th>
                <th className="py-3 px-4">Journal</th>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Narration / Description</th>
                <th className="py-3 px-4">Origin / Source</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
              {showColumnFilters && (
                <ColumnFilterRow
                  columns={journalColumnDefs}
                  values={columnFilters}
                  onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                />
              )}
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <TableSkeleton columns={11} rows={6} />
              ) : visibleEntries.length === 0 ? (
                <EmptyState
                  colSpan={11}
                  icon={FileCode2}
                  title="No journal entries recorded"
                  description={
                    searchQuery
                      ? 'No journal entries match your search criteria.'
                      : 'Post manual journal entries or generate operational transactions to populate the ledger.'
                  }
                  actionLabel={isAdmin || isManager ? 'Post Journal Entry' : undefined}
                  onAction={isAdmin || isManager ? handleOpenNewModal : undefined}
                />
              ) : (
                visibleEntries.map((je) => {
                  const isExpanded = !!expandedEntries[je.id];
                  const entryTotal = (je.lines || []).reduce(
                    (s: number, l: any) => s + Number(l.debit || 0),
                    0
                  );
                  const partnerName = (je.lines || [])
                    .map((l: any) => contacts.find((c: any) => c.id === l.partner_id)?.name)
                    .filter(Boolean)[0] || '—';

                  return (
                    <React.Fragment key={je.id}>
                      <tr
                        onClick={() => setDetailEntry(je)}
                        className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
                      >
                        <td
                          className="py-3 px-4 text-neutral-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(je.id);
                          }}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-indigo-400 group-hover:underline">
                          {je.entry_number}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {je.journal?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-300">
                          {partnerName !== '—' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              {partnerName}
                            </span>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">{je.posting_date || je.entry_date}</td>
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
                          <td colSpan={11} className="p-4 pl-12">
                            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] text-neutral-400 uppercase">
                                    <th className="py-2 px-3">Account Code</th>
                                    <th className="py-2 px-3">Account Name</th>
                                    <th className="py-2 px-3">Partner</th>
                                    <th className="py-2 px-3">Narration</th>
                                    <th className="py-2 px-3 text-right">Debit (₹)</th>
                                    <th className="py-2 px-3 text-right">Credit (₹)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                  {(je.lines || []).map((line: any) => {
                                    const linePartner = contacts.find((c: any) => c.id === line.partner_id)?.name || '—';
                                    return (
                                      <tr key={line.id} className="hover:bg-white/[0.01]">
                                        <td className="py-2 px-3 font-mono text-purple-400">
                                          {line.account?.code || '—'}
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-white">
                                          {line.account?.name || 'Account'}
                                        </td>
                                        <td className="py-2 px-3 text-neutral-300 text-[11px]">
                                          {linePartner !== '—' ? (
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">
                                              {linePartner}
                                            </span>
                                          ) : (
                                            '—'
                                          )}
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
                                    );
                                  })}
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
              {loadingMore && (
                <TableSkeleton isPaginationLoader columns={10} rows={3} />
              )}
            </tbody>
          </table>
        </div>

        <ScrollSentinel
          sentinelRef={sentinelRef}
          loadingMore={loadingMore}
          hasMore={hasMore}
          totalCount={totalCount}
          visibleCount={visibleEntries.length}
          onLoadMore={loadMore}
          entityName="journal entries"
        />
      </Card>

      {/* New Manual Journal Entry Modal */}
      <PortalModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        zIndex="z-[60]"
        maxWidth="max-w-4xl"
        containerClassName="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Post General Ledger Journal Entry</h3>
                <p className="text-xs text-neutral-400">
                  Record balanced double-entry adjustments, depreciation, accruals & manual ledger transfers
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNewOpen(false)}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Quick Presets Strip */}
          <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Quick Journal Presets:
            </div>
            <div className="flex flex-wrap gap-2">
              {JOURNAL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 text-xs bg-[#1a1a22] hover:bg-purple-600/20 hover:text-purple-300 hover:border-purple-500/30 border border-neutral-700 rounded-lg text-neutral-300 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateEntry} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Journal Registry</label>
                <select
                  value={journalId}
                  onChange={(e) => setJournalId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">General / Operations</option>
                  {journals.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Entry / Posting Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Reference / Document #</label>
                <input
                  type="text"
                  placeholder="e.g. JV-2026-004, Cheque #8812"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Narration / Description</label>
              <input
                type="text"
                placeholder="e.g. Monthly manufacturing facility rent & workshop power accrual"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
                  Journal Lines ({lines.length})
                </label>
                <div className="flex items-center gap-2">
                  {!isBalanced && (totalDebits > 0 || totalCredits > 0) && (
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center gap-1 font-medium transition-colors"
                    >
                      <Wand2 className="w-3.5 h-3.5" /> Auto-Balance Line
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLine}
                    className="text-xs h-7 gap-1 border-neutral-700 text-neutral-300 hover:bg-white/[0.05]"
                  >
                    <Plus className="w-3 h-3" /> Add Account Line
                  </Button>
                </div>
              </div>

              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-black/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1a1a22] border-b border-neutral-800 text-neutral-400">
                    <tr>
                      <th className="py-2.5 px-3 w-[30%]">General Ledger Account</th>
                      <th className="py-2.5 px-3 w-[22%]">Partner</th>
                      <th className="py-2.5 px-3">Narration (Optional)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Credit (₹)</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-2">
                          <select
                            value={line.account_id}
                            onChange={(e) => {
                              const updated = [...lines];
                              updated[idx].account_id = e.target.value ? Number(e.target.value) : '';
                              setLines(updated);
                            }}
                            required
                            className="w-full px-2 py-1.5 bg-[#121216] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">Select GL Account...</option>
                            {groupedAccounts[AccountClassification.ASSET].length > 0 && (
                              <optgroup label="Assets (1000s) — Dr">
                                {groupedAccounts[AccountClassification.ASSET].map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {groupedAccounts[AccountClassification.LIABILITY].length > 0 && (
                              <optgroup label="Liabilities (2000s) — Cr">
                                {groupedAccounts[AccountClassification.LIABILITY].map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {groupedAccounts[AccountClassification.EQUITY].length > 0 && (
                              <optgroup label="Equity (3000s) — Cr">
                                {groupedAccounts[AccountClassification.EQUITY].map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {groupedAccounts[AccountClassification.REVENUE].length > 0 && (
                              <optgroup label="Revenue (4000s) — Cr">
                                {groupedAccounts[AccountClassification.REVENUE].map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {groupedAccounts[AccountClassification.EXPENSE].length > 0 && (
                              <optgroup label="Expenses (5000s) — Dr">
                                {groupedAccounts[AccountClassification.EXPENSE].map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={line.partner_id || ''}
                            onChange={(e) => {
                              const updated = [...lines];
                              updated[idx].partner_id = e.target.value ? Number(e.target.value) : '';
                              setLines(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-[#121216] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">No Partner</option>
                            {contacts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.contact_type || 'contact'})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder={description || 'Line item narration'}
                            value={line.description}
                            onChange={(e) => {
                              const updated = [...lines];
                              updated[idx].description = e.target.value;
                              setLines(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-[#121216] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={line.debit || ''}
                            onChange={(e) => {
                              const updated = [...lines];
                              const val = parseFloat(e.target.value) || 0;
                              updated[idx].debit = val;
                              if (val > 0) updated[idx].credit = 0;
                              setLines(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-[#121216] border border-neutral-700 rounded-lg text-xs text-right text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={line.credit || ''}
                            onChange={(e) => {
                              const updated = [...lines];
                              const val = parseFloat(e.target.value) || 0;
                              updated[idx].credit = val;
                              if (val > 0) updated[idx].debit = 0;
                              setLines(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-[#121216] border border-neutral-700 rounded-lg text-xs text-right text-indigo-400 font-mono font-bold focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {lines.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="text-neutral-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Balance Verification Footer */}
              <div className="p-3.5 bg-black/40 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2">
                <div className="flex items-center space-x-4">
                  <span>
                    Total Debits: <strong className="text-emerald-400">₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </span>
                  <span>
                    Total Credits: <strong className="text-indigo-400">₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>

                <div>
                  {isBalanced ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-sans text-xs">
                      <ShieldCheck className="w-4 h-4" /> BALANCED & VERIFIED
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 font-sans text-xs">
                        <AlertCircle className="w-4 h-4" /> DIFF: ₹{Math.abs(totalDebits - totalCredits).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoBalance}
                        className="text-[11px] px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 flex items-center gap-1 font-sans font-semibold transition-colors"
                      >
                        <Wand2 className="w-3 h-3" /> Auto-Balance
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
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
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
              >
                {isSubmitting ? 'Posting...' : 'Post Journal Entry'}
              </Button>
            </div>
          </form>
        </div>
      </PortalModal>

      {/* Journal Entry Detail Modal */}
      <PortalModal
        isOpen={Boolean(detailEntry)}
        onClose={() => setDetailEntry(null)}
        zIndex="z-[60]"
        maxWidth="max-w-2xl"
      >
        {detailEntry && (
          <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{detailEntry.entry_number}</span>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      detailEntry.is_reversed
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {detailEntry.is_reversed ? 'Reversed' : 'Posted'}
                  </span>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-neutral-300 border border-white/10 uppercase">
                    {detailEntry.source || 'manual'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">{detailEntry.description}</h3>
                {detailEntry.reference_number && (
                  <p className="text-xs text-neutral-400 font-mono">Reference: {detailEntry.reference_number}</p>
                )}
              </div>
              <button
                onClick={() => setDetailEntry(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Posting Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Posting Date</div>
                <div className="font-mono font-bold text-white mt-0.5">{detailEntry.posting_date || detailEntry.entry_date}</div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Total Debits</div>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">
                  ₹{(detailEntry.lines || []).reduce((s: number, l: any) => s + Number(l.debit || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Total Credits</div>
                <div className="font-mono font-bold text-indigo-400 mt-0.5">
                  ₹{(detailEntry.lines || []).reduce((s: number, l: any) => s + Number(l.credit || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Double Entry Lines Table */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Double-Entry Postings</h4>
              <div className="border border-white/[0.08] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-bold text-neutral-400 uppercase">
                      <th className="py-2.5 px-3">Account</th>
                      <th className="py-2.5 px-3">Narration</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(detailEntry.lines || []).map((line: any) => (
                      <tr key={line.id} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-purple-400 mr-2">{line.account?.code || '—'}</span>
                          <span className="font-semibold text-white">{line.account?.name || 'Account'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                          {line.description || detailEntry.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {Number(line.debit) > 0
                            ? `₹${Number(line.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-400 font-semibold">
                          {Number(line.credit) > 0
                            ? `₹${Number(line.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] text-neutral-500 font-mono">
                Entry ID #{detailEntry.id}
              </div>
              <div className="flex items-center gap-2">
                {!detailEntry.is_reversed && (isAdmin || isManager) && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await handleReverse(detailEntry.id);
                      setDetailEntry(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reverse Journal Entry
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailEntry(null)}
                  className="border-neutral-700 bg-neutral-800 text-neutral-300 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </PortalModal>
    </div>
  );
};

