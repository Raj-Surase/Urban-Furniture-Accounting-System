import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { salesOrdersApi, customersApi, productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const SalesOrdersPage: React.FC = () => {
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
        items: valid,
      });
      addToast({ type: 'success', title: 'SO Created', message: 'Draft sales order created.' });
      setIsCreateOpen(false);
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
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Loading sales orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 italic">
                    No sales orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((so) => (
                  <tr key={so.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{so.so_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-200">{so.customer?.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{so.customer?.gstin || 'Unregistered'}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div>Date: {so.order_date}</div>
                      <div className="text-[10px] text-neutral-500">Delivery: {so.delivery_date || 'N/A'}</div>
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
                    <td className="py-3 px-4 text-right">
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

                        {(so.status === 'approved' || so.status === 'partially_delivered') && (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create SO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <h3 className="text-base font-bold">New Sales Order</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.gstin || 'No GSTIN'}) - {c.state || 'MH'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Order Date</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-neutral-400">
                  <span>Items</span>
                  <button
                    type="button"
                    onClick={() =>
                      setItems([...items, { product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }])
                    }
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    + Add Item
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={it.product_id}
                      onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                      required
                      className="flex-1 px-2 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded text-xs text-white"
                    >
                      <option value="">Select Product SKU...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].quantity = Number(e.target.value);
                        setItems(updated);
                      }}
                      className="w-20 px-2 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded text-xs text-white text-right"
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={it.unit_price}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].unit_price = Number(e.target.value);
                        setItems(updated);
                      }}
                      className="w-24 px-2 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded text-xs text-white text-right font-mono"
                    />

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="text-neutral-500 hover:text-rose-400 px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isSubmitting ? 'Creating...' : 'Save Draft SO'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliver Modal */}
      {isDeliverOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-md bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <h3 className="text-base font-bold">Deliver Goods (COGS Auto-Post)</h3>
            <p className="text-xs text-neutral-400">
              Delivery records fulfillment, automatically relieves finished inventory (Cr Inventory 1130) and posts Cost of Goods Sold (Dr COGS 5010).
            </p>

            <div className="space-y-3">
              {(selectedOrder.items || []).map((item: any) => (
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
        </div>
      )}
    </div>
  );
};

