import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Check, ArrowLeft, Building2 } from 'lucide-react';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { journalsApi, accountsApi } from '../lib/api';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import { JournalType } from '../types';

const journalDefFilterConfigs: FieldFilterConfig[] = [
  { key: 'name', label: 'Journal Name', type: 'text', placeholder: 'e.g. Sales...' },
  {
    key: 'type',
    label: 'Journal Type',
    type: 'select',
    options: [
      { label: 'Sales', value: JournalType.SALES },
      { label: 'Purchase', value: JournalType.PURCHASE },
      { label: 'Bank', value: JournalType.BANK },
      { label: 'Cash', value: JournalType.CASH },
      { label: 'General', value: JournalType.GENERAL },
    ],
  },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'Search notes...' },
];

const journalDefColumnDefs: ColumnFilterDef[] = [
  { key: 'name', filterType: 'text', placeholder: 'Filter name...' },
  {
    key: 'type',
    filterType: 'select',
    options: [
      { label: 'Sales', value: JournalType.SALES },
      { label: 'Purchase', value: JournalType.PURCHASE },
      { label: 'Bank', value: JournalType.BANK },
      { label: 'Cash', value: JournalType.CASH },
      { label: 'General', value: JournalType.GENERAL },
    ],
  },
  { key: 'default_account_name', filterType: 'text', placeholder: 'Filter account...' },
  { key: 'description', filterType: 'text', placeholder: 'Filter notes...' },
  { key: 'actions', filterType: 'none' },
];

interface Journal {
  id: number;
  name: string;
  type: JournalType;
  default_account_id?: number;
  default_account?: {
    id: number;
    code: string;
    name: string;
  };
  description?: string;
}

export const JournalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'form'>('list');
  const [search, setSearch] = useState<string>('');

  // Filter States
  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Form State
  const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<JournalType>(JournalType.SALES);
  const [defaultAccountId, setDefaultAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const accountsLoadedRef = useRef(false);

  const fetchJournals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await journalsApi.list({ per_page: 'all' });
      setJournals(res?.data || []);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureAccounts = useCallback(async () => {
    if (accountsLoadedRef.current) return;
    try {
      const aRes = await accountsApi.list({ per_page: 'all' });
      setAccounts(aRes?.data || []);
      accountsLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleOpenForm = (journal?: Journal) => {
    ensureAccounts();
    if (journal) {
      setActiveJournal(journal);
      setName(journal.name);
      setType(journal.type);
      setDefaultAccountId(journal.default_account_id ? journal.default_account_id.toString() : '');
      setDescription(journal.description || '');
    } else {
      setActiveJournal(null);
      setName('');
      setType(JournalType.SALES);
      setDefaultAccountId('');
      setDescription('');
    }
    setError(null);
    setViewMode('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name.trim()) {
      setError('Journal Name is required.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name,
        type,
        default_account_id: defaultAccountId ? parseInt(defaultAccountId, 10) : null,
        description: description.trim() || null,
      };

      if (activeJournal) {
        await journalsApi.update(activeJournal.id, payload);
      } else {
        await journalsApi.create(payload);
      }

      await fetchJournals();
      setViewMode('list');
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err?.response?.data?.message || 'Failed to save Journal.');
    } finally {
      setSaving(false);
    }
  };

  const preparedJournals = React.useMemo(() => {
    return (journals || []).map((j) => ({
      ...j,
      default_account_name: j.default_account ? `${j.default_account.name} (${j.default_account.code})` : '',
    }));
  }, [journals]);

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = journalDefFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key,
          operator: cfg?.type === 'select' ? 'equals' : 'contains',
          value: val.trim(),
        });
      }
    });
    if (typeFilter !== 'all') {
      merged.push({
        id: 'quick-type',
        field: 'type',
        operator: 'equals',
        value: typeFilter,
      });
    }
    return merged;
  }, [activeFilters, columnFilters, typeFilter]);

  const filteredJournals = React.useMemo(() => {
    return filterItems(
      preparedJournals,
      search,
      ['name', 'type', 'default_account_name', 'description'],
      allActiveFilters
    );
  }, [preparedJournals, search, allActiveFilters]);

  const {
    visibleItems: visibleJournals,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredJournals,
    pageSize: 15,
    isLoading: loading,
  });

  return (
    <MasterViewLayout
      title={viewMode === 'form' ? (activeJournal ? 'Edit Journal' : 'New Journal') : 'Journals'}
      subtitle="Financial journal registries configuring default accounts and ledger behavior"
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m)}
      onNew={() => handleOpenForm()}
      onBack={() => setViewMode('list')}
    >
      {viewMode === 'form' ? (
        <form onSubmit={handleSave} className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-6 shadow-obsidian-card space-y-6 max-w-2xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Action buttons */}
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

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Journal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales / Purchase / Bank / Cash"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Journal Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              >
                <option value={JournalType.SALES}>Sales</option>
                <option value={JournalType.PURCHASE}>Purchase</option>
                <option value={JournalType.BANK}>Bank</option>
                <option value={JournalType.CASH}>Cash</option>
                <option value={JournalType.GENERAL}>General</option>
              </select>
              <span className="text-[10px] text-[#606070] mt-1 block">
                Select from Sales, Purchase, Bank, Cash
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Default Account
              </label>
              <select
                value={defaultAccountId}
                onChange={(e) => setDefaultAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              >
                <option value="">-- Select from Chart of Accounts (Many to one) --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#606070] mt-1 block">
                From Chart of Accounts (Many to one)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Description / Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Operational purpose of this journal (e.g. Customer Sales Invoices & Credit Memos)"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] resize-none"
              />
            </div>

            {activeJournal && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/journal?search=${encodeURIComponent(activeJournal.name)}`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20 text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span>Inspect Entries for {activeJournal.name}</span>
                  <span>View Journal Entries →</span>
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <FieldFilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search journals by name, type, account..."
            filterConfigs={journalDefFilterConfigs}
            activeFilters={activeFilters}
            onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
            onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
            onClearAll={() => {
              setActiveFilters([]);
              setColumnFilters({});
              setSearch('');
              setTypeFilter('all');
            }}
            presets={{
              field: 'type',
              currentValue: typeFilter,
              onChange: setTypeFilter,
              options: [
                { label: 'All Types', value: 'all' },
                { label: 'Sales', value: JournalType.SALES },
                { label: 'Purchase', value: JournalType.PURCHASE },
                { label: 'Bank', value: JournalType.BANK },
                { label: 'Cash', value: JournalType.CASH },
                { label: 'General', value: JournalType.GENERAL },
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
                    <th className="py-3.5 px-4">Journal Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Default Account</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                  {showColumnFilters && (
                    <ColumnFilterRow
                      columns={journalDefColumnDefs}
                      values={columnFilters}
                      onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                    />
                  )}
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading && visibleJournals.length === 0 ? (
                    <TableSkeleton columns={5} rows={6} />
                  ) : (
                    visibleJournals.map((j) => (
                      <tr
                        key={j.id}
                        onClick={() => handleOpenForm(j)}
                        className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#7042f4]" />
                          <span>{j.name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] text-[#c084fc] border border-white/[0.06]">
                            {j.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#a0a0b0]">
                          {j.default_account ? `${j.default_account.name} (${j.default_account.code})` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-[#8a8a9a] max-w-xs truncate">
                          {j.description || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/journal?search=${encodeURIComponent(j.name)}`)}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-purple-600 hover:text-white text-[#a0a0b0] text-[11px] font-semibold transition-colors"
                            title="View Journal Entries for this journal"
                          >
                            Entries →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {loadingMore && (
                    <TableSkeleton isPaginationLoader columns={5} rows={3} />
                  )}
                  {visibleJournals.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[#707080]">
                        No journals found matching the filters. Click "+ New" to create one.
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
              visibleCount={visibleJournals.length}
              onLoadMore={loadMore}
              entityName="journals"
            />
          </div>
        </div>
      )}
    </MasterViewLayout>
  );
};
