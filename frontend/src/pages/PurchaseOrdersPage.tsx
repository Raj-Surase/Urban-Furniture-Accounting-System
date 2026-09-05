import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { purchaseOrdersApi, vendorsApi, productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PurchaseOrdersPage: React.FC = () => {
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
        items: valid,
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
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 italic">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{po.po_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-200">{po.vendor?.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{po.vendor?.gstin || 'Unregistered'}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div>Date: {po.order_date}</div>
                      <div className="text-[10px] text-neutral-500">Exp: {po.expected_delivery_date || 'N/A'}</div>
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
                    <td className="py-3 px-4 text-right">
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

                        {(po.status === 'approved' || po.status === 'partially_received') && (
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <h3 className="text-base font-bold">New Purchase Order</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Vendor</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                >
                  <option value="">Select vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gstin || 'No GSTIN'})
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
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Expected Delivery</label>
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
                    className="text-indigo-400 hover:text-indigo-300"
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isSubmitting ? 'Creating...' : 'Save Draft PO'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {isReceiveOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-md bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <h3 className="text-base font-bold">Receive Goods (GRNI Auto-Post)</h3>
            <p className="text-xs text-neutral-400">
              Receiving will automatically increase warehouse stock and debit Raw Materials / Inventory with a credit to GRNI clearing account.
            </p>

            <div className="space-y-3">
              {(selectedOrder.items || []).map((item: any) => (
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
        </div>
      )}
    </div>
  );
};

