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
  AlertCircle,
} from 'lucide-react';
import { productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';

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
  const [adjustmentDelta, setAdjustmentDelta] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState('Physical Stock Count');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustFieldErrors, setAdjustFieldErrors] = useState<Record<string, string>>({});
  const [adjustFormError, setAdjustFormError] = useState<string | null>(null);

  // New Product Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('goods');
  const [newCategory, setNewCategory] = useState('Chairs');
  const [newHsn, setNewHsn] = useState('9403');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newCostPrice, setNewCostPrice] = useState<string>('');
  const [newGstRate, setNewGstRate] = useState<number>(18);
  const [newMinStock, setNewMinStock] = useState<string>('5');
  const [newInitialStock, setNewInitialStock] = useState<string>('0');
  const [isCreating, setIsCreating] = useState(false);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // Detail Product Modal
  const [detailProduct, setDetailProduct] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.list();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setProducts(list.filter(Boolean));
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
    setAdjustFormError(null);
    setAdjustFieldErrors({});

    const targetProduct = selectedProduct;
    if (!targetProduct) return;

    const trimmed = adjustmentDelta.trim();
    const delta = parseInt(trimmed, 10);
    if (!trimmed || isNaN(delta) || delta === 0) {
      setAdjustFieldErrors({ delta: 'Please enter a valid non-zero adjustment quantity.' });
      addToast({ type: 'warning', title: 'Validation', message: 'Please enter a valid non-zero adjustment quantity.' });
      return;
    }

    try {
      setIsAdjusting(true);
      await productsApi.adjustStock(targetProduct.id, {
        quantity_delta: delta,
        reason: adjustmentReason,
        notes: adjustmentNotes,
      });
      addToast({
        type: 'success',
        title: 'Stock Adjusted',
        message: `Updated stock for ${targetProduct.name || 'Product'} by ${delta > 0 ? '+' : ''}${delta}.`,
      });
      setIsAdjustOpen(false);
      setSelectedProduct(null);
      setAdjustmentDelta('');
      setAdjustFieldErrors({});
      setAdjustFormError(null);
      fetchProducts();
    } catch (err: any) {
      const formatted = formatApiError(err);
      setAdjustFormError(formatted.message);
      if (formatted.fieldErrors && Object.keys(formatted.fieldErrors).length > 0) {
        setAdjustFieldErrors(formatted.fieldErrors);
      }
      addToast({
        type: 'error',
        title: formatted.isValidationError ? 'Validation Failed' : 'Adjustment Failed',
        message: formatted.message,
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);
    const errors: Record<string, string> = {};

    if (!newSku.trim()) errors.sku = 'SKU Code is required.';
    if (!newName.trim()) errors.name = 'Product name is required.';
    if (!newCategory.trim()) errors.category = 'Category is required.';

    const costNum = parseFloat(newCostPrice.trim());
    if (!newCostPrice.trim() || isNaN(costNum) || costNum < 0) {
      errors.cost_price = 'Please enter a valid cost price (₹).';
    }

    const priceNum = parseFloat(newPrice.trim());
    if (!newPrice.trim() || isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Please enter a valid selling price (₹).';
    }

    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      addToast({ type: 'warning', title: 'Validation', message: 'Please fix the required fields.' });
      return;
    }

    try {
      setIsCreating(true);
      const initStockNum = newInitialStock.trim() === '' ? 0 : parseInt(newInitialStock.trim(), 10) || 0;
      const minStockNum = newMinStock.trim() === '' ? 5 : parseInt(newMinStock.trim(), 10) || 0;

      await productsApi.create({
        sku: newSku.trim(),
        name: newName.trim(),
        type: newType,
        category: newCategory.trim(),
        hsn_code: newHsn.trim() || '9403',
        price: priceNum,
        unit_price: priceNum,
        cost_price: costNum,
        gst_rate: newGstRate,
        min_stock_alert: minStockNum,
        minimum_stock: minStockNum,
        current_stock: initStockNum,
      });
      addToast({ type: 'success', title: 'Product Created', message: `${newName.trim()} added to inventory catalog.` });
      setIsNewOpen(false);
      // Reset
      setNewSku('');
      setNewName('');
      setNewType('goods');
      setNewCategory('Chairs');
      setNewHsn('9403');
      setNewPrice('');
      setNewCostPrice('');
      setNewGstRate(18);
      setNewMinStock('5');
      setNewInitialStock('0');
      setCreateFieldErrors({});
      setCreateFormError(null);
      fetchProducts();
    } catch (err: any) {
      const formatted = formatApiError(err);
      setCreateFormError(formatted.message);
      if (formatted.fieldErrors && Object.keys(formatted.fieldErrors).length > 0) {
        setCreateFieldErrors(formatted.fieldErrors);
      }
      addToast({
        type: 'error',
        title: formatted.isValidationError ? 'Validation Failed' : 'Creation Failed',
        message: formatted.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const lowStockItems = Array.isArray(products)
    ? products.filter(
        (p) => p && Number(p?.current_stock ?? 0) <= Number(p?.min_stock_alert ?? 5)
      )
    : [];

  const categories = Array.from(
    new Set(
      (Array.isArray(products) ? products : [])
        .filter((p) => Boolean(p && p.category))
        .map((p) => p.category)
    )
  );

  const filteredProducts = (Array.isArray(products) ? products : []).filter((p) => {
    if (!p) return false;
    const nameMatches = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const skuMatches = p.sku ? p.sku.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchesSearch = !searchQuery || nameMatches || skuMatches;
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
            onClick={() => {
              setCreateFieldErrors({});
              setCreateFormError(null);
              setIsNewOpen(true);
            }}
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
                {lowStockItems.map((p) => `${p?.name || 'Item'} (${p?.current_stock ?? 0} left)`).join(', ')}
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
                <TableSkeleton rows={6} cols={10} />
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  colSpan={10}
                  title="No products found"
                  description="Add raw materials, finished furniture, or hardware to your inventory catalog."
                  actionLabel="New Product"
                  onAction={() => setIsNewOpen(true)}
                  secondaryActionLabel={searchQuery || categoryFilter !== 'all' ? 'Clear Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                />
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
                              setAdjustmentDelta('');
                              setAdjustFieldErrors({});
                              setAdjustFormError(null);
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
      {Boolean(isAdjustOpen && selectedProduct) && (
        <PortalModal
          isOpen={isAdjustOpen && !!selectedProduct}
          onClose={() => {
            setIsAdjustOpen(false);
            setSelectedProduct(null);
          }}
          zIndex="z-[70]"
          containerClassName="max-w-md"
        >
          {selectedProduct && (
            <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-4">
              <h3 className="text-base font-bold">Adjust Product Stock</h3>
              <p className="text-xs text-neutral-400">
                Update inventory quantity for <span className="text-white font-semibold">{selectedProduct?.name}</span> (SKU: {selectedProduct?.sku}).
              </p>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                {adjustFormError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{adjustFormError}</span>
                  </div>
                )}

                <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs flex justify-between items-center">
                  <span className="text-neutral-400">Current Warehouse Stock:</span>
                  <span className="font-mono font-bold text-white text-sm">{selectedProduct?.current_stock ?? 0}</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Quantity Delta (+ to increase, - to decrease) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={adjustmentDelta}
                    onChange={(e) => {
                      setAdjustmentDelta(e.target.value);
                      if (adjustFieldErrors.delta) {
                        setAdjustFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.delta;
                          return next;
                        });
                      }
                    }}
                    required
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white font-mono font-bold focus:outline-none ${
                      adjustFieldErrors.delta
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-amber-500'
                    }`}
                    placeholder="e.g. 5 or -2"
                  />
                  {adjustFieldErrors.delta && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{adjustFieldErrors.delta}</span>
                  )}
                  <div className="text-[10.5px] text-neutral-400 mt-1">
                    New resulting stock:{' '}
                    <span className="font-bold text-amber-400">
                      {isNaN(parseInt(adjustmentDelta, 10))
                        ? Number(selectedProduct?.current_stock || 0)
                        : Number(selectedProduct?.current_stock || 0) + parseInt(adjustmentDelta, 10)}
                    </span>
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
                    onClick={() => {
                      setIsAdjustOpen(false);
                      setSelectedProduct(null);
                    }}
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
          )}
        </PortalModal>
      )}

      {/* New Product SKU Modal */}
      <PortalModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        zIndex="z-[60]"
        containerClassName="max-w-lg"
      >
        <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold">Add Product SKU</h3>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {createFormError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{createFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    SKU Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => {
                      setNewSku(e.target.value);
                      if (createFieldErrors.sku) {
                        setCreateFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.sku;
                          return next;
                        });
                      }
                    }}
                    required
                    placeholder="e.g. OFC-CHR-01"
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white font-mono focus:outline-none ${
                      createFieldErrors.sku
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {createFieldErrors.sku && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{createFieldErrors.sku}</span>
                  )}
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
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value);
                      if (createFieldErrors.category) {
                        setCreateFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.category;
                          return next;
                        });
                      }
                    }}
                    required
                    placeholder="e.g. Chairs, Tables, Sofas"
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                      createFieldErrors.category
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {createFieldErrors.category && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{createFieldErrors.category}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (createFieldErrors.name) {
                      setCreateFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  required
                  placeholder="e.g. Office Chair, Wooden Table, Sofa, Dining Table"
                  className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white focus:outline-none ${
                    createFieldErrors.name
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-700 focus:border-amber-500'
                  }`}
                />
                {createFieldErrors.name && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{createFieldErrors.name}</span>
                )}
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
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Cost Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newCostPrice}
                    onChange={(e) => {
                      setNewCostPrice(e.target.value);
                      if (createFieldErrors.cost_price) {
                        setCreateFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.cost_price;
                          return next;
                        });
                      }
                    }}
                    required
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white text-right font-mono focus:outline-none ${
                      createFieldErrors.cost_price
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {createFieldErrors.cost_price && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{createFieldErrors.cost_price}</span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Selling Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => {
                      setNewPrice(e.target.value);
                      if (createFieldErrors.price || createFieldErrors.unit_price) {
                        setCreateFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.price;
                          delete next.unit_price;
                          return next;
                        });
                      }
                    }}
                    required
                    className={`w-full px-3 py-2 bg-[#1a1a22] border rounded-lg text-xs text-white text-right font-mono focus:outline-none ${
                      createFieldErrors.price || createFieldErrors.unit_price
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-700 focus:border-amber-500'
                    }`}
                  />
                  {(createFieldErrors.price || createFieldErrors.unit_price) && (
                    <span className="text-[11px] text-rose-400 mt-1 block">
                      {createFieldErrors.price || createFieldErrors.unit_price}
                    </span>
                  )}
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
                    min="0"
                    placeholder="0"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white text-right font-mono focus:border-amber-500 focus:outline-none"
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
      </PortalModal>

      {/* Product Detail Modal */}
      {Boolean(detailProduct) && (
        <PortalModal
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          zIndex="z-[60]"
          containerClassName="max-w-xl"
        >
          {detailProduct && (
            <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {detailProduct?.sku}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        detailProduct?.type === 'service'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : detailProduct?.type === 'combo'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {detailProduct?.type || 'Goods'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1.5">{detailProduct?.name}</h2>
                  <p className="text-xs text-neutral-400">Category: {detailProduct?.category || 'General Furniture'}</p>
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
                    {detailProduct?.current_stock ?? 0}
                  </div>
                  <div className="text-[10px] text-neutral-500">Threshold: {detailProduct?.min_stock_alert || 5} units</div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Selling Price</div>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                    ₹{Number(detailProduct?.price || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-neutral-500">GST Rate: {detailProduct?.gst_rate || 18}%</div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Inventory Valuation</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                    ₹{(Number(detailProduct?.current_stock || 0) * Number(detailProduct?.cost_price || 0)).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-neutral-500">Unit Cost: ₹{Number(detailProduct?.cost_price || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Specifications & Classification */}
              <div className="space-y-2 text-xs bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                <h4 className="font-semibold text-neutral-300 text-xs uppercase tracking-wider mb-2">Statutory & Specs</h4>
                <div className="grid grid-cols-2 gap-y-2 text-neutral-300">
                  <div>
                    <span className="text-neutral-500">HSN Code:</span>{' '}
                    <span className="font-mono font-bold text-white">{detailProduct?.hsn_code || '9403'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">GST Slab:</span>{' '}
                    <span className="font-mono font-bold text-white">{detailProduct?.gst_rate || 18}% GST</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Gross Margin:</span>{' '}
                    <span className="font-mono font-bold text-emerald-400">
                      {detailProduct?.price && detailProduct?.cost_price
                        ? `${Math.round(((detailProduct.price - detailProduct.cost_price) / detailProduct.price) * 100)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Status:</span>{' '}
                    <span
                      className={`font-semibold ${
                        Number(detailProduct?.current_stock || 0) <= Number(detailProduct?.min_stock_alert || 5)
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {Number(detailProduct?.current_stock || 0) <= Number(detailProduct?.min_stock_alert || 5)
                        ? 'Low Stock Reorder Alert'
                        : 'Optimal Stock Level'}
                    </span>
                  </div>
                </div>
                {detailProduct?.description && (
                  <div className="pt-2 border-t border-white/[0.06] text-neutral-400 text-xs">
                    {detailProduct.description}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <div className="text-[11px] text-neutral-500 font-mono">
                  ID: #{detailProduct?.id} • SKU: {detailProduct?.sku}
                </div>
                <div className="flex items-center gap-2">
                  {(isAdmin || isManager) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(detailProduct);
                        setAdjustmentDelta('');
                        setAdjustFieldErrors({});
                        setAdjustFormError(null);
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
          )}
        </PortalModal>
      )}
    </div>
  );
};

