import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
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
  AlertTriangle,
  Trash2,
  CreditCard,
  ShieldCheck,
  UserCheck,
  FileText,
} from 'lucide-react';
import { salesOrdersApi, customersApi, productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PAYMENT_TERMS_OPTIONS, calculateDueDate } from '../constants/formOptions';

export const SalesOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(15);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Urban Furniture Sales Order. Deliver to customer site.');
  const [items, setItems] = useState<
    Array<{ product_id: number | ''; quantity: number; unit_price: number; gst_rate: number }>
  >([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deliver Modal State
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliverQtys, setDeliverQtys] = useState<Record<number, number>>({});
  const [isDelivering, setIsDelivering] = useState(false);

  // Detail Modal State
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const handleOpenDetail = async (so: any) => {
    setDetailOrder(so);
    try {
      const res = await salesOrdersApi.get(so.id);
      if (res?.data) {
        setDetailOrder(res.data);
      } else if (res) {
        setDetailOrder(res);
      }
    } catch (err) {
      console.error('Failed to fetch sales order details:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, custRes, prodRes] = await Promise.all([
        salesOrdersApi.list(),
        customersApi.list(),
        productsApi.list(),
      ]);
      setOrders(orderRes.data || orderRes || []);
      setCustomers(custRes.data || custRes || []);
      setProducts(prodRes.data || prodRes || []);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load sales orders.' });
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
      unit_price: Number(prod.price),
      gst_rate: Number(prod.gst_rate || 18),
    };
    setItems(updated);
  };

  const handleCustomerSelect = (id: number | '') => {
    setCustomerId(id);
    if (id) {
      const c = customers.find((cust) => cust.id === id);
      const terms = c?.payment_terms_days ?? 15;
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
    if (!customerId) {
      addToast({ type: 'warning', title: 'Validation', message: 'Please select a customer.' });
      return;
    }
    const valid = items.filter((i) => i.product_id && i.quantity > 0);
    if (valid.length === 0) {
      addToast({ type: 'warning', title: 'Validation', message: 'Add at least one valid item.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await salesOrdersApi.create({
        customer_id: customerId,
        order_date: orderDate,
        delivery_date: expectedDate,
        notes,
        items: valid.map((it) => ({
          ...it,
          quantity_ordered: it.quantity,
          tax_rate: it.gst_rate,
        })),
      });
      addToast({ type: 'success', title: 'SO Created', message: 'Draft sales order created.' });
      setIsCreateOpen(false);
      setCustomerId('');
      setPaymentTermsDays(15);
      setItems([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Creation Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await salesOrdersApi.confirm(id);
      addToast({ type: 'success', title: 'SO Confirmed', message: 'Sales order confirmed.' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await salesOrdersApi.approve(id);
      addToast({ type: 'success', title: 'SO Approved', message: 'Sales order approved by manager.' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message });
    }
  };

  const handleDeliverConfirm = async () => {
    if (!selectedOrder) return;
    try {
      setIsDelivering(true);
      const itemsPayload = (selectedOrder.items || []).map((item: any) => ({
        id: item.id,
        quantity_delivered: deliverQtys[item.id] ?? (item.quantity - (item.quantity_delivered || 0)),
      }));

      await salesOrdersApi.deliver(selectedOrder.id, {
        delivery_date: new Date().toISOString().split('T')[0],
        items: itemsPayload,
      });

      addToast({
        type: 'success',
        title: 'Goods Delivered & COGS Auto-Posted',
        message: 'Auto COGS & inventory relief journal entry posted (Dr COGS 5010, Cr Inventory 1130) and stock deducted.',
      });
      setIsDeliverOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delivery Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsDelivering(false);
    }
  };

  const filteredOrders = orders.filter((so) => {
    const matchesSearch =
      so.so_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      so.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || so.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const isCustomerInterState = selectedCustomer
    ? (selectedCustomer.state &&
        !selectedCustomer.state.toLowerCase().includes('maharashtra') &&
        selectedCustomer.state.toUpperCase() !== 'MH' &&
        selectedCustomer.state !== '27') ||
      (selectedCustomer.gstin && !selectedCustomer.gstin.startsWith('27'))
    : false;

  const soSubtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const soTotalTax = items.reduce(
    (acc, it) =>
      acc +
      ((Number(it.quantity) || 0) *
        (Number(it.unit_price) || 0) *
        (Number(it.gst_rate) || 0)) /
        100,
    0
  );
  const soGrandTotal = soSubtotal + soTotalTax;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-emerald-400" />
            Sales Orders & Deliveries
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Customer sales pipelines, order approvals, and automated COGS inventory relief.
          </p>
        </div>

        <Button
          onClick={() => {
            setCustomerId('');
            setIsCreateOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-600/20 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Sales Order
        </Button>
      </div>

      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search SO or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="approved">Approved</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">SO Number</th>
                <th className="py-3 px-4">Customer</th>
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
                  icon={Truck}
                  colSpan={8}
                  title="No sales orders found"
                  description="Create a sales order to initiate order fulfillment and GST invoicing."
                  actionLabel="New Sales Order"
                  onAction={() => setIsCreateOpen(true)}
                  secondaryActionLabel={searchQuery || statusFilter !== 'all' ? 'Clear Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                />
              ) : (
                filteredOrders.map((so) => {
                  return (
                    <tr
                      key={so.id}
                      onClick={() => handleOpenDetail(so)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-emerald-400 group-hover:underline">
                        {so.so_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-200">{so.customer?.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{so.customer?.gstin || 'Unregistered'}</div>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        <div>Date: {so.order_date ? so.order_date.split('T')[0] : 'N/A'}</div>
                        <div className="text-[10px] text-neutral-500">Delivery: {so.delivery_date ? so.delivery_date.split('T')[0] : (so.expected_delivery_date ? so.expected_delivery_date.split('T')[0] : 'N/A')}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-300">
                        ₹{Number(so.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-400">
                        ₹{Number(so.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ₹{Number(so.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            so.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : so.status === 'approved'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : so.status === 'confirmed'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {so.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {so.status === 'draft' && (
                            <button
                              onClick={() => handleConfirm(so.id)}
                              className="px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition-colors"
                            >
                              Confirm
                            </button>
                          )}

                          {so.status === 'confirmed' && (isAdmin || isManager) && (
                            <button
                              onClick={() => handleApprove(so.id)}
                              className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-semibold transition-colors"
                            >
                              Approve
                            </button>
                          )}

                          {(so.status === 'confirmed' || so.status === 'approved' || so.status === 'partially_delivered' || so.status === 'delivered') && (isAdmin || isManager) && (
                            <button
                              onClick={() => navigate(`/invoices?from_so=${so.id}`)}
                              className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Create Customer Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Create Invoice
                            </button>
                          )}

                          {(so.status === 'approved' || so.status === 'partially_delivered') && (isAdmin || isManager) && (
                            <button
                              onClick={() => {
                                setSelectedOrder(so);
                                const initQtys: Record<number, number> = {};
                                (so.items || []).forEach((item: any) => {
                                  initQtys[item.id] = item.quantity - (item.quantity_delivered || 0);
                                });
                                setDeliverQtys(initQtys);
                                setIsDeliverOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Deliver
                            </button>
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

      {/* Create SO Modal */}
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
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Sales Order (Client Contract)</h3>
                <p className="text-xs text-neutral-400">
                  Book commercial sales contracts, schedule client delivery dates & reserve warehouse inventory
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
            {/* Customer Selector Card */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.07] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Customer / Client Account
                </label>
                {selectedCustomer && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isCustomerInterState
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    {isCustomerInterState ? 'Inter-State Supply (IGST 100%)' : 'Intra-State Supply (CGST 50% + SGST 50%)'}
                  </span>
                )}
              </div>

              <select
                value={customerId}
                onChange={(e) => handleCustomerSelect(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
              >
                <option value="">Select a registered client or institutional customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} • {c.state || 'MH'} {c.gstin ? `(${c.gstin})` : '(Unregistered)'}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs border-t border-white/[0.04]">
                  <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-medium text-neutral-400 block">GSTIN</span>
                    <span className="font-mono font-semibold text-neutral-200">{selectedCustomer.gstin || 'Unregistered'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-medium text-neutral-400 block">Place of Supply</span>
                    <span className="font-semibold text-neutral-200">{selectedCustomer.state || 'Maharashtra (27)'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-medium text-neutral-400 block">Commercial Terms</span>
                    <span className="font-semibold text-emerald-400">
                      {selectedCustomer.credit_limit ? `Limit ₹${Number(selectedCustomer.credit_limit).toLocaleString('en-IN')}` : 'Credit Approved'} • Net {paymentTermsDays}d
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
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTermsDays}
                  onChange={(e) => handlePaymentTermsChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-neutral-300 border-b border-white/[0.06] pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Sales Line Items ({items.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }])
                  }
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Furniture Product
                </button>
              </div>

              <div className="space-y-2">
                {items.map((it, idx) => {
                  const prod = products.find((p) => p.id === it.product_id);
                  const lineSubtotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
                  const lineTax = (lineSubtotal * (Number(it.gst_rate) || 0)) / 100;
                  const isStockDeficit = prod && it.quantity > (prod.current_stock ?? 0);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2.5 hover:border-white/[0.1] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-0.5">
                            Furniture Product SKU
                          </label>
                          <select
                            value={it.product_id}
                            onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                            required
                            className="w-full px-2.5 py-1.5 bg-[#141418] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="">Select Furniture Item / SKU...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) • Stock: {p.current_stock ?? 0} {p.unit_of_measure || 'pcs'} • Price: ₹{Number(p.price).toLocaleString('en-IN')}
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
                            Selling Price (₹)
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

                      <div className="flex flex-wrap justify-between items-center text-[11px] text-neutral-400 bg-black/20 px-2.5 py-1.5 rounded-md gap-2">
                        <div>
                          {prod ? (
                            isStockDeficit ? (
                              <span className="text-amber-400 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                Requested {it.quantity} exceeds on-hand stock ({prod.current_stock ?? 0} {prod.unit_of_measure || 'units'}) — Production / PO required
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                Available in warehouse: {prod.current_stock ?? 0} {prod.unit_of_measure || 'units'}
                              </span>
                            )
                          ) : (
                            <span className="text-neutral-500 italic">Select product to check warehouse stock availability</span>
                          )}
                        </div>
                        <div className="font-mono">
                          Subtotal: <strong className="text-white">₹{lineSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> + Tax: <strong className="text-neutral-300">₹{lineTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery / Project Notes */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Site Delivery Instructions / Project Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Site gate pass, delivery contact person, installation instructions..."
                className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Financial Summary & Auto-COGS Note */}
            <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-emerald-500/10 pb-2">
                <span className="text-neutral-400">Order Subtotal:</span>
                <span className="font-mono font-bold text-white">
                  ₹{soSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-emerald-500/10 pb-2">
                <span className="text-neutral-400">
                  {isCustomerInterState ? 'IGST (Inter-State Outflow):' : 'CGST + SGST (Intra-State Outflow):'}
                </span>
                <span className="font-mono text-neutral-300">
                  ₹{soTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-0.5">
                <span className="font-bold text-white">Grand Order Value:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  ₹{soGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Delivery fulfillment will automatically post inventory relief: <strong className="text-neutral-300">Dr COGS 5010 / Cr Inventory 1130</strong>.</span>
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {isSubmitting ? 'Booking Sales Order...' : 'Save Draft SO'}
              </Button>
            </div>
          </form>
        </div>
      </PortalModal>

      {/* Deliver Modal */}
      <PortalModal
        isOpen={isDeliverOpen && !!selectedOrder}
        onClose={() => setIsDeliverOpen(false)}
        zIndex="z-[70]"
        containerClassName="max-w-md"
      >
        {selectedOrder && (
          <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold">Deliver Goods (COGS Auto-Post)</h3>
            <p className="text-xs text-neutral-400">
              Delivery records fulfillment, automatically relieves finished inventory (Cr Inventory 1130) and posts Cost of Goods Sold (Dr COGS 5010).
            </p>

            <div className="space-y-3">
              {(selectedOrder?.items || []).map((item: any) => (
                <div key={item.id} className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{item.product?.name || item.description}</div>
                    <div className="text-[10px] text-neutral-500">Ordered: {item.quantity} | Previously Delivered: {item.quantity_delivered || 0}</div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={item.quantity - (item.quantity_delivered || 0)}
                    value={deliverQtys[item.id] ?? (item.quantity - (item.quantity_delivered || 0))}
                    onChange={(e) =>
                      setDeliverQtys({ ...deliverQtys, [item.id]: Number(e.target.value) })
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
                onClick={() => setIsDeliverOpen(false)}
                className="border-neutral-700 bg-neutral-800 text-neutral-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isDelivering}
                onClick={handleDeliverConfirm}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {isDelivering ? 'Processing...' : 'Confirm Delivery & Post COGS'}
              </Button>
            </div>
          </div>
        )}
      </PortalModal>

      {/* Sales Order Detail Modal */}
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
                  <span className="font-mono text-sm font-bold text-white">{detailOrder.so_number}</span>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      detailOrder.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : detailOrder.status === 'approved'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : detailOrder.status === 'confirmed'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {detailOrder.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {detailOrder.customer?.name || 'Customer Order'}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  GSTIN: {detailOrder.customer?.gstin || 'Unregistered'} • State: {detailOrder.customer?.state || 'MH'}
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
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Delivery Date</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {detailOrder.delivery_date ? detailOrder.delivery_date.split('T')[0] : (detailOrder.expected_delivery_date ? detailOrder.expected_delivery_date.split('T')[0] : 'N/A')}
                </div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Tax Amount</div>
                <div className="font-mono font-bold text-neutral-300 mt-0.5">
                  ₹{Number(detailOrder.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Total Value</div>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">
                  ₹{Number(detailOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Order Line Items</h4>
              <div className="border border-white/[0.08] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-bold text-neutral-400 uppercase">
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Delivered</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">GST %</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(detailOrder.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-neutral-400">
                          No line items found for this sales order.
                        </td>
                      </tr>
                    ) : (
                      (detailOrder.items || []).map((item: any) => {
                        const qty = Number(item.quantity ?? item.quantity_ordered ?? 0);
                        const delivered = Number(item.quantity_delivered ?? 0);
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
                              <div className="font-semibold text-white">{item.product?.name || item.description || 'Custom Item'}</div>
                              {item.product?.sku && (
                                <div className="text-[10px] font-mono text-amber-400">SKU: {item.product.sku}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{qty}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                              {delivered} / {qty}
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
                <span className="font-semibold text-neutral-300">Terms / Notes:</span> {detailOrder.notes}
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
                      await handleConfirm(detailOrder.id);
                      setDetailOrder(null);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    Confirm Order
                  </Button>
                )}

                {detailOrder.status === 'confirmed' && (isAdmin || isManager) && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await handleApprove(detailOrder.id);
                      setDetailOrder(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Approve Order
                  </Button>
                )}

                {(detailOrder.status === 'confirmed' || detailOrder.status === 'approved' || detailOrder.status === 'partially_delivered' || detailOrder.status === 'delivered') && (isAdmin || isManager) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate(`/invoices?from_so=${detailOrder.id}`);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Create Invoice
                  </Button>
                )}

                {(detailOrder.status === 'approved' || detailOrder.status === 'partially_delivered') && (isAdmin || isManager) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const so = detailOrder;
                      setSelectedOrder(so);
                      const initQtys: Record<number, number> = {};
                      (so.items || []).forEach((item: any) => {
                        initQtys[item.id] = item.quantity - (item.quantity_delivered || 0);
                      });
                      setDeliverQtys(initQtys);
                      setDetailOrder(null);
                      setIsDeliverOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    Deliver Goods
                  </Button>
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

