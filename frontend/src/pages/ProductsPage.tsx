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
  TrendingUp,
  AlertCircle,
  Calculator,
  Tag,
  Building2,
  RefreshCw,
  FolderTree,
  X,
} from 'lucide-react';
import { productsApi, accountsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PortalModal } from '../components/common/PortalModal';
import { MasterViewLayout } from '../components/common/MasterViewLayout';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { CardGridSkeleton } from '../components/common/CardGridSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import {
  FURNITURE_CATEGORIES,
  FURNITURE_HSN_CODES,
  UNITS_OF_MEASURE,
} from '../constants/formOptions';

const productFilterConfigs: FieldFilterConfig[] = [
  { key: 'sku', label: 'SKU / Code', type: 'text', placeholder: 'e.g. CHR-001' },
  { key: 'name', label: 'Product Name', type: 'text', placeholder: 'Product name...' },
  { key: 'category', label: 'Category', type: 'text', placeholder: 'Category...' },
  {
    key: 'type',
    label: 'Product Type',
    type: 'select',
    options: [
      { label: 'Goods', value: 'goods' },
      { label: 'Service', value: 'service' },
      { label: 'Consumable', value: 'consumable' },
    ],
  },
  { key: 'hsn_code', label: 'HSN Code', type: 'text', placeholder: 'HSN...' },
  { key: 'cost_price', label: 'Cost Price', type: 'number', placeholder: 'Min ₹...' },
  { key: 'price', label: 'Selling Price', type: 'number', placeholder: 'Min ₹...' },
  { key: 'gst_rate', label: 'GST %', type: 'number', placeholder: 'GST %...' },
  { key: 'current_stock', label: 'Current Stock', type: 'number', placeholder: 'Min stock...' },
];

const productColumnDefs: ColumnFilterDef[] = [
  { key: 'sku', filterType: 'text', placeholder: 'Filter SKU...' },
  { key: 'name', filterType: 'text', placeholder: 'Filter name...' },
  {
    key: 'type',
    filterType: 'select',
    options: [
      { label: 'Goods', value: 'goods' },
      { label: 'Service', value: 'service' },
    ],
  },
  { key: 'category', filterType: 'text', placeholder: 'Filter cat...' },
  { key: 'hsn_code', filterType: 'text', placeholder: 'Filter HSN...' },
  { key: 'cost_price', filterType: 'number', placeholder: 'Min cost...' },
  { key: 'price', filterType: 'number', placeholder: 'Min price...' },
  { key: 'gst_rate', filterType: 'number', placeholder: 'GST %...' },
  { key: 'current_stock', filterType: 'number', placeholder: 'Min stock...' },
  { key: 'actions', filterType: 'none' },
];

export const ProductsPage: React.FC = () => {
  const { isAdmin, isManager, isAccountant } = useAuth();
  const isElevated = isAdmin || isManager || isAccountant;
  const { addToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Stock Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState('Physical Stock Count');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustFieldErrors, setAdjustFieldErrors] = useState<Record<string, string>>({});
  const [adjustFormError, setAdjustFormError] = useState<string | null>(null);

  const handleOpenAdjust = (p: any) => {
    setSelectedProduct(p);
    setAdjustmentDelta('');
    setAdjustmentNotes('');
    setAdjustFormError(null);
    setAdjustFieldErrors({});
    setIsAdjustOpen(true);
  };

  // New Product Modal State
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('goods');
  const [newCategorySelect, setNewCategorySelect] = useState<string>('Chairs');
  const [newCustomCategory, setNewCustomCategory] = useState<string>('');
  const [newHsnSelect, setNewHsnSelect] = useState<string>('94018000');
  const [newCustomHsn, setNewCustomHsn] = useState<string>('');
  const [newUnitOfMeasure, setNewUnitOfMeasure] = useState<string>('unit');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newCostPrice, setNewCostPrice] = useState<string>('');
  const [newGstRate, setNewGstRate] = useState<number>(18);
  const [newMinStock, setNewMinStock] = useState<string>('5');
  const [newInitialStock, setNewInitialStock] = useState<string>('0');
  const [newInventoryAccountId, setNewInventoryAccountId] = useState<number | ''>('');
  const [newCogsAccountId, setNewCogsAccountId] = useState<number | ''>('');
  const [newRevenueAccountId, setNewRevenueAccountId] = useState<number | ''>('');
  const [isCreating, setIsCreating] = useState(false);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // Detail Product Modal
  const [detailProduct, setDetailProduct] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, accRes] = await Promise.all([
        productsApi.list(),
        isElevated ? accountsApi.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      const list = Array.isArray(prodRes?.data) ? prodRes.data : Array.isArray(prodRes) ? prodRes : [];
      const normalized = list.filter(Boolean).map((p: any) => {
        const unitPrice = p.unit_price != null ? Number(p.unit_price) : (p.price != null ? Number(p.price) : 0);
        const costPrice = p.cost_price != null ? Number(p.cost_price) : 0;
        const currentStock = p.current_stock != null ? Number(p.current_stock) : 0;
        const minStock = p.min_stock_alert != null ? Number(p.min_stock_alert) : (p.minimum_stock != null ? Number(p.minimum_stock) : 5);
        return {
          ...p,
          price: isNaN(unitPrice) ? 0 : unitPrice,
          unit_price: isNaN(unitPrice) ? 0 : unitPrice,
          cost_price: isNaN(costPrice) ? 0 : costPrice,
          current_stock: isNaN(currentStock) ? 0 : currentStock,
          min_stock_alert: minStock,
          minimum_stock: minStock,
        };
      });
      setProducts(normalized);
      const accList = Array.isArray(accRes?.data) ? accRes.data : Array.isArray(accRes) ? accRes : [];
      setAccounts(accList);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load products and accounts.' });
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

  const handleOpenNewModal = () => {
    setCreateFieldErrors({});
    setCreateFormError(null);
    setNewSku('');
    setNewName('');
    setNewType('goods');
    setNewCategorySelect('Chairs');
    setNewCustomCategory('');
    setNewHsnSelect('94018000');
    setNewCustomHsn('');
    setNewPrice('');
    setNewCostPrice('');
    setNewGstRate(18);
    setNewUnitOfMeasure('unit');
    setNewMinStock('5');
    setNewInitialStock('0');

    // Auto-select standard GL accounts
    const invAcc = accounts.find((a) => a.code === '1130');
    const cogsAcc = accounts.find((a) => a.code === '5100');
    const revAcc = accounts.find((a) => a.code === '4100');
    setNewInventoryAccountId(invAcc?.id || '');
    setNewCogsAccountId(cogsAcc?.id || '');
    setNewRevenueAccountId(revAcc?.id || '');

    setIsNewOpen(true);
  };

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

    const resolvedCategory = newCategorySelect === 'custom' ? newCustomCategory.trim() : newCategorySelect.trim();
    const resolvedHsn = newHsnSelect === 'custom' ? newCustomHsn.trim() : newHsnSelect.trim();

    if (!newSku.trim()) errors.sku = 'SKU Code is required.';
    if (!newName.trim()) errors.name = 'Product name is required.';
    if (!resolvedCategory) errors.category = 'Category is required.';
    if (!resolvedHsn) errors.hsn_code = 'HSN Code is required.';

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
        category: resolvedCategory,
        hsn_code: resolvedHsn,
        unit_of_measure: newUnitOfMeasure,
        price: priceNum,
        unit_price: priceNum,
        cost_price: costNum,
        gst_rate: newGstRate,
        min_stock_alert: minStockNum,
        minimum_stock: minStockNum,
        current_stock: initStockNum,
        inventory_account_id: newInventoryAccountId ? Number(newInventoryAccountId) : null,
        cogs_account_id: newCogsAccountId ? Number(newCogsAccountId) : null,
        revenue_account_id: newRevenueAccountId ? Number(newRevenueAccountId) : null,
      });
      addToast({ type: 'success', title: 'Product Created', message: `${newName.trim()} added to inventory catalog.` });
      setIsNewOpen(false);
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

  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);

  const lowStockItems = Array.isArray(products)
    ? products.filter(
        (p) => p && Number(p?.current_stock ?? 0) <= Number(p?.min_stock_alert ?? p?.minimum_stock ?? 5)
      )
    : [];

  const categories = Array.from(
    new Set(
      (Array.isArray(products) ? products : [])
        .filter((p) => Boolean(p && p.category))
        .map((p) => p.category)
    )
  );

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = productFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key,
          operator: cfg?.type === 'number' ? 'gte' : cfg?.type === 'select' ? 'equals' : 'contains',
          value: val.trim(),
        });
      }
    });
    if (categoryFilter !== 'all') {
      merged.push({
        id: 'quick-category',
        field: 'category',
        operator: 'equals',
        value: categoryFilter,
      });
    }
    return merged;
  }, [activeFilters, columnFilters, categoryFilter]);

  const filteredProducts = React.useMemo(() => {
    return filterItems(
      (Array.isArray(products) ? products : []).filter(Boolean),
      searchQuery,
      ['sku', 'name', 'category', 'hsn_code', 'description'],
      allActiveFilters
    );
  }, [products, searchQuery, allActiveFilters]);

  const {
    visibleItems: visibleProducts,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredProducts,
    pageSize: 15,
    isLoading: loading,
  });

  const activeFilterConfigs = isElevated
    ? productFilterConfigs
    : productFilterConfigs.filter((f) => f.key !== 'cost_price');

  const activeColumnDefs = isElevated
    ? productColumnDefs
    : productColumnDefs.filter((c) => c.key !== 'cost_price');

  return (
    <MasterViewLayout
      title="Product Master"
      subtitle="Urban furniture catalogue, HSN tax classification, and real-time inventory tracking"
      viewMode={viewMode}
      onViewModeChange={(m) => setViewMode(m)}
      onNew={isElevated ? handleOpenNewModal : undefined}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search product SKU, name, category, HSN..."
    >
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

      {/* Field Filter Bar */}
      <FieldFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search product SKU, name, category, HSN..."
        filterConfigs={activeFilterConfigs}
        activeFilters={activeFilters}
        onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
        onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
        onClearAll={() => {
          setSearchQuery('');
          setActiveFilters([]);
          setColumnFilters({});
          setCategoryFilter('all');
        }}
        showColumnFilters={showColumnFilters}
        onToggleColumnFilters={() => setShowColumnFilters((prev) => !prev)}
        presets={{
          field: 'category',
          currentValue: categoryFilter,
          onChange: setCategoryFilter,
          options: [
            { label: 'All Categories', value: 'all' },
            ...categories.slice(0, 6).map((c) => ({ label: c, value: c })),
          ],
        }}
      />

      {viewMode === 'kanban' ? (
        /* KANBAN VIEW (Matching Excalidraw requirement for Product Kanban View) */
        loading && visibleProducts.length === 0 ? (
          <CardGridSkeleton count={8} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        ) : visibleProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={searchQuery ? 'No products match your search query.' : 'Add your first product to view it in the Kanban catalogue.'}
            actionLabel={isElevated ? 'Add New Product SKU' : undefined}
            onAction={isElevated ? handleOpenNewModal : undefined}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleProducts.map((p) => {
                const isLow = Number(p.current_stock ?? 0) <= Number(p.min_stock_alert ?? p.minimum_stock ?? 5);
                return (
                  <div
                    key={p.id}
                    onClick={() => setDetailProduct(p)}
                    className="group relative bg-[#18181f]/80 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/50 rounded-2xl p-5 transition-all duration-300 shadow-obsidian-card hover:shadow-obsidian-glow flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          {p.sku}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.06]">
                          {p.type || 'goods'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#8a8a9a] mt-1 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-[#707080]" />
                        {p.category || 'Furniture'}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400">Price (incl. GST)</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          ₹{Number(p.price || p.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {isElevated && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Cost</span>
                          <span className="font-mono text-neutral-400">
                            ₹{Number(p.cost_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            isLow
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {isLow ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <CheckCircle className="w-3 h-3 text-emerald-400" />}
                          {p.current_stock ?? 0} {p.unit_of_measure || 'units'}
                        </span>

                        {isElevated && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAdjust(p);
                            }}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-600 hover:text-white text-neutral-300 transition-colors"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollSentinel
              sentinelRef={sentinelRef}
              loadingMore={loadingMore}
              hasMore={hasMore}
              totalCount={totalCount}
              visibleCount={visibleProducts.length}
              onLoadMore={loadMore}
              entityName="products"
            />
          </div>
        )
      ) : (
        /* LIST VIEW TABLE */
        <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">HSN Code</th>
                  {isElevated && <th className="py-3 px-4 text-right">Cost (₹)</th>}
                  <th className="py-3 px-4 text-right">Selling Price (₹)</th>
                  <th className="py-3 px-4 text-center">GST %</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
                {showColumnFilters && (
                  <ColumnFilterRow
                    columns={activeColumnDefs}
                    values={columnFilters}
                    onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                  />
                )}
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {loading ? (
                  <TableSkeleton columns={isElevated ? 10 : 9} rows={6} />
                ) : visibleProducts.length === 0 ? (
                  <EmptyState
                    colSpan={isElevated ? 10 : 9}
                    icon={Package}
                    title="No products found"
                    description={searchQuery ? 'No products match your search query.' : 'Add your first product to get started.'}
                    actionLabel={isElevated ? 'Add New Product SKU' : undefined}
                    onAction={isElevated ? handleOpenNewModal : undefined}
                  />
                ) : (
                  visibleProducts.map((prod) => {
                    const isLow = Number(prod.current_stock ?? 0) <= Number(prod.min_stock_alert ?? prod.minimum_stock ?? 5);
                    return (
                      <tr
                        key={prod.id}
                        onClick={() => setDetailProduct(prod)}
                        className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-amber-400 group-hover:underline">
                          {prod.sku}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white group-hover:text-amber-300">
                          {prod.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] text-neutral-300 border border-white/10">
                            {prod.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-300">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            <Tag className="w-3 h-3" />
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-neutral-400">{prod.hsn_code}</td>
                        {isElevated && (
                          <td className="py-3 px-4 text-right font-mono text-neutral-400">
                            ₹{(Number(prod.cost_price) || 0).toLocaleString('en-IN')}
                          </td>
                        )}
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ₹{(Number(prod.price ?? prod.unit_price ?? 0) || 0).toLocaleString('en-IN')}
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
                          {isElevated && (
                            <button
                              onClick={() => {
                                handleOpenAdjust(prod);
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
                {loadingMore && (
                  <TableSkeleton isPaginationLoader rows={3} cols={isElevated ? 10 : 9} />
                )}
              </tbody>
            </table>
          </div>
          <ScrollSentinel
            sentinelRef={sentinelRef}
            loadingMore={loadingMore}
            hasMore={hasMore}
            totalCount={totalCount}
            visibleCount={visibleProducts.length}
            onLoadMore={loadMore}
            entityName="products"
          />
        </Card>
      )}

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
        containerClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Add Product SKU</h3>
                <p className="text-xs text-neutral-400">
                  Item classification, GST taxation, margin calculation, and GL accounting.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            {createFormError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{createFormError}</span>
              </div>
            )}

            {/* Row 1: SKU, Type, UOM */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  SKU Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => {
                    setNewSku(e.target.value.toUpperCase());
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
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white capitalize focus:outline-none focus:border-amber-500"
                >
                  <option value="goods">Goods (Stock Item)</option>
                  <option value="service">Service</option>
                  <option value="combo">Combo Bundle</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Unit of Measure</label>
                <select
                  value={newUnitOfMeasure}
                  onChange={(e) => setNewUnitOfMeasure(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {UNITS_OF_MEASURE.map((uom) => (
                    <option key={uom.value} value={uom.value}>
                      {uom.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Product Name */}
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
                placeholder="e.g. Executive High-Back Mesh Ergonomic Office Chair"
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

            {/* Row 3: Category & HSN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Furniture Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newCategorySelect}
                  onChange={(e) => setNewCategorySelect(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {Array.from(new Set([...FURNITURE_CATEGORIES, ...categories])).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Create Category on-the-fly...</option>
                </select>
                {newCategorySelect === '__custom__' && (
                  <input
                    type="text"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    placeholder="Enter custom category name"
                    className="mt-1.5 w-full px-3 py-1.5 bg-[#1a1a22] border border-amber-500/50 rounded-lg text-xs text-white focus:outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  HSN / GST Code <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newHsnSelect}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewHsnSelect(val);
                    const matched = FURNITURE_HSN_CODES.find((h) => h.code === val);
                    if (matched) {
                      setNewGstRate(matched.gstRate);
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {FURNITURE_HSN_CODES.map((hsn) => (
                    <option key={hsn.code} value={hsn.code}>
                      {hsn.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Custom HSN Code...</option>
                </select>
                {newHsnSelect === '__custom__' && (
                  <input
                    type="text"
                    value={newCustomHsn}
                    onChange={(e) => setNewCustomHsn(e.target.value)}
                    placeholder="Enter 4-8 digit HSN code"
                    className="mt-1.5 w-full px-3 py-1.5 bg-[#1a1a22] border border-amber-500/50 rounded-lg text-xs text-white font-mono focus:outline-none"
                    required
                  />
                )}
              </div>
            </div>

            {/* Row 4: Pricing & Tax Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">GST Rate %</label>
                <select
                  value={newGstRate}
                  onChange={(e) => setNewGstRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="18">18% (Standard Furniture)</option>
                  <option value="12">12% (Concessional)</option>
                  <option value="28">28% (Luxury / Metal)</option>
                  <option value="5">5% (Raw Materials)</option>
                  <option value="0">0% (Nil / Exempt)</option>
                </select>
              </div>
            </div>

            {/* Live Profit & Margin Indicator */}
            {(() => {
              const cost = parseFloat(newCostPrice) || 0;
              const price = parseFloat(newPrice) || 0;
              if (cost <= 0 && price <= 0) return null;
              const profit = price - cost;
              const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0.0';
              const isProfitable = profit >= 0;

              return (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isProfitable
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isProfitable ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-medium">
                      {isProfitable ? 'Unit Margin:' : 'Warning: Below Cost!'}
                    </span>
                    <span className="font-mono font-bold">
                      {profit >= 0 ? `+₹${profit.toFixed(2)}` : `-₹${Math.abs(profit).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-neutral-400 text-[11px]">Markup:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        isProfitable
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {margin}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Row 5: Stock Quantities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Initial Stock on Hand</label>
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
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Min Stock Alert Threshold</label>
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

            {/* General Ledger Account Mapping */}
            <div className="p-3.5 bg-[#17171e] border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-neutral-200">General Ledger Account Routing</span>
                <span className="text-[10px] text-neutral-500 ml-auto">Automated Double-Entry</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Inventory Asset (1130)
                  </label>
                  <select
                    value={newInventoryAccountId}
                    onChange={(e) => setNewInventoryAccountId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="">Default (1130 Merchandise)</option>
                    {accounts
                      .filter((a) => a.type === 'asset')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    COGS Expense (5100)
                  </label>
                  <select
                    value={newCogsAccountId}
                    onChange={(e) => setNewCogsAccountId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="">Default (5100 COGS)</option>
                    {accounts
                      .filter((a) => a.type === 'expense')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Sales Revenue (4100)
                  </label>
                  <select
                    value={newRevenueAccountId}
                    onChange={(e) => setNewRevenueAccountId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2.5 py-1.5 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="">Default (4100 Sales)</option>
                    {accounts
                      .filter((a) => a.type === 'revenue')
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
                onClick={() => setIsNewOpen(false)}
                className="border-neutral-700 bg-neutral-800 text-neutral-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/20"
              >
                {isCreating ? 'Creating Product...' : 'Save Product SKU'}
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
                  <div className="text-[10px] text-neutral-500">Threshold: {detailProduct?.min_stock_alert ?? detailProduct?.minimum_stock ?? 5} units</div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Selling Price</div>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                    ₹{(Number(detailProduct?.price ?? detailProduct?.unit_price ?? 0) || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-neutral-500">GST Rate: {detailProduct?.gst_rate || 18}%</div>
                </div>

                {isElevated ? (
                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                    <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Inventory Valuation</div>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                      ₹{((Number(detailProduct?.current_stock || 0) || 0) * (Number(detailProduct?.cost_price || 0) || 0)).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-neutral-500">Unit Cost: ₹{(Number(detailProduct?.cost_price || 0) || 0).toLocaleString('en-IN')}</div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                    <div className="text-[10.5px] uppercase font-semibold text-neutral-400">Unit of Measure</div>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5 capitalize">
                      {detailProduct?.unit_of_measure || 'Unit'}
                    </div>
                    <div className="text-[10px] text-neutral-500">Classification: {detailProduct?.category || 'Furniture'}</div>
                  </div>
                )}
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
                  {isElevated ? (
                    <div>
                      <span className="text-neutral-500">Gross Margin:</span>{' '}
                      <span className="font-mono font-bold text-emerald-400">
                        {(() => {
                          const sp = Number(detailProduct?.price ?? detailProduct?.unit_price ?? 0);
                          const cp = Number(detailProduct?.cost_price ?? 0);
                          return sp > 0 && cp > 0
                            ? `${Math.round(((sp - cp) / sp) * 100)}%`
                            : 'N/A';
                        })()}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-neutral-500">Category:</span>{' '}
                      <span className="font-semibold text-neutral-200">{detailProduct?.category || 'General'}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-neutral-500">Status:</span>{' '}
                    <span
                      className={`font-semibold ${
                        Number(detailProduct?.current_stock || 0) <= Number(detailProduct?.min_stock_alert ?? detailProduct?.minimum_stock ?? 5)
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {Number(detailProduct?.current_stock || 0) <= Number(detailProduct?.min_stock_alert ?? detailProduct?.minimum_stock ?? 5)
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
    </MasterViewLayout>
  );
};

