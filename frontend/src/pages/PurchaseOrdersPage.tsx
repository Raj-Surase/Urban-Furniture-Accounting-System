import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  Send,
  PackageCheck,
  Search,
  Building2,
  Calendar,
  Layers,
  Percent,
  Clock,
  Truck,
  Info,
  Trash2,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { purchaseOrdersApi, vendorsApi, productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PAYMENT_TERMS_OPTIONS, calculateDueDate } from '../constants/formOptions';

export const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(15);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Urban Furniture Purchase Order. Procurement of wooden furniture & raw timber from vendor.');
  const [items, setItems] = useState<
    Array<{ product_id: number | ''; quantity: number; unit_price: number; gst_rate: number }>
  >([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receive Goods Modal State
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});
  const [isReceiving, setIsReceiving] = useState(false);

  // Detail Modal State
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const handleOpenDetail = async (po: any) => {
    setDetailOrder(po);
    try {
      const res = await purchaseOrdersApi.get(po.id);
      if (res?.data) {
        setDetailOrder(res.data);
      } else if (res) {
        setDetailOrder(res);
      }
    } catch (err) {
      console.error('Failed to fetch purchase order details:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, vendRes, prodRes] = await Promise.all([
        purchaseOrdersApi.list(),
        vendorsApi.list(),
        productsApi.list(),
      ]);
      setOrders(orderRes.data || orderRes || []);
      setVendors(vendRes.data || vendRes || []);
      setProducts(prodRes.data || prodRes || []);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load purchase orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleRoleUpdated = () => {
      fetchData();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, []);

  const handleProductChange = (index: number, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: prod.id,
      unit_price: Number(prod.cost_price || prod.price * 0.7),
      gst_rate: Number(prod.gst_rate || 18),
    };
    setItems(updated);
  };

  const handleVendorSelect = (id: number | '') => {
    setVendorId(id);
    if (id) {
      const v = vendors.find((vend) => vend.id === id);
      const terms = v?.payment_terms_days ?? 15;
      setPaymentTermsDays(terms);
      setExpectedDate(calculateDueDate(orderDate, terms));
    }
  };

  const handlePaymentTermsChange = (days: number) => {
    setPaymentTermsDays(days);
    setExpectedDate(calculateDueDate(orderDate, days));
  };

  const handleOrderDateChange = (date: string) => {
    setOrderDate(date);
    setExpectedDate(calculateDueDate(date, paymentTermsDays));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      addToast({ type: 'warning', title: 'Validation', message: 'Please select a vendor.' });
      return;
    }
    const valid = items.filter((i) => i.product_id && i.quantity > 0);
    if (valid.length === 0) {
      addToast({ type: 'warning', title: 'Validation', message: 'Add at least one valid item.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await purchaseOrdersApi.create({
        vendor_id: vendorId,
        order_date: orderDate,
        expected_delivery_date: expectedDate,
        notes,
        items: valid.map((it) => ({
          ...it,
          quantity_ordered: it.quantity,
          tax_rate: it.gst_rate,
        })),
      });
      addToast({ type: 'success', title: 'PO Created', message: 'Draft purchase order created.' });
      setIsCreateOpen(false);
      setItems([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Creation Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await purchaseOrdersApi.submit(id);
      addToast({ type: 'success', title: 'PO Submitted', message: 'Purchase order submitted for approval.' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await purchaseOrdersApi.approve(id);
      addToast({ type: 'success', title: 'PO Approved', message: 'Purchase order approved by manager.' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message });
    }
  };

  const handleReceiveConfirm = async () => {
    if (!selectedOrder) return;
    try {
      setIsReceiving(true);
      const itemsPayload = (selectedOrder.items || []).map((item: any) => ({
        id: item.id,
        quantity_received: receiveQtys[item.id] ?? (item.quantity - (item.quantity_received || 0)),
      }));

      await purchaseOrdersApi.receive(selectedOrder.id, {
        delivery_date: new Date().toISOString().split('T')[0],
        items: itemsPayload,
      });

      addToast({
        type: 'success',
        title: 'Goods Received & Stock Updated',
        message: 'Auto GRNI journal entry posted (Dr Inventory, Cr GRNI Clearing) and stock levels adjusted.',
      });
      setIsReceiveOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Receive Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsReceiving(false);
    }
  };

  const filteredOrders = orders.filter((po) => {
    const matchesSearch =
      po.po_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const isVendorInterState = selectedVendor
    ? (selectedVendor.state &&
        !selectedVendor.state.toLowerCase().includes('maharashtra') &&
        selectedVendor.state.toUpperCase() !== 'MH' &&
        selectedVendor.state !== '27') ||
      (selectedVendor.gstin && !selectedVendor.gstin.startsWith('27'))
    : false;

  const poSubtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const poTotalTax = items.reduce(
    (acc, it) =>
      acc +
      ((Number(it.quantity) || 0) *
        (Number(it.unit_price) || 0) *
        (Number(it.gst_rate) || 0)) /
        100,
    0
  );
  const poGrandTotal = poSubtotal + poTotalTax;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-indigo-400" />
            Purchase Orders & Procurement
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Vendor purchase cycles, manager approvals, and automated GRNI stock intake.
          </p>
        </div>

        <Button
          onClick={() => {
            setVendorId('');
            setIsCreateOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* Main Table */}
      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search PO or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <TableSkeleton rows={5} cols={8} />
              ) : filteredOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  colSpan={8}
                  title="No purchase orders found"
                  description="Create a purchase order to initiate procurement with vendors."
                  actionLabel="New Purchase Order"
                  onAction={() => setIsCreateOpen(true)}
                  secondaryActionLabel={searchQuery || statusFilter !== 'all' ? 'Clear Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                />
              ) : (
                filteredOrders.map((po) => {
                  return (
                    <tr
                      key={po.id}
                      onClick={() => handleOpenDetail(po)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-indigo-400 group-hover:underline">
                        {po.po_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-200">{po.vendor?.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{po.vendor?.gstin || 'Unregistered'}</div>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        <div>Date: {po.order_date ? po.order_date.split('T')[0] : 'N/A'}</div>
                        <div className="text-[10px] text-neutral-500">Exp: {po.expected_delivery_date ? po.expected_delivery_date.split('T')[0] : 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-300">
                        ₹{Number(po.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-400">
                        ₹{Number(po.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ₹{Number(po.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            po.status === 'received'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : po.status === 'approved'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : po.status === 'submitted'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === 'draft' && (
                            <button
                              onClick={() => handleSubmit(po.id)}
                              className="px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition-colors"
                            >
                              Submit
                            </button>
                          )}

                          {po.status === 'submitted' && (isAdmin || isManager) && (
                            <button
                              onClick={() => handleApprove(po.id)}
                              className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-semibold transition-colors"
                            >
                              Approve
                            </button>
                          )}

                          {(po.status === 'approved' || po.status === 'partially_received' || po.status === 'received') && (isAdmin || isManager) && (
                            <>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/bills?from_po=${po.id}&vendor_id=${po.vendor_id}&po_number=${encodeURIComponent(
                                      po.order_number
                                    )}`
                                  )
                                }
                                className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                                title="Create Vendor Bill"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Create Bill
                              </button>
                              {po.status !== 'received' && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(po);
                                    const initQtys: Record<number, number> = {};
                                    (po.items || []).forEach((item: any) => {
                                      initQtys[item.id] = item.quantity - (item.quantity_received || 0);
                                    });
                                    setReceiveQtys(initQtys);
                                    setIsReceiveOpen(true);
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  Receive
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create PO Modal */}
      <PortalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        zIndex="z-[60]"
        containerClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Purchase Order (Procurement)</h3>
                <p className="text-xs text-neutral-400">
                  Draft procurement orders with approved furniture suppliers, timber mills & hardware vendors
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Vendor Selector Card */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.07] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Supplier / Vendor Selection
                </label>
                {selectedVendor && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isVendorInterState
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    {isVendorInterState ? 'Inter-State (IGST 100%)' : 'Intra-State (CGST 50% + SGST 50%)'}
                  </span>
                )}
              </div>

              <select
                value={vendorId}
                onChange={(e) => handleVendorSelect(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="">Choose an approved vendor / manufacturer...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} • {v.state || 'MH'} {v.gstin ? `(${v.gstin})` : '(Unregistered)'}
                  </option>
                ))}
              </select>

              {selectedVendor && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs border-t border-white/[0.04]">
                  <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-medium text-neutral-400 block">GSTIN</span>
                    <span className="font-mono font-semibold text-neutral-200">{selectedVendor.gstin || 'Unregistered'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-medium text-neutral-400 block">Dispatch State</span>
                    <span className="font-semibold text-neutral-200">{selectedVendor.state || 'Maharashtra (27)'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-medium text-neutral-400 block">Payment Terms</span>
                    <span className="font-semibold text-indigo-400">
                      {paymentTermsDays ? `Net ${paymentTermsDays} Days` : 'Due on Receipt'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Dates and Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => handleOrderDateChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Commercial Terms
                </label>
                <select
                  value={paymentTermsDays}
                  onChange={(e) => handlePaymentTermsChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {PAYMENT_TERMS_OPTIONS.map((pt) => (
                    <option key={pt.days} value={pt.days}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-neutral-300 border-b border-white/[0.06] pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Order Line Items ({items.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }])
                  }
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product Item
                </button>
              </div>

              <div className="space-y-2">
                {items.map((it, idx) => {
                  const prod = products.find((p) => p.id === it.product_id);
                  const lineSubtotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
                  const lineTax = (lineSubtotal * (Number(it.gst_rate) || 0)) / 100;
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2.5 hover:border-white/[0.1] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-0.5">
                            Product / Raw Material SKU
                          </label>
                          <select
                            value={it.product_id}
                            onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                            required
                            className="w-full px-2.5 py-1.5 bg-[#141418] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Select Furniture / Raw Material SKU...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) • Stock: {p.current_stock ?? 0} {p.unit_of_measure || 'pcs'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24">
                          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-0.5">
                            Qty {prod?.unit_of_measure ? `(${prod.unit_of_measure})` : ''}
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={it.quantity === 0 ? '' : it.quantity}
                            onChange={(e) => {
                              const updated = [...items];
                              const val = e.target.value;
                              updated[idx].quantity = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                              setItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-[#141418] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono"
                          />
                        </div>

                        <div className="w-28">
                          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-0.5">
                            Unit Price (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price"
                            value={it.unit_price === 0 ? '' : it.unit_price}
                            onChange={(e) => {
                              const updated = [...items];
                              const val = e.target.value;
                              updated[idx].unit_price = val === '' ? 0 : Number(val);
                              setItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-[#141418] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono"
                          />
                        </div>

                        <div className="w-24">
                          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-0.5">
                            GST %
                          </label>
                          <select
                            value={it.gst_rate}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].gst_rate = Number(e.target.value);
                              setItems(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-[#141418] border border-neutral-700 rounded-lg text-xs text-white"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>

                        {items.length > 1 && (
                          <div className="self-end pb-1">
                            <button
                              type="button"
                              onClick={() => setItems(items.filter((_, i) => i !== idx))}
                              className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-neutral-400 bg-black/20 px-2.5 py-1 rounded-md">
                        <span>
                          {prod ? (
                            <span>
                              Current Stock: <strong className="text-white">{prod.current_stock ?? 0} {prod.unit_of_measure || 'units'}</strong>
                            </span>
                          ) : (
                            <span className="text-neutral-500 italic">Select product to verify current warehouse inventory</span>
                          )}
                        </span>
                        <span className="font-mono">
                          Subtotal: <strong className="text-white">₹{lineSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> + Tax: <strong className="text-neutral-300">₹{lineTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Procurement Notes */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Procurement Instructions / Delivery Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Include warehouse bay delivery directions, timber grade specifications, or inspection criteria..."
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Financial Summary & Auto-GRNI Note */}
            <div className="p-4 bg-indigo-500/[0.04] border border-indigo-500/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-indigo-500/10 pb-2">
                <span className="text-neutral-400">Items Subtotal:</span>
                <span className="font-mono font-bold text-white">
                  ₹{poSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-indigo-500/10 pb-2">
                <span className="text-neutral-400">
                  {isVendorInterState ? 'IGST (Inter-State):' : 'CGST + SGST (Intra-State):'}
                </span>
                <span className="font-mono text-neutral-300">
                  ₹{poTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-0.5">
                <span className="font-bold text-white">Total Order Value:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  ₹{poGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Goods Receipt will auto-post GRNI clearing journals: <strong className="text-neutral-300">Dr Inventory / Cr GRNI Clearing</strong>.</span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="border-neutral-700 bg-neutral-800 text-neutral-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                {isSubmitting ? 'Creating Purchase Order...' : 'Save Draft PO'}
              </Button>
            </div>
          </form>
        </div>
      </PortalModal>

      {/* Receive Modal */}
      <PortalModal
        isOpen={isReceiveOpen && !!selectedOrder}
        onClose={() => setIsReceiveOpen(false)}
        zIndex="z-[70]"
        containerClassName="max-w-md"
      >
        {selectedOrder && (
          <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold">Receive Goods (GRNI Auto-Post)</h3>
            <p className="text-xs text-neutral-400">
              Receiving will automatically increase warehouse stock and debit Raw Materials / Inventory with a credit to GRNI clearing account.
            </p>

            <div className="space-y-3">
              {(selectedOrder?.items || []).map((item: any) => (
                <div key={item.id} className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{item.product?.name || item.description}</div>
                    <div className="text-[10px] text-neutral-500">Ordered: {item.quantity} | Previously Received: {item.quantity_received || 0}</div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={item.quantity - (item.quantity_received || 0)}
                    value={receiveQtys[item.id] ?? (item.quantity - (item.quantity_received || 0))}
                    onChange={(e) =>
                      setReceiveQtys({ ...receiveQtys, [item.id]: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-1 bg-[#1a1a22] border border-neutral-700 rounded text-right text-xs font-mono font-bold text-emerald-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReceiveOpen(false)}
                className="border-neutral-700 bg-neutral-800 text-neutral-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isReceiving}
                onClick={handleReceiveConfirm}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {isReceiving ? 'Processing...' : 'Confirm Goods Receipt'}
              </Button>
            </div>
          </div>
        )}
      </PortalModal>

      {/* Purchase Order Detail Modal */}
      <PortalModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        zIndex="z-[60]"
        containerClassName="max-w-2xl"
      >
        {detailOrder && (
          <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{detailOrder.po_number}</span>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      detailOrder.status === 'received'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : detailOrder.status === 'approved'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : detailOrder.status === 'submitted'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {detailOrder.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {detailOrder.vendor?.name || 'Vendor Order'}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  GSTIN: {detailOrder.vendor?.gstin || 'Unregistered'} • {detailOrder.vendor?.state || 'MH'}
                </p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Order Date</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {detailOrder.order_date ? detailOrder.order_date.split('T')[0] : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Expected Delivery</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {detailOrder.expected_delivery_date ? detailOrder.expected_delivery_date.split('T')[0] : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Tax / GST</div>
                <div className="font-mono font-bold text-neutral-300 mt-0.5">
                  ₹{Number(detailOrder.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Total Purchase</div>
                <div className="font-mono font-bold text-indigo-400 mt-0.5">
                  ₹{Number(detailOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Procured Line Items</h4>
              <div className="border border-white/[0.08] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-bold text-neutral-400 uppercase">
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">GST %</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(detailOrder.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-neutral-400">
                          No line items found for this purchase order.
                        </td>
                      </tr>
                    ) : (
                      (detailOrder.items || []).map((item: any) => {
                        const qty = Number(item.quantity ?? item.quantity_ordered ?? 0);
                        const received = Number(item.quantity_received ?? 0);
                        const rate = Number(item.unit_price ?? 0);
                        const gst = Number(item.tax_rate ?? item.gst_rate ?? 18);
                        const total = Number(
                          item.line_total ??
                          item.total_amount ??
                          (qty * rate * (1 + gst / 100))
                        );

                        return (
                          <tr key={item.id} className="hover:bg-white/[0.01]">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-white">{item.product?.name || item.description || 'Custom Supply'}</div>
                              {item.product?.sku && (
                                <div className="text-[10px] font-mono text-indigo-400">SKU: {item.product.sku}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{qty}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                              {received} / {qty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-neutral-300">
                              ₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{gst}%</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {detailOrder.notes && (
              <div className="p-3 bg-white/[0.01] border border-white/[0.06] rounded-xl text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">Procurement Notes:</span> {detailOrder.notes}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] text-neutral-500 font-mono">
                Order ID #{detailOrder.id}
              </div>
              <div className="flex items-center gap-2">
                {detailOrder.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await handleSubmit(detailOrder.id);
                      setDetailOrder(null);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    Submit PO
                  </Button>
                )}

                {detailOrder.status === 'submitted' && (isAdmin || isManager) && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await handleApprove(detailOrder.id);
                      setDetailOrder(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Approve PO
                  </Button>
                )}

                {(detailOrder.status === 'approved' || detailOrder.status === 'partially_received' || detailOrder.status === 'received') && (isAdmin || isManager) && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate(
                          `/bills?from_po=${detailOrder.id}&vendor_id=${detailOrder.vendor_id}&po_number=${encodeURIComponent(
                            detailOrder.order_number
                          )}`
                        );
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Create Bill
                    </Button>
                    {detailOrder.status !== 'received' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const po = detailOrder;
                          setSelectedOrder(po);
                          const initQtys: Record<number, number> = {};
                          (po.items || []).forEach((item: any) => {
                            initQtys[item.id] = item.quantity - (item.quantity_received || 0);
                          });
                          setReceiveQtys(initQtys);
                          setDetailOrder(null);
                          setIsReceiveOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        Receive Goods
                      </Button>
                    )}
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailOrder(null)}
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

