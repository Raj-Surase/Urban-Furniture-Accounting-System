import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Sparkles,
  Box,
  Sliders,
  Tag,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { purchaseOrdersApi, vendorsApi, productsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RolePortalBanner } from '../components/common/RolePortalBanner';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { FieldFilterBar } from '../components/common/FieldFilterBar';
import { ColumnFilterRow, ColumnFilterDef } from '../components/common/ColumnFilterRow';
import { ScrollSentinel } from '../components/common/ScrollSentinel';
import { useScrollPagination } from '../hooks/useScrollPagination';
import { FieldFilterConfig, ActiveFieldFilter, filterItems } from '../lib/filterUtils';
import { PAYMENT_TERMS_OPTIONS, calculateDueDate } from '../constants/formOptions';
import { PurchaseOrderStatus } from '../types';

export interface CustomizationDetails {
  is_custom?: boolean;
  model?: string;
  template_id?: string;
  category?: string;
  wood?: string;
  wood_species?: string;
  wood_color?: string;
  wood_grain?: string;
  upholstery?: string;
  upholstery_material?: string;
  dimensions?: {
    width?: number;
    depth?: number;
    height?: number;
    unit?: string;
  } | string;
  raw_cost?: number;
  estimated_price?: number;
  tags?: string[];
}

export const isCustomOrder = (po: any): boolean => {
  if (po.is_custom === true || po.is_custom === 1 || po.is_custom === '1') return true;
  if (po.customization_details && Object.keys(po.customization_details).length > 0) return true;
  if (typeof po.notes === 'string' && po.notes.includes('[3D Workshop Custom Order]')) return true;
  return false;
};

export const getCustomDetails = (po: any): CustomizationDetails | null => {
  if (po.customization_details && typeof po.customization_details === 'object') {
    return po.customization_details;
  }
  if (typeof po.notes === 'string' && po.notes.includes('[3D Workshop Custom Order]')) {
    const modelMatch = po.notes.match(/Model:\s*([^|]+)/i);
    const woodMatch = po.notes.match(/Wood(?:\s*Finish)?:\s*([^|]+)/i);
    const uphMatch = po.notes.match(/Upholstery:\s*([^|]+)/i);
    const dimMatch = po.notes.match(/Dimensions:\s*([^|]+)/i);
    return {
      is_custom: true,
      model: modelMatch ? modelMatch[1].trim() : undefined,
      wood: woodMatch ? woodMatch[1].trim() : undefined,
      upholstery: uphMatch ? uphMatch[1].trim() : undefined,
      dimensions: dimMatch ? dimMatch[1].trim() : undefined,
    };
  }
  return null;
};

const poFilterConfigs: FieldFilterConfig[] = [
  { key: 'po_number', label: 'PO Number', type: 'text', placeholder: 'e.g. PO-2026' },
  { key: 'vendor.name', label: 'Vendor Name', type: 'text', placeholder: 'Vendor...' },
  { key: 'vendor.gstin', label: 'Vendor GSTIN', type: 'text', placeholder: 'GSTIN...' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Draft', value: PurchaseOrderStatus.DRAFT },
      { label: 'Submitted', value: PurchaseOrderStatus.SUBMITTED },
      { label: 'Approved', value: PurchaseOrderStatus.APPROVED },
      { label: 'Received', value: PurchaseOrderStatus.RECEIVED },
      { label: 'Cancelled', value: PurchaseOrderStatus.CANCELLED },
    ],
  },
  {
    key: 'is_custom',
    label: 'Order Type',
    type: 'select',
    options: [
      { label: '✨ 3D Custom Orders Only', value: '1' },
      { label: 'Standard Procurement Only', value: '0' },
    ],
  },
  {
    key: 'custom_wood',
    label: 'Custom Timber Finish',
    type: 'select',
    options: [
      { label: 'Burmese Teak', value: 'Teak' },
      { label: 'English White Oak', value: 'Oak' },
      { label: 'American Walnut', value: 'Walnut' },
      { label: 'Indian Rosewood', value: 'Rosewood' },
      { label: 'Matte Carbon Ash', value: 'Ash' },
    ],
  },
  { key: 'order_date', label: 'Order Date', type: 'date' },
  { key: 'expected_delivery_date', label: 'Expected Date', type: 'date' },
  { key: 'subtotal', label: 'Taxable Amount', type: 'number', placeholder: 'Min ₹...' },
  { key: 'tax_amount', label: 'GST Amount', type: 'number', placeholder: 'Min ₹...' },
  { key: 'total_amount', label: 'Total Amount', type: 'number', placeholder: 'Min ₹...' },
];

const poColumnDefs: ColumnFilterDef[] = [
  { key: 'po_number', filterType: 'text', placeholder: 'Filter PO #...' },
  { key: 'vendor.name', filterType: 'text', placeholder: 'Filter vendor...' },
  { key: 'order_date', filterType: 'date' },
  { key: 'subtotal', filterType: 'number', placeholder: 'Min...' },
  { key: 'tax_amount', filterType: 'number', placeholder: 'Min...' },
  { key: 'total_amount', filterType: 'number', placeholder: 'Min...' },
  {
    key: 'status',
    filterType: 'select',
    options: [
      { label: 'Draft', value: PurchaseOrderStatus.DRAFT },
      { label: 'Submitted', value: PurchaseOrderStatus.SUBMITTED },
      { label: 'Approved', value: PurchaseOrderStatus.APPROVED },
      { label: 'Received', value: PurchaseOrderStatus.RECEIVED },
      { label: 'Cancelled', value: PurchaseOrderStatus.CANCELLED },
    ],
  },
  { key: 'actions', filterType: 'none' },
];

export const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lastProcessedParamsRef = useRef<string | null>(null);
  const { user, isAdmin, isManager, isAccountant } = useAuth();
  const isElevated = isAdmin || isManager || isAccountant;
  const { addToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCustomCreate, setIsCustomCreate] = useState(false);
  const [customSpecs, setCustomSpecs] = useState<CustomizationDetails | null>(null);
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(15);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Urban Furniture Purchase Order. Procurement of wooden furniture & raw timber from vendor.');
  const [items, setItems] = useState<
    Array<{ product_id: number | ''; quantity: number; unit_price: number; gst_rate: number; description?: string }>
  >([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick filters for Custom 3D Orders & Woods
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'custom' | 'standard'>('all');
  const [selectedWoodFilter, setSelectedWoodFilter] = useState<string>('all');

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

  const auxLoadedRef = useRef(false);
  const [loadingAux, setLoadingAux] = useState(false);

  const ensureAuxiliaryData = useCallback(async () => {
    if (auxLoadedRef.current) return;
    setLoadingAux(true);
    try {
      const [vendRes, prodRes] = await Promise.all([
        vendorsApi.list({ per_page: 'all' }).catch(() => ({ data: [] })),
        productsApi.list({ per_page: 'all' }).catch(() => ({ data: [] })),
      ]);
      setVendors(vendRes.data || vendRes || []);
      setProducts(prodRes.data || prodRes || []);
      auxLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load PO auxiliary data:', err);
    } finally {
      setLoadingAux(false);
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const orderRes = await purchaseOrdersApi.list();
      setOrders(orderRes.data || orderRes || []);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load purchase orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleRoleUpdated = () => {
      fetchOrders();
      if (auxLoadedRef.current) {
        auxLoadedRef.current = false;
        ensureAuxiliaryData();
      }
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, [ensureAuxiliaryData]);

  const handleVendorSelect = (id: number | '') => {
    setVendorId(id);
    if (id) {
      const v = vendors.find((vend) => vend.id === id);
      const terms = v?.payment_terms_days ?? 15;
      setPaymentTermsDays(terms);
      setExpectedDate(calculateDueDate(orderDate, terms));
    }
  };

  const clearCustomUrlParams = useCallback(() => {
    if (
      searchParams.get('new') ||
      searchParams.get('is_custom') ||
      searchParams.get('custom') ||
      searchParams.get('model')
    ) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('new');
          next.delete('is_custom');
          next.delete('custom');
          next.delete('model');
          next.delete('model_id');
          next.delete('category');
          next.delete('wood');
          next.delete('wood_species');
          next.delete('wood_color');
          next.delete('wood_grain');
          next.delete('upholstery');
          next.delete('upholstery_material');
          next.delete('dimensions');
          next.delete('width');
          next.delete('depth');
          next.delete('height');
          next.delete('raw_cost');
          next.delete('price');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateOpen(false);
    setIsCustomCreate(false);
    setCustomSpecs(null);
    clearCustomUrlParams();
  }, [clearCustomUrlParams]);

  const handleOpenCreateModal = () => {
    ensureAuxiliaryData();
    setIsCustomCreate(false);
    setCustomSpecs(null);
    setNotes('Urban Furniture Purchase Order. Procurement of wooden furniture & raw timber from vendor.');
    setItems([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
    if (!isElevated && vendors.length > 0) {
      const matched = (user?.vendor_id && vendors.find((v) => v.id === user.vendor_id)) || vendors[0];
      if (matched) {
        handleVendorSelect(matched.id);
      } else {
        setVendorId('');
      }
    } else {
      setVendorId('');
    }
    clearCustomUrlParams();
    setIsCreateOpen(true);
  };

  // Auto-open create modal when ?new=true (e.g., from Dashboard quick-action or 3D timber procurement)
  useEffect(() => {
    if (searchParams.get('new') !== 'true') {
      lastProcessedParamsRef.current = null;
      return;
    }

    // Wait until initial catalog data finishes loading to match products and vendors
    ensureAuxiliaryData();
    if (loading) {
      return;
    }

    const currentParamKey = searchParams.toString();
    if (lastProcessedParamsRef.current === currentParamKey) {
      return;
    }
    lastProcessedParamsRef.current = currentParamKey;

    const isCustomParam =
      searchParams.get('is_custom') === 'true' ||
      searchParams.get('custom') === 'true' ||
      !!searchParams.get('wood') ||
      !!searchParams.get('model');

    if (!isElevated && vendors.length > 0) {
      const matched = (user?.vendor_id && vendors.find((v) => v.id === user.vendor_id)) || vendors[0];
      if (matched) {
        handleVendorSelect(matched.id);
      } else {
        setVendorId('');
      }
    } else if (isElevated) {
      const timberVendor = vendors.find(
        (v) =>
          v.name?.toLowerCase().includes('azure') ||
          v.name?.toLowerCase().includes('wood') ||
          v.name?.toLowerCase().includes('timber')
      );
      if (isCustomParam && timberVendor) {
        handleVendorSelect(timberVendor.id);
      } else {
        setVendorId('');
      }
    }

    if (isCustomParam) {
      const model = searchParams.get('model') || 'Executive Teak Desk';
      const category = searchParams.get('category') || 'Tables & Desks';
      const wood = searchParams.get('wood') || 'Burmese Teak';
      const woodSpecies = searchParams.get('wood_species') || '';
      const woodColor = searchParams.get('wood_color') || '#9c6634';
      const woodGrain = searchParams.get('wood_grain') || '';
      const upholstery = searchParams.get('upholstery') || '';
      const upholsteryMaterial = searchParams.get('upholstery_material') || '';
      const width = searchParams.get('width') || '180';
      const depth = searchParams.get('depth') || '85';
      const height = searchParams.get('height') || '76';
      const dimensions = searchParams.get('dimensions') || `${width}x${depth}x${height}cm`;
      const rawCost = Number(searchParams.get('raw_cost')) || 24000;
      const retailPrice = Number(searchParams.get('price')) || 42000;

      const specs: CustomizationDetails = {
        is_custom: true,
        model,
        category,
        wood,
        wood_species: woodSpecies,
        wood_color: woodColor,
        wood_grain: woodGrain,
        upholstery,
        upholstery_material: upholsteryMaterial,
        dimensions: {
          width: Number(width),
          depth: Number(depth),
          height: Number(height),
          unit: 'cm',
        },
        raw_cost: rawCost,
        estimated_price: retailPrice,
        tags: [
          '3D Studio',
          model,
          wood,
          `${width}x${depth}x${height}cm`,
          ...(upholstery ? [upholstery] : []),
        ],
      };

      setIsCustomCreate(true);
      setCustomSpecs(specs);

      setNotes(
        `[3D Workshop Custom Order] Model: ${model} (${category}) | Wood Finish: ${wood}${woodSpecies ? ` (${woodSpecies})` : ''} | ${upholstery ? `Upholstery: ${upholstery} | ` : ''}Dimensions: ${width}W x ${depth}D x ${height}H cm | Est. Raw Timber/Material Cost: ₹${rawCost.toLocaleString('en-IN')}`
      );

      const matchingProduct =
        products.find(
          (p) =>
            p.name.toLowerCase().includes(wood.toLowerCase()) ||
            p.name.toLowerCase().includes('wood') ||
            p.name.toLowerCase().includes('table') ||
            p.name.toLowerCase().includes('desk')
        ) || products[0];

      setItems([
        {
          product_id: matchingProduct ? matchingProduct.id : '',
          quantity: 1,
          unit_price: rawCost,
          gst_rate: 18,
          description: `${wood} Raw Timber & Joinery Components for bespoke ${model} (${dimensions}) - 3D Studio Custom Engineering`,
        },
      ]);
    } else {
      setIsCustomCreate(false);
      setCustomSpecs(null);
      setNotes('Urban Furniture Purchase Order. Procurement of wooden furniture & raw timber from vendor.');
      setItems([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
    }

    setIsCreateOpen(true);
  }, [searchParams, loading, isElevated, vendors, products, user?.vendor_id]);

  const handleProductChange = (index: number, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...items];
    const price = Number(prod.price ?? prod.unit_price ?? 0);
    const cost = Number(prod.cost_price ?? 0);
    updated[index] = {
      ...updated[index],
      product_id: prod.id,
      unit_price: cost || price * 0.7,
      gst_rate: Number(prod.gst_rate || 18),
    };
    setItems(updated);
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
        is_custom: isCustomCreate,
        customization_details: isCustomCreate ? customSpecs : null,
        items: valid.map((it) => ({
          ...it,
          description: it.description || undefined,
          quantity_ordered: it.quantity,
          tax_rate: it.gst_rate,
        })),
      });
      addToast({ type: 'success', title: 'PO Created', message: 'Draft purchase order created.' });
      handleCloseCreateModal();
      setItems([{ product_id: '', quantity: 1, unit_price: 0, gst_rate: 18 }]);
      fetchOrders();
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
      fetchOrders();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await purchaseOrdersApi.approve(id);
      addToast({ type: 'success', title: 'PO Approved', message: 'Purchase order approved by manager.' });
      fetchOrders();
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
      fetchOrders();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Receive Failed', message: err.response?.data?.message || 'Error' });
    } finally {
      setIsReceiving(false);
    }
  };

  const [activeFilters, setActiveFilters] = useState<ActiveFieldFilter[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);

  const allActiveFilters = React.useMemo(() => {
    const merged = [...activeFilters];
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val.trim()) {
        const cfg = poFilterConfigs.find((c) => c.key === key);
        merged.push({
          id: `col-${key}`,
          field: key,
          operator: cfg?.type === 'number' || cfg?.type === 'date' ? 'gte' : cfg?.type === 'select' ? 'equals' : 'contains',
          value: val.trim(),
        });
      }
    });
    return merged;
  }, [activeFilters, columnFilters]);

  const customOrdersCount = React.useMemo(() => orders.filter((po) => isCustomOrder(po)).length, [orders]);
  const standardOrdersCount = orders.length - customOrdersCount;

  const filteredOrders = React.useMemo(() => {
    let result = orders.map((po) => ({
      ...po,
      po_number: po.po_number || po.order_number || '',
    }));

    if (statusFilter !== 'all') {
      result = result.filter((po) => po.status === statusFilter);
    }

    if (orderTypeFilter === 'custom') {
      result = result.filter((po) => isCustomOrder(po));
    } else if (orderTypeFilter === 'standard') {
      result = result.filter((po) => !isCustomOrder(po));
    }

    if (selectedWoodFilter !== 'all') {
      result = result.filter((po) => {
        const details = getCustomDetails(po);
        const woodName = details?.wood || '';
        const notesStr = po.notes || '';
        return (
          woodName.toLowerCase().includes(selectedWoodFilter.toLowerCase()) ||
          notesStr.toLowerCase().includes(selectedWoodFilter.toLowerCase())
        );
      });
    }

    return filterItems(result, searchQuery, ['po_number', 'vendor.name', 'vendor.gstin', 'notes'], allActiveFilters);
  }, [orders, statusFilter, orderTypeFilter, selectedWoodFilter, searchQuery, allActiveFilters]);

  const {
    visibleItems: visibleOrders,
    loadingMore,
    hasMore,
    totalCount,
    sentinelRef,
    loadMore,
  } = useScrollPagination({
    items: filteredOrders,
    pageSize: 15,
    isLoading: loading,
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
      <RolePortalBanner entityName="Purchase Orders" />

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
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* Main Table */}
      <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
        <FieldFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search PO #, vendor, GSTIN, notes..."
          filterConfigs={poFilterConfigs}
          activeFilters={activeFilters}
          onAddFilter={(filter) => setActiveFilters((prev) => [...prev, filter])}
          onRemoveFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
          onClearAll={() => {
            setSearchQuery('');
            setActiveFilters([]);
            setColumnFilters({});
            setStatusFilter('all');
          }}
          showColumnFilters={showColumnFilters}
          onToggleColumnFilters={() => setShowColumnFilters((prev) => !prev)}
          presets={{
            field: 'status',
            currentValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All', value: 'all' },
              { label: 'Draft', value: PurchaseOrderStatus.DRAFT },
              { label: 'Submitted', value: PurchaseOrderStatus.SUBMITTED },
              { label: 'Approved', value: PurchaseOrderStatus.APPROVED },
              { label: 'Received', value: PurchaseOrderStatus.RECEIVED },
            ],
          }}
        />

        {/* Quick Order Classification & 3D Custom Filter Bar */}
        <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.015] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Order View:
            </span>
            <button
              onClick={() => {
                setOrderTypeFilter('all');
                setSelectedWoodFilter('all');
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                orderTypeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.1]'
              }`}
            >
              <span>All Procurement</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/30 text-neutral-300 min-w-[1.25rem] text-center inline-flex items-center justify-center">
                {loading ? <span className="inline-block w-3.5 h-2.5 bg-white/20 animate-pulse rounded" /> : orders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setOrderTypeFilter('custom');
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                orderTypeFilter === 'custom'
                  ? 'bg-gradient-to-r from-amber-500/25 to-purple-500/25 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-white/[0.04] text-neutral-400 hover:text-amber-300 border-white/[0.06] hover:border-amber-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>✨ 3D Studio Custom Orders</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 min-w-[1.25rem] text-center inline-flex items-center justify-center">
                {loading ? <span className="inline-block w-3.5 h-2.5 bg-amber-300/30 animate-pulse rounded" /> : customOrdersCount}
              </span>
            </button>

            <button
              onClick={() => {
                setOrderTypeFilter('standard');
                setSelectedWoodFilter('all');
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                orderTypeFilter === 'standard'
                  ? 'bg-white/[0.15] text-white'
                  : 'bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.1]'
              }`}
            >
              <span>Standard Procurement</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/30 text-neutral-300 min-w-[1.25rem] text-center inline-flex items-center justify-center">
                {loading ? <span className="inline-block w-3.5 h-2.5 bg-white/20 animate-pulse rounded" /> : standardOrdersCount}
              </span>
            </button>
          </div>

          {/* Quick Timber Filters (visible when custom orders are active or filtering) */}
          {(orderTypeFilter === 'custom' || selectedWoodFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Timber Finish:
              </span>
              {[
                { label: 'All Woods', value: 'all' },
                { label: 'Teak', value: 'Teak' },
                { label: 'Oak', value: 'Oak' },
                { label: 'Walnut', value: 'Walnut' },
                { label: 'Rosewood', value: 'Rosewood' },
                { label: 'Ash', value: 'Ash' },
              ].map((wood) => (
                <button
                  key={wood.value}
                  onClick={() => setSelectedWoodFilter(wood.value)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    selectedWoodFilter === wood.value
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'bg-white/[0.04] text-neutral-400 hover:text-amber-200 hover:bg-white/[0.08]'
                  }`}
                >
                  {wood.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">GST (₹)</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
              {showColumnFilters && (
                <ColumnFilterRow
                  columns={poColumnDefs}
                  values={columnFilters}
                  onChange={(key, val) => setColumnFilters((prev) => ({ ...prev, [key]: val }))}
                />
              )}
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <TableSkeleton rows={6} cols={8} />
              ) : visibleOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  colSpan={8}
                  title="No matching purchase orders"
                  description="Try adjusting your filters or search query, or create a new purchase order."
                  actionLabel="New Purchase Order"
                  onAction={handleOpenCreateModal}
                  secondaryActionLabel={searchQuery || statusFilter !== 'all' || activeFilters.length > 0 ? 'Clear Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setOrderTypeFilter('all');
                    setSelectedWoodFilter('all');
                    setActiveFilters([]);
                    setColumnFilters({});
                  }}
                />
              ) : (
                visibleOrders.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => handleOpenDetail(po)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {po.po_number || po.order_number}
                        </span>
                        {isCustomOrder(po) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            3D Custom
                          </span>
                        )}
                      </div>
                      {/* Customization tags preview */}
                      {isCustomOrder(po) && (() => {
                        const details = getCustomDetails(po);
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {details?.model && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] text-[#c084fc] text-[10px] font-medium border border-white/[0.08]">
                                <Box className="w-2.5 h-2.5" />
                                {details.model}
                              </span>
                            )}
                            {details?.wood && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-medium border border-amber-500/20">
                                🪵 {details.wood.split(' ')[0]}
                              </span>
                            )}
                            {details?.dimensions && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/20">
                                📐 {typeof details.dimensions === 'object'
                                  ? `${details.dimensions.width}×${details.dimensions.depth}cm`
                                  : String(details.dimensions).replace(/cm/i, '')}
                              </span>
                            )}
                            {details?.upholstery && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-medium border border-purple-500/20">
                                💺 {details.upholstery.split(' ').slice(0, 2).join(' ')}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-200">{po.vendor?.name}</div>
                      <div className="text-[10.5px] text-neutral-500 font-mono">
                        {po.vendor?.gstin || 'Unregistered'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div>Order: {po.order_date ? po.order_date.split('T')[0] : 'N/A'}</div>
                      <div className="text-[10.5px] text-neutral-500">Exp: {po.expected_delivery_date ? po.expected_delivery_date.split('T')[0] : 'N/A'}</div>
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
                          po.status === PurchaseOrderStatus.RECEIVED
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : po.status === PurchaseOrderStatus.APPROVED
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : po.status === PurchaseOrderStatus.SUBMITTED
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status === PurchaseOrderStatus.DRAFT && (
                          <button
                            onClick={() => handleSubmit(po.id)}
                            className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Submit for Approval"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Submit
                          </button>
                        )}
                        {po.status === PurchaseOrderStatus.SUBMITTED && (isAdmin || isManager) && (
                          <button
                            onClick={() => handleApprove(po.id)}
                            className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Approve Order"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        {po.status === PurchaseOrderStatus.APPROVED && (
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
                            {po.status !== PurchaseOrderStatus.RECEIVED && (
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
                ))
              )}
              {loadingMore && (
                <TableSkeleton isPaginationLoader rows={3} cols={8} />
              )}
            </tbody>
          </table>
        </div>
        <ScrollSentinel
          sentinelRef={sentinelRef}
          loadingMore={loadingMore}
          hasMore={hasMore}
          totalCount={totalCount}
          visibleCount={visibleOrders.length}
          onLoadMore={loadMore}
          entityName="purchase orders"
        />
      </Card>

      {/* Create PO Modal */}
      <PortalModal
        isOpen={isCreateOpen}
        onClose={handleCloseCreateModal}
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
              onClick={handleCloseCreateModal}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* 3D Workshop Custom Order Specifications Card */}
            {isCustomCreate && customSpecs && (
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-[#181824] to-purple-500/10 border border-amber-500/30 rounded-2xl space-y-3 shadow-lg shadow-amber-500/5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>3D Workshop Studio • Bespoke Custom Configuration</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Custom PO
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Joinery dimensions, wood finish and raw material requirements passed from 3D studio
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams({
                        model: customSpecs.model || '',
                        wood: customSpecs.wood || '',
                        upholstery: customSpecs.upholstery || '',
                        width: typeof customSpecs.dimensions === 'object' ? String(customSpecs.dimensions.width || '') : '',
                        depth: typeof customSpecs.dimensions === 'object' ? String(customSpecs.dimensions.depth || '') : '',
                        height: typeof customSpecs.dimensions === 'object' ? String(customSpecs.dimensions.height || '') : '',
                      });
                      navigate(`/workshop?${params.toString()}`);
                    }}
                    className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Review in 3D Studio
                  </button>
                </div>

                {/* Custom Specs Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Model</span>
                    <span className="font-bold text-white truncate block mt-0.5">{customSpecs.model}</span>
                    <span className="text-[10px] text-[#c084fc]">{customSpecs.category || 'Custom Design'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Timber Finish</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {customSpecs.wood_color && (
                        <div
                          className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                          style={{ backgroundColor: customSpecs.wood_color }}
                        />
                      )}
                      <span className="font-bold text-amber-300 truncate">{customSpecs.wood}</span>
                    </div>
                    {customSpecs.wood_species && (
                      <span className="text-[10px] text-neutral-500 italic truncate block">{customSpecs.wood_species}</span>
                    )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Dimensions</span>
                    <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                      {typeof customSpecs.dimensions === 'object'
                        ? `${customSpecs.dimensions.width}W × ${customSpecs.dimensions.depth}D × ${customSpecs.dimensions.height}H cm`
                        : customSpecs.dimensions}
                    </span>
                    <span className="text-[10px] text-neutral-500">Bespoke Joinery</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Target Raw COGS</span>
                    <span className="font-mono font-bold text-indigo-300 block mt-0.5">
                      ₹{Number(customSpecs.raw_cost || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-neutral-500">Calculated in 3D</span>
                  </div>
                </div>

                {/* Custom Tags */}
                {customSpecs.tags && customSpecs.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1 mr-1">
                      <Tag className="w-3 h-3 text-amber-400" />
                      Tags:
                    </span>
                    {customSpecs.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.05] text-neutral-300 border border-white/[0.08]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

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

              {!isElevated ? (
                <div className="p-3 bg-white/[0.02] border border-indigo-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {selectedVendor?.name?.charAt(0) || user?.name?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {selectedVendor?.name || user?.vendor_name || user?.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        {selectedVendor?.company_name || 'Supplier Account'} • {selectedVendor?.state || 'Maharashtra'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Active Vendor Partner
                  </span>
                </div>
              ) : (
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
              )}

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

                      {(it.description !== undefined || isCustomCreate) && (
                        <div className="pt-1">
                          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-0.5">
                            Custom Line Description & Bespoke Specifications
                          </label>
                          <input
                            type="text"
                            value={it.description || ''}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].description = e.target.value;
                              setItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-[#141418] border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g. Burmese Teak Raw Timber for Executive Teak Desk (180x85x76cm)..."
                          />
                        </div>
                      )}

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
                onClick={handleCloseCreateModal}
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
                      detailOrder.status === PurchaseOrderStatus.RECEIVED
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : detailOrder.status === PurchaseOrderStatus.APPROVED
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : detailOrder.status === PurchaseOrderStatus.SUBMITTED
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

            {/* 3D Workshop Custom Order Specifications Panel */}
            {isCustomOrder(detailOrder) && (() => {
              const details = getCustomDetails(detailOrder);
              const dims = details?.dimensions;
              const dimText =
                typeof dims === 'object' && dims
                  ? `${dims.width || ''}W × ${dims.depth || ''}D × ${dims.height || ''}H cm`
                  : dims || 'Standard Bespoke Dimensions';

              return (
                <div className="p-4 bg-gradient-to-br from-amber-500/10 via-[#181822] to-purple-500/10 border border-amber-500/30 rounded-2xl space-y-3.5 shadow-lg shadow-amber-500/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white tracking-wide">
                            3D Workshop Studio • Bespoke Engineering Specifications
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Custom Fabrication
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Interactive 3D configurator joinery specs, wood grain finish & upholstery accents
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams({
                          model: details?.model || '',
                          wood: details?.wood || '',
                          upholstery: details?.upholstery || '',
                          width: typeof dims === 'object' && dims?.width ? String(dims.width) : '',
                          depth: typeof dims === 'object' && dims?.depth ? String(dims.depth) : '',
                          height: typeof dims === 'object' && dims?.height ? String(dims.height) : '',
                        });
                        navigate(`/workshop?${params.toString()}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open in 3D Workshop</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                    </button>
                  </div>

                  {/* Specification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Model */}
                    <div className="p-3 bg-black/30 border border-white/[0.05] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Furniture Model</span>
                      <span className="font-bold text-white block">{details?.model || 'Custom Furniture'}</span>
                      <span className="text-[10px] text-[#c084fc] font-medium block">
                        {details?.category || 'Architectural Joinery'}
                      </span>
                    </div>

                    {/* Timber */}
                    <div className="p-3 bg-black/30 border border-white/[0.05] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Timber Species & Finish</span>
                      <div className="flex items-center gap-1.5">
                        {details?.wood_color && (
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-inner"
                            style={{ backgroundColor: details.wood_color }}
                          />
                        )}
                        <span className="font-bold text-amber-300">{details?.wood || 'Hardwood Timber'}</span>
                      </div>
                      {details?.wood_species && (
                        <span className="text-[10px] text-neutral-400 italic block">{details.wood_species}</span>
                      )}
                    </div>

                    {/* Dimensions */}
                    <div className="p-3 bg-black/30 border border-white/[0.05] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Engineered Dimensions</span>
                      <span className="font-mono font-bold text-emerald-400 block">{dimText}</span>
                      <span className="text-[10px] text-neutral-400 block">Precision Mortise & Tenon</span>
                    </div>
                  </div>

                  {/* Upholstery row if present */}
                  {details?.upholstery && (
                    <div className="p-2.5 bg-black/20 border border-white/[0.04] rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-neutral-400">Accent Upholstery:</span>
                        <strong className="text-purple-300">{details.upholstery}</strong>
                        {details.upholstery_material && (
                          <span className="text-neutral-500 text-[11px]">({details.upholstery_material})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {((detailOrder.custom_tags && detailOrder.custom_tags.length > 0) || (details?.tags && details.tags.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1 mr-1">
                        <Tag className="w-3 h-3 text-amber-400" />
                        Customization Tags:
                      </span>
                      {(detailOrder.custom_tags || details?.tags || []).map((tag: string, tIdx: number) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

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
                {detailOrder.status === PurchaseOrderStatus.DRAFT && (
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

                {detailOrder.status === PurchaseOrderStatus.SUBMITTED && (isAdmin || isManager) && (
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

                {(detailOrder.status === PurchaseOrderStatus.APPROVED || detailOrder.status === PurchaseOrderStatus.PARTIALLY_RECEIVED || detailOrder.status === PurchaseOrderStatus.RECEIVED) && (isAdmin || isManager) && (
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
                    {detailOrder.status !== PurchaseOrderStatus.RECEIVED && (
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

