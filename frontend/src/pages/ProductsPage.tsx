import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Search,
  CheckCircle,
  Package,
  Edit2,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const ProductsPage: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Stock Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical Stock Count');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // New Product Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('goods');
  const [newCategory, setNewCategory] = useState('Chairs');
  const [newHsn, setNewHsn] = useState('9403');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newGstRate, setNewGstRate] = useState<number>(18);
  const [newMinStock, setNewMinStock] = useState<number>(5);
  const [newInitialStock, setNewInitialStock] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);

  // Detail Product Modal
  const [detailProduct, setDetailProduct] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.list();
      setProducts(res.data || res || []);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load products.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleRoleUpdated = () => {
      fetchProducts();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustmentDelta === 0) return;
    try {
      setIsAdjusting(true);
      await productsApi.adjustStock(selectedProduct.id, {
        quantity_delta: adjustmentDelta,
        reason: adjustmentReason,
        notes: adjustmentNotes,
      });
      addToast({
        type: 'success',
        title: 'Stock Adjusted',
        message: `Updated stock for ${selectedProduct.name} by ${adjustmentDelta > 0 ? '+' : ''}${adjustmentDelta}.`,
      });
      setIsAdjustOpen(false);
      setSelectedProduct(null);
      setAdjustmentDelta(0);
      fetchProducts();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Adjustment Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await productsApi.create({
        sku: newSku,
        name: newName,
        type: newType,
        category: newCategory,
        hsn_code: newHsn,
        price: newPrice,
        cost_price: newCostPrice,
        gst_rate: newGstRate,
        min_stock_alert: newMinStock,
        current_stock: newInitialStock,
      });
      addToast({ type: 'success', title: 'Product Created', message: `${newName} added to inventory catalog.` });
      setIsNewOpen(false);
      // Reset
      setNewSku('');
      setNewName('');
      setNewType('goods');
      setNewPrice(0);
      setNewCostPrice(0);
      fetchProducts();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Creation Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsCreating(false);
    }
  };

  const lowStockItems = products.filter(
    (p) => Number(p.current_stock) <= Number(p.min_stock_alert || 5)
  );

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-amber-400" />
            Products & Furniture Inventory
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            SKU management, HSN GST classification, valuation, and real-time inventory tracking.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <Button
            onClick={() => setIsNewOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white gap-2 shadow-lg shadow-amber-600/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add New Product SKU
          </Button>
        )}
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-300">
                Low Stock Warning: {lowStockItems.length} product(s) reached or fell below threshold!
              </p>
              <p className="text-[11px] text-amber-200/70">
                {lowStockItems.map((p) => `${p.name} (${p.current_stock} left)`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search product SKU or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 w-64"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-lg text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">HSN Code</th>
                <th className="py-3 px-4 text-right">Cost (₹)</th>
                <th className="py-3 px-4 text-right">Selling Price (₹)</th>
                <th className="py-3 px-4 text-center">GST %</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500 italic">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = Number(prod.current_stock) <= Number(prod.min_stock_alert || 5);
                  return (
                    <tr
                      key={prod.id}
                      onClick={() => setDetailProduct(prod)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-400 group-hover:underline">{prod.sku}</td>
                      <td className="py-3 px-4 font-semibold text-white">{prod.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            prod.type === 'service'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : prod.type === 'combo'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {prod.type || 'Goods'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">{prod.category || 'General'}</td>
                      <td className="py-3 px-4 text-center font-mono text-neutral-400">{prod.hsn_code || '9403'}</td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-300">
                        ₹{Number(prod.cost_price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ₹{Number(prod.price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-neutral-400">{prod.gst_rate || 18}%</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {prod.current_stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {(isAdmin || isManager) && (
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setAdjustmentDelta(0);
                              setIsAdjustOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-amber-600 hover:text-white text-neutral-300 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust Stock Modal */}
      {isAdjustOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-md bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <h3 className="text-base font-bold">Adjust Product Stock</h3>
            <p className="text-xs text-neutral-400">
              Update inventory quantity for <span className="text-white font-semibold">{selectedProduct.name}</span> (SKU: {selectedProduct.sku}).
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs flex justify-between items-center">
                <span className="text-neutral-400">Current Warehouse Stock:</span>
                <span className="font-mono font-bold text-white text-sm">{selectedProduct.current_stock}</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Quantity Delta (+ to increase, - to decrease)
                </label>
                <input
                  type="number"
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono font-bold"
                  placeholder="e.g. +5 or -2"
                />
                <div className="text-[10.5px] text-neutral-400 mt-1">
                  New resulting stock: <span className="font-bold text-amber-400">{Number(selectedProduct.current_stock) + Number(adjustmentDelta)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Reason for Adjustment</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                >
                  <option value="Physical Stock Count">Physical Stock Count</option>
                  <option value="Damaged Goods / Scrap">Damaged Goods / Scrap</option>
                  <option value="Customer Return Without SO">Customer Return Without SO</option>
                  <option value="Opening Balance Correction">Opening Balance Correction</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Notes / Audit Ref</label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  placeholder="Internal audit observations..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdjustOpen(false)}
                  className="border-neutral-700 bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAdjusting}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  {isAdjusting ? 'Saving...' : 'Save Stock Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Product SKU Modal */}
      {isNewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white my-auto space-y-4">
            <h3 className="text-base font-bold">Add Product SKU</h3>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    required
                    placeholder="e.g. OFC-CHR-01"
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Product Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white capitalize"
                  >
                    <option value="goods">Goods (Stock)</option>
                    <option value="service">Service</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                    placeholder="e.g. Chairs, Tables, Sofas"
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Product Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="e.g. Office Chair, Wooden Table, Sofa, Dining Table"
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={newHsn}
                    onChange={(e) => setNewHsn(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">GST Rate %</label>
                  <select
                    value={newGstRate}
                    onChange={(e) => setNewGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white"
                  >
                    <option value="18">18% (Standard Furniture)</option>
                    <option value="12">12%</option>
                    <option value="28">28%</option>
                    <option value="5">5%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  disabled={isCreating}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  {isCreating ? 'Creating...' : 'Save Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white my-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {detailProduct.sku}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      detailProduct.type === 'service'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : detailProduct.type === 'combo'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {detailProduct.type || 'Goods'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1.5">{detailProduct.name}</h2>
                <p className="text-xs text-neutral-400">Category: {detailProduct.category || 'General Furniture'}</p>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Current Stock</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  {detailProduct.current_stock}
                </div>
                <div className="text-[10px] text-neutral-500">Threshold: {detailProduct.min_stock_alert || 5} units</div>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Selling Price</div>
                <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                  ₹{Number(detailProduct.price).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-neutral-500">GST Rate: {detailProduct.gst_rate || 18}%</div>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Inventory Valuation</div>
                <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                  ₹{(Number(detailProduct.current_stock) * Number(detailProduct.cost_price || 0)).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-neutral-500">Unit Cost: ₹{Number(detailProduct.cost_price || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Specifications & Classification */}
            <div className="space-y-2 text-xs bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
              <h4 className="font-semibold text-neutral-300 text-xs uppercase tracking-wider mb-2">Statutory & Specs</h4>
              <div className="grid grid-cols-2 gap-y-2 text-neutral-300">
                <div>
                  <span className="text-neutral-500">HSN Code:</span>{' '}
                  <span className="font-mono font-bold text-white">{detailProduct.hsn_code || '9403'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">GST Slab:</span>{' '}
                  <span className="font-mono font-bold text-white">{detailProduct.gst_rate || 18}% GST</span>
                </div>
                <div>
                  <span className="text-neutral-500">Gross Margin:</span>{' '}
                  <span className="font-mono font-bold text-emerald-400">
                    {detailProduct.price && detailProduct.cost_price
                      ? `${Math.round(((detailProduct.price - detailProduct.cost_price) / detailProduct.price) * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Status:</span>{' '}
                  <span
                    className={`font-semibold ${
                      Number(detailProduct.current_stock) <= Number(detailProduct.min_stock_alert || 5)
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {Number(detailProduct.current_stock) <= Number(detailProduct.min_stock_alert || 5)
                      ? 'Low Stock Reorder Alert'
                      : 'Optimal Stock Level'}
                  </span>
                </div>
              </div>
              {detailProduct.description && (
                <div className="pt-2 border-t border-white/[0.06] text-neutral-400 text-xs">
                  {detailProduct.description}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div className="text-[11px] text-neutral-500 font-mono">
                ID: #{detailProduct.id} • SKU: {detailProduct.sku}
              </div>
              <div className="flex items-center gap-2">
                {(isAdmin || isManager) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(detailProduct);
                      setAdjustmentDelta(0);
                      setIsAdjustOpen(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs gap-1.5"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Adjust Stock
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailProduct(null)}
                  className="border-neutral-700 bg-neutral-800 text-neutral-300 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

