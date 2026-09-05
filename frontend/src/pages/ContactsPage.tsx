import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Building, Image as ImageIcon, Check, ArrowLeft, Plus } from 'lucide-react';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { contactsApi } from '../lib/api';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import { ContactType } from '../types';

const contactFilterConfigs: FieldFilterConfig[] = [
  { key: 'name', label: 'Contact Name', type: 'text', placeholder: 'e.g. Acme...' },
  { key: 'email', label: 'Email', type: 'text', placeholder: 'Email...' },
  { key: 'phone', label: 'Phone', type: 'text', placeholder: 'Phone...' },
  { key: 'gstin', label: 'GSTIN', type: 'text', placeholder: 'GSTIN...' },
  {
    key: 'contact_type',
    label: 'Contact Type',
    type: 'select',
    options: [
      { label: 'Customer', value: ContactType.CUSTOMER },
      { label: 'Vendor', value: ContactType.VENDOR },
    ],
  },
  { key: 'city', label: 'City', type: 'text', placeholder: 'City...' },
  { key: 'state', label: 'State', type: 'text', placeholder: 'State...' },
];

const contactColumnDefs: ColumnFilterDef[] = [
  { key: 'select', filterType: 'none' },
  { key: 'image', filterType: 'none' },
  { key: 'name', filterType: 'text', placeholder: 'Filter name...' },
  { key: 'email', filterType: 'text', placeholder: 'Filter email...' },
  { key: 'phone', filterType: 'text', placeholder: 'Filter phone...' },
  { key: 'gstin', filterType: 'text', placeholder: 'Filter GSTIN...' },
  {
    key: 'contact_type',
    filterType: 'select',
    options: [
      { label: 'Customer', value: ContactType.CUSTOMER },
      { label: 'Vendor', value: ContactType.VENDOR },
    ],
  },
];

interface Contact {
  id: number;
  contact_type: ContactType;
  name: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  image?: string;
}

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'form'>('list');
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | ContactType>('all');

  // Filter States
  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);

  // Form state
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contact_type: ContactType.CUSTOMER,
    street: '',
    city: '',
    state: 'Maharashtra',
    country: 'India',
    pincode: '',
    gstin: '',
    pan: '',
    image: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await contactsApi.list({
        per_page: 'all',
      });
      setContacts(res?.data || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleOpenForm = (contact?: Contact) => {
    if (contact) {
      setActiveContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        contact_type: contact.contact_type,
        street: contact.street || '',
        city: contact.city || '',
        state: contact.state || 'Maharashtra',
        country: contact.country || 'India',
        pincode: contact.pincode || '',
        gstin: contact.gstin || '',
        pan: contact.pan || '',
        image: contact.image || '',
      });
    } else {
      setActiveContact(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        contact_type: ContactType.CUSTOMER,
        street: '',
        city: '',
        state: 'Maharashtra',
        country: 'India',
        pincode: '',
        gstin: '',
        pan: '',
        image: '',
      });
    }
    setFormError(null);
    setViewMode('form');
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Contact Name is required.');
      setSaving(false);
      return;
    }

    if (!formData.email.trim()) {
      setFormError('Email Id is required and must be unique.');
      setSaving(false);
      return;
    }

    try {
      await contactsApi.create(formData);
      await fetchContacts();
      setViewMode('list');
    } catch (err: any) {
      console.error('Failed to save contact:', err);
      setFormError(err?.response?.data?.message || 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = contactFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key,
          operator: cfg?.type === 'select' ? 'equals' : 'contains',
          value: val.trim(),
        });
      }
    });
    if (selectedType !== 'all') {
      merged.push({
        id: 'quick-type',
        field: 'contact_type',
        operator: 'equals',
        value: selectedType,
      });
    }
    return merged;
  }, [activeFilters, columnFilters, selectedType]);

  const filteredContacts = React.useMemo(() => {
    return filterItems(
      contacts,
      search,
      ['name', 'email', 'phone', 'gstin', 'city', 'state'],
      allActiveFilters
    );
  }, [contacts, search, allActiveFilters]);

  const {
    visibleItems: visibleContacts,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredContacts,
    pageSize: 15,
  });

  return (
    <MasterViewLayout
      title={viewMode === 'form' ? (activeContact ? 'Contact Details' : 'New Contact') : 'Contacts Master'}
      subtitle={viewMode === 'form' ? 'Master data entry and party parameters' : 'Manage unified customer, vendor, and partner records'}
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m)}
      onNew={() => handleOpenForm()}
      onBack={() => setViewMode('list')}
    >
      {/* FORM VIEW */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSaveContact} className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-6 shadow-obsidian-card space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          {/* Form Top Control Bar matching wireframe: New, Confirm, Back */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Fields */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma / Apex Furnishings"
                    className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                    Party Type
                  </label>
                  <select
                    value={formData.contact_type}
                    onChange={(e) => setFormData({ ...formData, contact_type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                  >
                    <option value={ContactType.CUSTOMER}>Customer (Sales)</option>
                    <option value={ContactType.VENDOR}>Vendor (Purchases)</option>
                    <option value={ContactType.BOTH}>Both (Customer & Vendor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                    Email Id *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@example.com (Must be unique)"
                    className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                  />
                  <span className="text-[10px] text-[#606070] mt-1 block">Unique Email in database</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-3">
                  Address Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Street Address / Premises"
                      className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                    />
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      className="px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                    />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                      className="px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                    />
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="Pincode"
                      className="px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                    />
                  </div>
                </div>
              </div>

              {/* Statutory & Tax Details */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-3">
                  Tax & Identification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                      GSTIN (15 characters)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="27ABCDE1234F1Z5"
                      className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-[#7042f4]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                      PAN Number (10 characters)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-[#7042f4]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Image / Avatar Card */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/[0.08] rounded-2xl bg-[#121216]/50 text-center">
              <div className="w-24 h-24 rounded-full bg-[#1c1c23] border border-white/[0.1] flex items-center justify-center text-[#707080] mb-3 overflow-hidden">
                {formData.image ? (
                  <img src={formData.image} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8" />
                )}
              </div>
              <span className="text-xs font-semibold text-white">Upload Image</span>
              <p className="text-[10px] text-[#707080] mt-1 max-w-[180px]">
                PNG, JPG or SVG avatar
              </p>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Image URL"
                className="mt-3 w-full px-3 py-1.5 bg-[#18181f] border border-white/[0.08] rounded-xl text-[11px] text-white focus:outline-none focus:border-[#7042f4]"
              />
            </div>
          </div>
        </form>
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleContacts.map((c) => (
            <motion.div
              key={`${c.contact_type}-${c.id}`}
              onClick={() => handleOpenForm(c)}
              whileHover={{ y: -3, scale: 1.01 }}
              className="p-5 rounded-2xl bg-[#18181f]/90 border border-white/[0.08] hover:border-[#7042f4]/50 shadow-obsidian-card cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#7042f4] to-[#a855f7] flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-white/[0.05] text-[#a0a0b0]">
                    {c.contact_type}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#8a8a9a] pt-1">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-[#7042f4]" />
                  <span className="truncate">{c.email}</span>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.gstin && (
                  <div className="flex items-center gap-2 truncate font-mono text-[10px] text-[#c084fc]">
                    <span>GSTIN: {c.gstin}</span>
                  </div>
                )}
                {c.city && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{c.city}, {c.state}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {visibleContacts.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-[#707080] bg-[#18181f]/40 border border-white/[0.06] rounded-2xl">
              No contacts found matching current filters. Click "+ New" to add one.
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          <FieldFilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search contacts by name, email, phone, GSTIN..."
            filterConfigs={contactFilterConfigs}
            activeFilters={activeFilters}
            onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
            onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
            onClearAll={() => {
              setActiveFilters([]);
              setColumnFilters({});
              setSearch('');
              setSelectedType('all');
            }}
            presets={{
              field: 'contact_type',
              currentValue: selectedType,
              onChange: (val) => setSelectedType(val as any),
              options: [
                { label: 'All Contacts', value: 'all' },
                { label: 'Customers', value: ContactType.CUSTOMER },
                { label: 'Vendors', value: ContactType.VENDOR },
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
                    <th className="py-3.5 px-4 w-12 text-center">Select</th>
                    <th className="py-3.5 px-4 w-16 text-center">Image</th>
                    <th className="py-3.5 px-4">Contact Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">GSTIN</th>
                    <th className="py-3.5 px-4">Type</th>
                  </tr>
                  {showColumnFilters && (
                    <ColumnFilterRow
                      columns={contactColumnDefs}
                      values={columnFilters}
                      onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                    />
                  )}
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {visibleContacts.map((c) => (
                    <tr
                      key={`${c.contact_type}-${c.id}`}
                      onClick={() => handleOpenForm(c)}
                      className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-white/20 bg-transparent" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-8 h-8 rounded-full mx-auto bg-gradient-to-tr from-[#7042f4] to-[#a855f7] flex items-center justify-center text-white font-bold text-xs">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{c.name}</td>
                      <td className="py-3 px-4 text-[#a0a0b0]">{c.email}</td>
                      <td className="py-3 px-4 text-[#a0a0b0]">{c.phone || '—'}</td>
                      <td className="py-3 px-4 font-mono text-[#c084fc]">{c.gstin || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          c.contact_type === ContactType.CUSTOMER
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {c.contact_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visibleContacts.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#707080]">
                        No contacts found matching criteria. Click "+ New" to add one.
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
              visibleCount={visibleContacts.length}
              onLoadMore={loadMore}
              entityName="contacts"
            />
          </div>
        </div>
      )}
    </MasterViewLayout>
  );
};
