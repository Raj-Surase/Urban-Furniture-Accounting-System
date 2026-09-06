import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  AlertCircle,
  X,
  CreditCard,
  FolderTree,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { vendorsApi, accountsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RolePortalBanner } from '../components/common/RolePortalBanner';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import {
  INDIAN_STATES,
  PAYMENT_TERMS_OPTIONS,
  extractPanFromGstin,
  getStateFromGstin,
} from '../constants/formOptions';
import { AccountClassification } from '../types';

const vendorFilterConfigs: FieldFilterConfig[] = [
  { key: 'name', label: 'Vendor Name', type: 'text', placeholder: 'Name...' },
  { key: 'company_name', label: 'Company / Business', type: 'text', placeholder: 'Company...' },
  { key: 'gstin', label: 'GSTIN', type: 'text', placeholder: 'GSTIN...' },
  { key: 'pan', label: 'PAN', type: 'text', placeholder: 'PAN...' },
  { key: 'state', label: 'State', type: 'text', placeholder: 'State...' },
  { key: 'email', label: 'Email', type: 'text', placeholder: 'Email...' },
  { key: 'phone', label: 'Phone', type: 'text', placeholder: 'Phone...' },
  { key: 'outstanding_balance', label: 'Outstanding Payable', type: 'number', placeholder: 'Min ₹...' },
];

const vendorColumnDefs: ColumnFilterDef[] = [
  { key: 'name', filterType: 'text', placeholder: 'Filter vendor...' },
  { key: 'gstin', filterType: 'text', placeholder: 'Filter GSTIN...' },
  { key: 'state', filterType: 'text', placeholder: 'Filter state...' },
  { key: 'email', filterType: 'text', placeholder: 'Filter contact...' },
  { key: 'outstanding_balance', filterType: 'number', placeholder: 'Min payable...' },
];

export const VendorsPage: React.FC = () => {
  const { user, isAdmin, isManager, isAccountant } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [address, setAddress] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [payableAccountId, setPayableAccountId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Vendor Detail Modal State
  const [detailVendor, setDetailVendor] = useState<any>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const [venRes, accRes] = await Promise.all([
        vendorsApi.list(),
        accountsApi.list().catch(() => ({ data: [] })),
      ]);
      const list = venRes?.data || venRes || [];
      setVendors(Array.isArray(list) ? list : []);
      const accList = accRes?.data || accRes || [];
      setAccounts(Array.isArray(accList) ? accList : []);
      const defaultAp = (Array.isArray(accList) ? accList : []).find((a: any) => a.code === '2110');
      if (defaultAp && !payableAccountId) {
        setPayableAccountId(defaultAp.id);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load vendors.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();

    const handleRoleUpdated = () => {
      fetchVendors();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, []);

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setGstin('');
    setPan('');
    setEmail('');
    setPhone('');
    setState('Maharashtra');
    setAddress('');
    setPaymentTermsDays(30);
    const defaultAp = accounts.find((a: any) => a.code === '2110');
    setPayableAccountId(defaultAp ? defaultAp.id : '');
    setFieldErrors({});
    setFormError(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase();
    setGstin(upper);
    const extractedState = getStateFromGstin(upper);
    if (extractedState) {
      setState(extractedState.name);
    }
    const extractedPan = extractPanFromGstin(upper);
    if (extractedPan) {
      setPan(extractedPan);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Supplier or Company name is required.';
    if (!state.trim()) errors.state = 'State selection is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast({ type: 'warning', title: 'Validation', message: 'Please fill in the required fields.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await vendorsApi.create({
        name: name.trim(),
        contact_person: contactPerson.trim() || undefined,
        gstin: gstin.trim() || undefined,
        pan: pan.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        state: state.trim(),
        address: address.trim() || undefined,
        payment_terms_days: paymentTermsDays,
        payable_account_id: payableAccountId ? Number(payableAccountId) : undefined,
      });
      addToast({ type: 'success', title: 'Vendor Added', message: `${name.trim()} has been added.` });
      setIsModalOpen(false);
      resetForm();
      fetchVendors();
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

  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = vendorFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key,
          operator: cfg?.type === 'number' ? 'gte' : 'contains',
          value: val.trim(),
        });
      }
    });
    return merged;
  }, [activeFilters, columnFilters]);

  const filteredVendors = React.useMemo(() => {
    return filterItems(
      Array.isArray(vendors) ? vendors : [],
      searchQuery,
      ['name', 'company_name', 'gstin', 'pan', 'state', 'email', 'phone'],
      allActiveFilters
    );
  }, [vendors, searchQuery, allActiveFilters]);

  const {
    visibleItems: visibleVendors,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredVendors,
    pageSize: 15,
  });

  const isElevated = isAdmin || isManager || isAccountant;

  if (!isElevated) {
    const myVendor = vendors.length > 0 ? vendors[0] : null;

    return (
      <div className="space-y-6">
        <RolePortalBanner entityName="Vendor Profile" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Truck className="w-7 h-7 text-indigo-400" />
              My Vendor Profile
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Your registered supplier profile, tax identity, and accounts payable settlement records.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => navigate('/bills')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20 text-xs font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4" />
              View Bills
            </Button>
            <Button
              onClick={() => navigate('/purchase-orders')}
              className="bg-[#1e1e28] hover:bg-[#252533] text-amber-300 border border-amber-500/30 text-xs font-semibold gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              Purchase Orders
            </Button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton columns={3} rows={4} />
        ) : !myVendor ? (
          <Card className="p-8 text-center bg-[#141418] border-white/[0.06] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Linked Vendor Profile</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Your user account ({user?.email}) has not been linked to an active supplier/vendor profile yet. Once your vendor agreement is approved by the procurement team, your full details will appear here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Info */}
            <Card className="lg:col-span-2 p-6 bg-[#141418] border-white/[0.06] rounded-2xl space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20">
                    {myVendor.name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white tracking-tight">{myVendor.name}</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {myVendor.code || `VEND-${myVendor.id}`}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {myVendor.company_name || 'Timber & Materials Supplier'}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Vendor</span>
                </div>
              </div>

              {/* Tax & GST Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-neutral-400 block">
                    GSTIN Registration
                  </span>
                  <div className="font-mono text-sm font-semibold text-indigo-300">
                    {myVendor.gstin || 'Unregistered Supplier'}
                  </div>
                  <div className="text-xs text-neutral-400">
                    State: <span className="text-white font-medium">{myVendor.state || 'Maharashtra'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-neutral-400 block">
                    Permanent Account Number (PAN)
                  </span>
                  <div className="font-mono text-sm font-semibold text-white">
                    {myVendor.pan || 'N/A'}
                  </div>
                  <div className="text-xs text-neutral-400">
                    Contact: <span className="text-white font-medium">{myVendor.contact_person || user?.name}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Business Address & Communication
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Email & Contact</span>
                    </div>
                    <div className="text-white font-medium">{myVendor.email || user?.email || 'N/A'}</div>
                    <div className="text-neutral-400 mt-0.5">{myVendor.phone || user?.phone || 'N/A'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Operational Facility Address</span>
                    </div>
                    <div className="text-neutral-300">{myVendor.billing_address || myVendor.address || 'Registered Office'}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Ledger Summary */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-indigo-500/10 via-[#181820] to-[#121216] border-indigo-500/20 rounded-2xl space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                  Total Outstanding Payable
                </span>
                <div className="text-3xl font-extrabold font-mono text-indigo-300">
                  ₹{Number(myVendor.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Payment Terms:</span>
                    <span className="text-white font-semibold">{myVendor.payment_terms_days || 30} Days</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Payable A/C (2110):</span>
                    <span className="text-white font-semibold font-mono">
                      Accounts Payable
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => navigate('/bills')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl shadow-md shadow-indigo-600/20"
                  >
                    View Vendor Bills
                  </Button>
                  <Button
                    onClick={() => navigate('/purchase-orders')}
                    variant="outline"
                    className="w-full border-white/10 text-neutral-300 hover:text-white text-xs py-2.5 rounded-xl"
                  >
                    Track Purchase Orders
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-indigo-400" />
            Vendor Directory & Supply Base
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Timber mills, hardware distributors, GST compliance, and Accounts Payable tracking.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <Button
            onClick={handleOpenModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Supplier / Vendor
          </Button>
        )}
      </div>

      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <FieldFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search vendor, company or GSTIN..."
          filterConfigs={vendorFilterConfigs}
          activeFilters={activeFilters}
          onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
          onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
          onClearAll={() => {
            setSearchQuery('');
            setActiveFilters([]);
            setColumnFilters({});
          }}
          showColumnFilters={showColumnFilters}
          onToggleColumnFilters={() => setShowColumnFilters((prev) => !prev)}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Vendor & Company</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">Location / State</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Outstanding Payable</th>
              </tr>
              {showColumnFilters && (
                <ColumnFilterRow
                  columns={vendorColumnDefs}
                  values={columnFilters}
                  onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                />
              )}
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <TableSkeleton columns={5} rows={6} />
              ) : visibleVendors.length === 0 ? (
                <EmptyState
                  colSpan={5}
                  icon={Truck}
                  title="No vendors found"
                  description={
                    searchQuery || activeFilters.length > 0
                      ? 'No suppliers match your search and filter criteria. Try adjusting your filters.'
                      : 'Add your raw material suppliers, timber mills, and hardware vendors.'
                  }
                  actionLabel={isAdmin || isManager ? 'Add Supplier / Vendor' : undefined}
                  onAction={isAdmin || isManager ? () => setIsModalOpen(true) : undefined}
                  secondaryActionLabel={searchQuery || activeFilters.length > 0 ? 'Clear Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearchQuery('');
                    setActiveFilters([]);
                    setColumnFilters({});
                  }}
                />
              ) : (
                visibleVendors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setDetailVendor(v)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white group-hover:text-indigo-400 group-hover:underline transition-colors">{v.name}</div>
                      <div className="text-[10.5px] text-neutral-400">{v.company_name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="text-indigo-300">{v.gstin || 'Unregistered'}</div>
                      <div className="text-[10px] text-neutral-500">PAN: {v.pan || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      <div>{v.state || 'Maharashtra'}</div>
                      <div className="text-[10.5px] text-neutral-500 truncate max-w-xs">{v.address}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div>{v.email || 'N/A'}</div>
                      <div className="text-[10.5px] text-neutral-500">{v.phone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      ₹{Number(v.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ScrollSentinel
          sentinelRef={sentinelRef}
          loadingMore={loadingMore}
          hasMore={hasMore}
          totalCount={totalCount}
          visibleCount={visibleVendors.length}
          onLoadMore={loadMore}
          entityName="vendors"
        />
      </Card>

      {/* Add Vendor Modal */}
      <PortalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        zIndex="z-[60]"
        containerClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Add Supplier / Vendor</h3>
                <p className="text-xs text-neutral-400">
                  Vendor profile, GST compliance, procurement terms, and Accounts Payable ledger.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Row 1: Company Name & Contact Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Supplier / Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  required
                  placeholder="e.g. GreenPly Timber & Plywood Ltd"
                  className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                    fieldErrors.name
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-indigo-500'
                  }`}
                />
                {fieldErrors.name && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.name}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Agarwal (Key Accounts)"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Row 2: GSTIN & State Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    GSTIN (GST Number)
                  </label>
                  <span className="text-[10.5px] text-indigo-400 font-mono">Auto-detects State & PAN</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 27AAAPL1234F1Z9"
                  value={gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  State / Place of Supply <span className="text-rose-400">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    if (fieldErrors.state) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.state;
                        return next;
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.state && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.state}</span>
                )}
              </div>
            </div>

            {/* Auto-extracted PAN Banner */}
            {(pan || gstin) && (
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>GST Place of Supply:</span>
                  <span className="font-mono font-bold">{state}</span>
                </div>
                <div className="font-mono text-neutral-300 text-[11px]">
                  PAN: <span className="text-white font-bold">{pan || 'Auto from GSTIN'}</span>
                </div>
              </div>
            )}

            {/* Row 3: Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sales@greenply.com"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98201 12345"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Address */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Factory / Dispatch Office Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 45, MIDC Industrial Area, Phase II, Pune, Maharashtra 411026"
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Commercial Credit Terms & GL Accounts */}
            <div className="p-3.5 bg-[#17171e] border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-neutral-200">Procurement Credit Terms & General Ledger</span>
                <span className="text-[10px] text-neutral-500 ml-auto">Accounts Payable Routing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Credit / Payment Terms
                  </label>
                  <select
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((pt) => (
                      <option key={pt.days} value={pt.days}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Payable Ledger (2110)
                  </label>
                  <select
                    value={payableAccountId}
                    onChange={(e) => setPayableAccountId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 truncate"
                  >
                    <option value="">Default (2110 Accounts Payable)</option>
                    {accounts
                      .filter((a) => a.type === AccountClassification.LIABILITY)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="border-neutral-700 bg-neutral-800 text-neutral-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? 'Creating Vendor...' : 'Save Vendor / Supplier'}
              </Button>
            </div>
          </form>
        </div>
      </PortalModal>

      {/* Vendor Detail Modal */}
      <PortalModal
        isOpen={Boolean(detailVendor)}
        onClose={() => setDetailVendor(null)}
        zIndex="z-[60]"
        maxWidth="max-w-lg"
      >
        {detailVendor && (
          <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Vendor #{detailVendor.id}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-400">
                    {detailVendor.state || 'Maharashtra'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1.5">{detailVendor.name}</h3>
                <p className="text-xs text-neutral-400 font-medium">{detailVendor.company_name}</p>
              </div>
              <button
                onClick={() => setDetailVendor(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Outstanding Balance Banner */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Outstanding Accounts Payable
                </div>
                <div className="text-2xl font-mono font-bold text-rose-400 mt-0.5">
                  ₹{Number(detailVendor.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[11px] text-rose-300/80 font-mono">
                {detailVendor.gstin ? 'GST Registered Supplier' : 'Unregistered Vendor'}
              </div>
            </div>

            {/* Statutory & Tax Info */}
            <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl text-xs space-y-2.5">
              <h4 className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">Tax & Statutory Info</h4>
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <span className="text-neutral-500">GSTIN:</span>{' '}
                  <span className="font-mono font-bold text-white">{detailVendor.gstin || 'Unregistered'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">PAN:</span>{' '}
                  <span className="font-mono font-bold text-white">{detailVendor.pan || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Email:</span>{' '}
                  <span className="text-white">{detailVendor.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Phone:</span>{' '}
                  <span className="text-white">{detailVendor.phone || 'N/A'}</span>
                </div>
              </div>

              {detailVendor.address && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-neutral-500">Dispatch / Billing Address:</span>
                  <div className="text-neutral-200 mt-0.5">{detailVendor.address}</div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] text-neutral-500 font-mono">
                Supplier Directory Record
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailVendor(null)}
                className="border-neutral-700 bg-neutral-800 text-neutral-300 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </PortalModal>
    </div>
  );
};
