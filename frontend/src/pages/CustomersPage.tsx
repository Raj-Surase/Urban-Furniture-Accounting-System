import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  X,
  CreditCard,
  FolderTree,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { customersApi, accountsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  INDIAN_STATES,
  PAYMENT_TERMS_OPTIONS,
  extractPanFromGstin,
  getStateFromGstin,
} from '../constants/formOptions';

export const CustomersPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
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
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameShipping, setSameShipping] = useState(true);
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [creditLimit, setCreditLimit] = useState<string>('500000');
  const [receivableAccountId, setReceivableAccountId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Customer Detail Modal State
  const [detailCustomer, setDetailCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [custRes, accRes] = await Promise.all([
        customersApi.list(),
        accountsApi.list().catch(() => ({ data: [] })),
      ]);
      const list = custRes?.data || custRes || [];
      setCustomers(Array.isArray(list) ? list : []);
      const accList = accRes?.data || accRes || [];
      setAccounts(Array.isArray(accList) ? accList : []);
      const defaultAr = (Array.isArray(accList) ? accList : []).find((a: any) => a.code === '1120');
      if (defaultAr && !receivableAccountId) {
        setReceivableAccountId(defaultAr.id);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load customers.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    const handleRoleUpdated = () => {
      fetchCustomers();
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
    setShippingAddress('');
    setSameShipping(true);
    setPaymentTermsDays(30);
    setCreditLimit('500000');
    const defaultAr = accounts.find((a: any) => a.code === '1120');
    setReceivableAccountId(defaultAr ? defaultAr.id : '');
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

    if (!name.trim()) errors.name = 'Client or Company name is required.';
    if (!state.trim()) errors.state = 'State selection is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast({ type: 'warning', title: 'Validation', message: 'Please fill in the required fields.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await customersApi.create({
        name: name.trim(),
        contact_person: contactPerson.trim() || undefined,
        gstin: gstin.trim() || undefined,
        pan: pan.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        state: state.trim(),
        billing_address: address.trim() || undefined,
        shipping_address: sameShipping ? (address.trim() || undefined) : (shippingAddress.trim() || undefined),
        payment_terms_days: paymentTermsDays,
        credit_limit: creditLimit ? parseFloat(creditLimit) : 500000,
        receivable_account_id: receivableAccountId ? Number(receivableAccountId) : undefined,
      });
      addToast({ type: 'success', title: 'Customer Added', message: `${name.trim()} has been added.` });
      setIsModalOpen(false);
      resetForm();
      fetchCustomers();
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

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-400" />
            Customer Accounts & Client Directory
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Commercial real estate, corporate offices, architectural clients, and Accounts Receivable.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <Button
            onClick={handleOpenModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Customer Account
          </Button>
        )}
      </div>

      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search customer, corporate entity or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 w-72"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Customer & Corporate Entity</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">State / Location</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4 text-right">Outstanding Receivable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <TableSkeleton columns={5} rows={6} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  colSpan={5}
                  icon={Users}
                  title="No customer accounts found"
                  description={
                    searchQuery
                      ? 'No customers match your search criteria. Try a different query.'
                      : 'Add your first commercial or retail customer account to get started.'
                  }
                  actionLabel={isAdmin || isManager ? 'Add Customer Account' : undefined}
                  onAction={isAdmin || isManager ? () => setIsModalOpen(true) : undefined}
                />
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetailCustomer(c)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white group-hover:text-emerald-400 group-hover:underline transition-colors">{c.name}</div>
                      <div className="text-[10.5px] text-neutral-400">{c.company_name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="text-emerald-300">{c.gstin || 'Consumer / Unregistered'}</div>
                      <div className="text-[10px] text-neutral-500">PAN: {c.pan || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      <div>{c.state || 'Maharashtra'}</div>
                      <div className="text-[10.5px] text-neutral-500 truncate max-w-xs">{c.billing_address}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div>{c.email || 'N/A'}</div>
                      <div className="text-[10.5px] text-neutral-500">{c.phone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ₹{Number(c.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
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
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Add Customer Account</h3>
                <p className="text-xs text-neutral-400">
                  Client profile, GST place of supply, commercial credit terms, and receivable ledger.
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
                  Customer / Corporate Entity Name <span className="text-rose-400">*</span>
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
                  placeholder="e.g. Acme Commercial Workspace Ltd"
                  className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                    fieldErrors.name
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-emerald-500'
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
                  placeholder="e.g. Nimesh Pathak (Procurement Head)"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  <span className="text-[10.5px] text-emerald-400 font-mono">Auto-detects State & PAN</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
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
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
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
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>GST Tax Verification:</span>
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
                  placeholder="e.g. accounts@acme.com"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98200 12345"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Addresses */}
            <div className="space-y-2">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Billing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Suite 402, High Street Phoenix, Lower Parel, Mumbai, Maharashtra 400013"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sameShippingCheck"
                  checked={sameShipping}
                  onChange={(e) => setSameShipping(e.target.checked)}
                  className="rounded border-neutral-700 text-emerald-600 focus:ring-emerald-500 bg-[#1a1a22]"
                />
                <label htmlFor="sameShippingCheck" className="text-xs text-neutral-300 cursor-pointer">
                  Delivery / site shipping address is same as billing address
                </label>
              </div>

              {!sameShipping && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Shipping / Site Address</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. Floor 3, Building B, Nesco IT Park, Goregaon East, Mumbai"
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Commercial Credit Terms & GL Accounts */}
            <div className="p-3.5 bg-[#17171e] border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-neutral-200">Commercial Credit Terms & General Ledger</span>
                <span className="text-[10px] text-neutral-500 ml-auto">Accounts Receivable Routing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
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
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono text-right focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Receivable Ledger (1120)
                  </label>
                  <select
                    value={receivableAccountId}
                    onChange={(e) => setReceivableAccountId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 truncate"
                  >
                    <option value="">Default (1120 Accounts Receivable)</option>
                    {accounts
                      .filter((a) => a.type === 'asset')
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20"
              >
                {isSubmitting ? 'Creating Customer...' : 'Save Customer Account'}
              </Button>
            </div>
          </form>
        </div>
      </PortalModal>

      {/* Customer Detail Modal */}
      <PortalModal
        isOpen={Boolean(detailCustomer)}
        onClose={() => setDetailCustomer(null)}
        zIndex="z-[60]"
        maxWidth="max-w-lg"
      >
        {detailCustomer && (
          <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Customer #{detailCustomer.id}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-400">
                    {detailCustomer.state || 'Maharashtra'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1.5">{detailCustomer.name}</h3>
                <p className="text-xs text-neutral-400 font-medium">{detailCustomer.company_name}</p>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Outstanding Balance Banner */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Outstanding Accounts Receivable
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">
                  ₹{Number(detailCustomer.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[11px] text-emerald-300/80 font-mono">
                {detailCustomer.gstin ? 'B2B Registered' : 'B2C Consumer'}
              </div>
            </div>

            {/* Statutory & Tax Info */}
            <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl text-xs space-y-2.5">
              <h4 className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">Tax & Identity</h4>
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <span className="text-neutral-500">GSTIN:</span>{' '}
                  <span className="font-mono font-bold text-white">{detailCustomer.gstin || 'Unregistered'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">PAN:</span>{' '}
                  <span className="font-mono font-bold text-white">{detailCustomer.pan || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Email:</span>{' '}
                  <span className="text-white">{detailCustomer.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Phone:</span>{' '}
                  <span className="text-white">{detailCustomer.phone || 'N/A'}</span>
                </div>
              </div>

              {detailCustomer.billing_address && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-neutral-500">Billing Address:</span>
                  <div className="text-neutral-200 mt-0.5">{detailCustomer.billing_address}</div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] text-neutral-500 font-mono">
                Client Directory Record
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailCustomer(null)}
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

