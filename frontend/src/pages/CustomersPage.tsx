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
} from 'lucide-react';
import { customersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const CustomersPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Customer Detail Modal State
  const [detailCustomer, setDetailCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.list();
      setCustomers(res.data || res || []);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Contact name is required.';
    if (!companyName.trim()) errors.company_name = 'Company name is required.';
    if (!state.trim()) errors.state = 'State is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast({ type: 'warning', title: 'Validation', message: 'Please fill in the required fields.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await customersApi.create({
        name: name.trim(),
        company_name: companyName.trim(),
        gstin: gstin.trim(),
        pan: pan.trim(),
        email: email.trim(),
        phone: phone.trim(),
        state: state.trim(),
        billing_address: address.trim(),
      });
      addToast({ type: 'success', title: 'Customer Added', message: `${name.trim()} has been added.` });
      setIsModalOpen(false);
      setName('');
      setCompanyName('');
      setGstin('');
      setPan('');
      setEmail('');
      setPhone('');
      setState('Maharashtra');
      setAddress('');
      setFieldErrors({});
      setFormError(null);
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
      c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            onClick={() => {
              setFieldErrors({});
              setFormError(null);
              setIsModalOpen(true);
            }}
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
        maxWidth="max-w-lg"
      >
        <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-4 shadow-2xl">
          <h3 className="text-base font-bold">Add Customer Account</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Contact Name <span className="text-rose-400">*</span>
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
                  placeholder="e.g. Nimesh Pathak"
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
                  Company / Entity Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (fieldErrors.company_name) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.company_name;
                        return next;
                      });
                    }
                  }}
                  required
                  placeholder="e.g. Pathak Design Studio"
                  className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                    fieldErrors.company_name
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-emerald-500'
                  }`}
                />
                {fieldErrors.company_name && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.company_name}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">PAN</label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. nimesh.pathak@example.com"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98200 12345"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  State <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
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
                  required
                  placeholder="e.g. Maharashtra"
                  className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                    fieldErrors.state
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-emerald-500'
                  }`}
                />
                {fieldErrors.state && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.state}</span>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Billing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Suite 402, High Street Phoenix, Lower Parel, Mumbai"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {isSubmitting ? 'Adding...' : 'Save Customer'}
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

