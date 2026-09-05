import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  Pagination,
  Divider,
} from '@heroui/react';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import { formatApiError } from '../lib/errorHandler';
import { AnimatedStatCard } from '../components/ui/AnimatedStatCard';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  Layers,
  CheckCircle2,
  Clock,
  Radio,
  Eye,
  LayoutGrid,
  List,
  AlertCircle,
  Calendar,
  User,
  Lock,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface Item {
  id: number;
  user_id?: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  can_edit?: boolean;
  can_delete?: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export const ItemsPage: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine'>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal Disclosures
  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const detailModal = useDisclosure();

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<string>('pending');
  const [formPriority, setFormPriority] = useState<string>('medium');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const { socket, subscribe } = useSocket();
  const { toast } = useToast();

  // Fetch Items from Laravel API
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
      if (ownershipFilter === 'mine') params.mine = 1;

      const res = await api.get('/items', { params });
      const data = res.data.data || [];
      setItems(data);

      if (res.data.meta) {
        setTotalItems(res.data.meta.total || data.length);
        setTotalPages(res.data.meta.last_page || 1);
      } else {
        setTotalItems(data.length);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      setError(formatted.message);
      toast.error('Failed to load items: ' + formatted.message);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, priorityFilter, ownershipFilter, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Realtime Socket.io integration
  useEffect(() => {
    subscribe('items');

    if (!socket) return;

    const handleCreated = (payload: any) => {
      const newItem: Item = payload.data || payload;
      if (newItem && newItem.id) {
        setItems((prev) => [newItem, ...prev.filter((it) => it.id !== newItem.id)]);
        setTotalItems((c) => c + 1);
        toast.info(`⚡ [Realtime] New item added: "${newItem.title}"`);
      }
    };

    const handleUpdated = (payload: any) => {
      const updatedItem: Item = payload.data || payload;
      if (updatedItem && updatedItem.id) {
        setItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)));
        toast.info(`⚡ [Realtime] Item #${updatedItem.id} updated: "${updatedItem.title}"`);
      }
    };

    const handleDeleted = (payload: any) => {
      const deletedId = payload.data?.id || payload.id;
      if (deletedId) {
        setItems((prev) => prev.filter((it) => it.id !== deletedId));
        setTotalItems((c) => Math.max(0, c - 1));
        toast.info(`⚡ [Realtime] Item #${deletedId} was deleted.`);
      }
    };

    socket.on('item:created', handleCreated);
    socket.on('item:updated', handleUpdated);
    socket.on('item:deleted', handleDeleted);

    return () => {
      socket.off('item:created');
      socket.off('item:updated');
      socket.off('item:deleted');
    };
  }, [socket, subscribe, toast]);

  // Client-side sorting
  const sortedItems = useMemo(() => {
    const list = [...items];
    switch (sortBy) {
      case 'oldest':
        return list.sort((a, b) => a.id - b.id);
      case 'title_asc':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'priority_high': {
        const rank: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return list.sort((a, b) => (rank[b.priority] || 0) - (rank[a.priority] || 0));
      }
      case 'newest':
      default:
        return list.sort((a, b) => b.id - a.id);
    }
  }, [items, sortBy]);

  // Calculated Stats
  const completedCount = useMemo(() => items.filter((i) => i.status === 'completed').length, [items]);
  const inProgressCount = useMemo(() => items.filter((i) => i.status === 'in_progress').length, [items]);
  const pendingCount = useMemo(() => items.filter((i) => i.status === 'pending').length, [items]);

  // Form Handlers
  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormStatus('pending');
    setFormPriority('medium');
    setFieldErrors({});
    setActiveItem(null);
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      resetForm();
      createModal.onOpen();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }

    const status = searchParams.get('status');
    if (status && ['in_progress', 'completed', 'pending', 'all'].includes(status)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormLoading(true);

    try {
      const res = await api.post('/items', {
        title: formTitle,
        description: formDescription,
        status: formStatus,
        priority: formPriority,
      });

      toast.success('Item created in PostgreSQL!');
      createModal.onClose();
      resetForm();

      if (res.data?.data) {
        setItems((prev) => [res.data.data, ...prev.filter((i) => i.id !== res.data.data.id)]);
      }
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      if (formatted.isValidationError && formatted.fieldErrors) {
        setFieldErrors(formatted.fieldErrors);
      }
      toast.error(formatted.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (item: Item) => {
    setActiveItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormStatus(item.status);
    setFormPriority(item.priority);
    setFieldErrors({});
    editModal.onOpen();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setFieldErrors({});
    setFormLoading(true);

    try {
      const res = await api.put(`/items/${activeItem.id}`, {
        title: formTitle,
        description: formDescription,
        status: formStatus,
        priority: formPriority,
      });

      toast.success('Item updated successfully!');
      editModal.onClose();
      resetForm();

      if (res.data?.data) {
        setItems((prev) => prev.map((i) => (i.id === res.data.data.id ? res.data.data : i)));
      }
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      if (formatted.isValidationError && formatted.fieldErrors) {
        setFieldErrors(formatted.fieldErrors);
      }
      toast.error(formatted.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (item: Item) => {
    setActiveItem(item);
    deleteModal.onOpen();
  };

  const openDetailModal = (item: Item) => {
    setActiveItem(item);
    detailModal.onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!activeItem) return;
    setFormLoading(true);
    try {
      await api.delete(`/items/${activeItem.id}`);
      toast.success('Item deleted successfully!');
      deleteModal.onClose();
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      setActiveItem(null);
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      toast.error('Error deleting item: ' + formatted.message);
    } finally {
      setFormLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
    setPage(1);
  };

  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1e2922] text-[#34d399] border border-[#34d399]/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2a241b] text-[#fbbf24] border border-[#fbbf24]/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#241e33] text-[#c084fc] border border-[#c084fc]/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
            Pending
          </span>
        );
    }
  };

  const renderPriorityChip = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/[0.05] text-[#9090a0] border border-white/10">
            Low
          </span>
        );
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-10">
        {/* Header matching Expected UI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                Items Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30">
                PostgreSQL CRUD
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8e8e9f] mt-1 font-sans">
              Create, inspect, filter, and modify records in PostgreSQL with instantaneous multi-client Socket.io updates.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* View Mode Pill Switcher */}
            <div className="flex items-center bg-[#1c1c23] border border-white/[0.06] p-1 rounded-full shadow-inner">
              <Tooltip content="Table View">
                <button
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                    viewMode === 'table' ? 'bg-white text-black font-bold shadow-xs' : 'text-[#808090] hover:text-white'
                  }`}
                  onClick={() => setViewMode('table')}
                  aria-label="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Card Grid View">
                <button
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-black font-bold shadow-xs' : 'text-[#808090] hover:text-white'
                  }`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Card Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Primary Action White Pill Button */}
            <button
              onClick={() => {
                resetForm();
                createModal.onOpen();
              }}
              className="bg-white text-black font-semibold rounded-full px-5 py-2 hover:bg-white/90 active:scale-95 text-xs flex items-center gap-1.5 transition-all shadow-sm select-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Item
            </button>
          </div>
        </div>

        {/* 4 Sleek Obsidian KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Items */}
          <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-5 sm:p-6 shadow-obsidian-card hover:border-white/12 transition-all">
            <div className="text-xs text-[#8e8e9f] font-medium font-sans">TOTAL ITEMS</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-bold text-white tracking-tight font-sans">{totalItems}</span>
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                100% synchronized
              </span>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-5 sm:p-6 shadow-obsidian-card hover:border-white/12 transition-all">
            <div className="text-xs text-[#8e8e9f] font-medium font-sans">COMPLETED</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-bold text-white tracking-tight font-sans">{completedCount}</span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                {Math.round((completedCount / Math.max(1, totalItems)) * 100)}% completion rate
              </span>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-5 sm:p-6 shadow-obsidian-card hover:border-white/12 transition-all">
            <div className="text-xs text-[#8e8e9f] font-medium font-sans">IN PROGRESS</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-bold text-white tracking-tight font-sans">{inProgressCount}</span>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                {Math.round((inProgressCount / Math.max(1, totalItems)) * 100)}% active sprint
              </span>
            </div>
          </div>

          {/* Card 4: Pending Review */}
          <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-5 sm:p-6 shadow-obsidian-card hover:border-white/12 transition-all">
            <div className="text-xs text-[#8e8e9f] font-medium font-sans">PENDING REVIEW</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-bold text-white tracking-tight font-sans">{pendingCount}</span>
              <span className="text-[11px] font-bold text-[#c084fc] bg-[#7042f4]/15 border border-[#7042f4]/25 px-2 py-0.5 rounded-full">
                {Math.round((pendingCount / Math.max(1, totalItems)) * 100)}% unresolved
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Criteria Filter & Search Toolbar */}
        <div className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card rounded-[24px] p-5 sm:p-6 space-y-4">
          {/* Ownership & Clearance Level Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-1.5 bg-[#141418] p-1 rounded-xl border border-white/[0.06] w-fit">
              <button
                type="button"
                onClick={() => {
                  setOwnershipFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ownershipFilter === 'all'
                    ? 'bg-white text-black shadow-xs font-bold'
                    : 'text-[#8e8e9f] hover:text-white'
                }`}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => {
                  setOwnershipFilter('mine');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  ownershipFilter === 'mine'
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-[#8e8e9f] hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                My Items
              </button>
            </div>

            <div className="text-xs text-[#8e8e9f] flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white/80">Current Clearance:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider border ${
                  user?.role === 'admin'
                    ? 'bg-[#7042f4]/20 text-[#c084fc] border-[#7042f4]/30'
                    : user?.role === 'manager'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {user?.role || 'Guest'}
              </span>
              <span className="text-[11px] text-[#8e8e9f] hidden md:inline">
                {user?.role === 'admin'
                  ? '• Superuser: Full CRUD & Deletion rights'
                  : user?.role === 'manager'
                  ? '• Manager: Can Edit Any Item (Deletion Restricted)'
                  : '• Standard: Can Edit Own Items Only (Deletion Restricted)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Bar */}
            <div className="sm:col-span-5">
              <Input
                placeholder="Search by title or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                startContent={<Search className="w-4 h-4 text-[#8e8e9f]" />}
                variant="bordered"
                size="sm"
                isClearable
                onClear={() => {
                  setSearch('');
                  setPage(1);
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <Select
                aria-label="Filter by Status"
                selectedKeys={[statusFilter]}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                size="sm"
                variant="bordered"
              >
                <SelectItem key="all">All Statuses</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="in_progress">In Progress</SelectItem>
                <SelectItem key="completed">Completed</SelectItem>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="sm:col-span-2">
              <Select
                aria-label="Filter by Priority"
                selectedKeys={[priorityFilter]}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                size="sm"
                variant="bordered"
              >
                <SelectItem key="all">All Priorities</SelectItem>
                <SelectItem key="low">Low Priority</SelectItem>
                <SelectItem key="medium">Medium Priority</SelectItem>
                <SelectItem key="high">High Priority</SelectItem>
              </Select>
            </div>

            {/* Sort Order Selector */}
            <div className="sm:col-span-2">
              <Select
                aria-label="Sort order"
                selectedKeys={[sortBy]}
                onChange={(e) => setSortBy(e.target.value)}
                size="sm"
                variant="bordered"
              >
                <SelectItem key="newest">Newest First</SelectItem>
                <SelectItem key="oldest">Oldest First</SelectItem>
                <SelectItem key="title_asc">Title (A-Z)</SelectItem>
                <SelectItem key="priority_high">Priority (High-Low)</SelectItem>
              </Select>
            </div>

            {/* Refresh Action */}
            <div className="sm:col-span-1 flex items-center justify-end">
              <Tooltip content="Refresh records">
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  className="w-full sm:w-auto rounded-xl border border-white/[0.06] bg-[#22222b] text-[#a0a0b0] hover:text-white"
                  onPress={fetchItems}
                  isLoading={loading}
                  aria-label="Refresh records"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Active filters pill list */}
          {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[#8e8e9f] font-semibold">Active Filters:</span>
              {search && (
                <Chip size="sm" onClose={() => setSearch('')} variant="flat" color="primary">
                  Search: "{search}"
                </Chip>
              )}
              {statusFilter !== 'all' && (
                <Chip size="sm" onClose={() => setStatusFilter('all')} variant="flat" color="secondary">
                  Status: {statusFilter}
                </Chip>
              )}
              {priorityFilter !== 'all' && (
                <Chip size="sm" onClose={() => setPriorityFilter('all')} variant="flat" color="warning">
                  Priority: {priorityFilter}
                </Chip>
              )}
              <Button size="sm" variant="light" color="danger" className="h-6 text-[11px]" onPress={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Error Alert if query failed */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="flat" color="danger" onPress={fetchItems}>
              Retry
            </Button>
          </div>
        )}

        {/* Content View: Table or Card Grid */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card rounded-[24px] overflow-hidden">
            <div className="p-0 overflow-x-auto">
              <Table
                aria-label="Items Resource Table"
                className="min-w-full"
                shadow="none"
                removeWrapper
              >
                <TableHeader>
                  <TableColumn className="w-20 font-bold text-[#757588] bg-[#141419] py-4 px-6 text-[11px] uppercase tracking-wider">ID</TableColumn>
                  <TableColumn className="font-bold text-[#757588] bg-[#141419] py-4 px-6 text-[11px] uppercase tracking-wider">TITLE & DESCRIPTION</TableColumn>
                  <TableColumn className="w-36 font-bold text-[#757588] bg-[#141419] py-4 px-6 text-[11px] uppercase tracking-wider">STATUS</TableColumn>
                  <TableColumn className="w-32 font-bold text-[#757588] bg-[#141419] py-4 px-6 text-[11px] uppercase tracking-wider">PRIORITY</TableColumn>
                  <TableColumn className="w-40 font-bold text-[#757588] bg-[#141419] py-4 px-6 text-[11px] uppercase tracking-wider">CREATOR</TableColumn>
                  <TableColumn className="w-32 text-right font-bold text-[#757588] bg-[#141419] py-4 px-6 text-[11px] uppercase tracking-wider">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={loading}
                  emptyContent={
                    <div className="py-16 text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-[#22222b] flex items-center justify-center text-[#8e8e9f]">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-semibold text-white">
                        No items found matching your filters
                      </div>
                      <Button size="sm" variant="flat" color="primary" onPress={clearFilters}>
                        Reset Filters
                      </Button>
                    </div>
                  }
                >
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-white/[0.03] transition-colors border-b border-white/[0.04]">
                      <TableCell className="font-mono text-xs text-[#7042f4] font-semibold">#{item.id}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => openDetailModal(item)}
                          className="text-left font-semibold text-white hover:text-[#c084fc] transition-colors cursor-pointer"
                        >
                          {item.title}
                        </button>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-sans">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{renderStatusChip(item.status)}</TableCell>
                      <TableCell>{renderPriorityChip(item.priority)}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                          <span className="text-white font-medium">
                            {item.user?.name || 'System'}
                            {item.user_id === user?.id && (
                              <span className="ml-1 text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                You
                              </span>
                            )}
                          </span>
                          {item.user?.role && (
                            <span
                              className={`text-[9.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border w-fit ${
                                item.user.role === 'admin'
                                  ? 'bg-[#7042f4]/15 text-[#c084fc] border-[#7042f4]/25'
                                  : item.user.role === 'manager'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                  : 'bg-white/[0.06] text-[#8e8e9f] border-white/10'
                              }`}
                            >
                              {item.user.role}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip content="Inspect Details">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              onPress={() => openDetailModal(item)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Tooltip>

                          {/* Role-tailored Edit Action */}
                          {(item.can_edit ?? (isAdmin || isManager || item.user_id === user?.id)) ? (
                            <Tooltip content={isManager && item.user_id !== user?.id ? "Edit Item (Manager Access)" : "Edit Item"}>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-muted-foreground hover:text-primary cursor-pointer"
                                onPress={() => openEditModal(item)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Read-only: You can only edit your own items">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                isDisabled
                                className="opacity-30 cursor-not-allowed text-[#8e8e9f]"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </Button>
                            </Tooltip>
                          )}

                          {/* Role-tailored Delete Action */}
                          {(item.can_delete ?? isAdmin) ? (
                            <Tooltip content="Delete Item" color="danger">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-muted-foreground hover:text-rose-400 cursor-pointer"
                                onPress={() => openDeleteModal(item)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Administrator clearance required to delete items">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                isDisabled
                                className="opacity-30 cursor-not-allowed text-rose-500/50"
                              >
                                <Lock className="w-3.5 h-3.5 text-rose-400/50" />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Card Grid View */
          <div>
            {sortedItems.length === 0 && !loading ? (
              <div className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card rounded-[24px] p-12 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[#22222b] flex items-center justify-center text-[#8e8e9f]">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-white">
                  No items found matching your filters
                </div>
                <Button size="sm" variant="flat" color="primary" onPress={clearFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card hover:border-white/12 transition-all duration-300 rounded-[24px] h-full flex flex-col justify-between">
                      <CardHeader className="flex flex-row items-start justify-between gap-3 p-6 sm:p-7 pb-3">
                        <div className="space-y-1">
                          <span className="font-mono text-[11px] text-[#7042f4] font-semibold">#{item.id}</span>
                          <h3
                            onClick={() => openDetailModal(item)}
                            className="font-bold text-base text-white line-clamp-1 hover:text-[#c084fc] cursor-pointer transition-colors"
                          >
                            {item.title}
                          </h3>
                        </div>
                        {renderPriorityChip(item.priority)}
                      </CardHeader>

                      <CardBody className="p-6 sm:p-7 pt-1 space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-[#8e8e9f] line-clamp-3 leading-relaxed">
                            {item.description || 'No detailed description provided for this item.'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/[0.04] text-[11px] text-[#8e8e9f]">
                            <span>Author:</span>
                            <span className="font-semibold text-white">
                              {item.user?.name || 'System'}
                              {item.user_id === user?.id && (
                                <span className="ml-1 text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  You
                                </span>
                              )}
                            </span>
                            {item.user?.role && (
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                                item.user.role === 'admin'
                                  ? 'bg-[#7042f4]/15 text-[#c084fc] border-[#7042f4]/25'
                                  : item.user.role === 'manager'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                  : 'bg-white/[0.06] text-[#8e8e9f] border-white/10'
                              }`}>
                                {item.user.role}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderStatusChip(item.status)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Tooltip content="Inspect Details">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-[#a0a0b0] hover:text-white active:scale-95 cursor-pointer"
                                onPress={() => openDetailModal(item)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Tooltip>

                            {/* Card Edit Action */}
                            {(item.can_edit ?? (isAdmin || isManager || item.user_id === user?.id)) ? (
                              <Tooltip content={isManager && item.user_id !== user?.id ? "Edit Item (Manager Access)" : "Edit Item"}>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  className="text-[#a0a0b0] hover:text-[#c084fc] active:scale-95 cursor-pointer"
                                  onPress={() => openEditModal(item)}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip content="Read-only: You can only edit your own items">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  isDisabled
                                  className="opacity-30 cursor-not-allowed text-[#8e8e9f]"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </Button>
                              </Tooltip>
                            )}

                            {/* Card Delete Action */}
                            {(item.can_delete ?? isAdmin) ? (
                              <Tooltip content="Delete Item">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  className="text-[#a0a0b0] hover:text-rose-400 active:scale-95 cursor-pointer"
                                  onPress={() => openDeleteModal(item)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip content="Administrator clearance required to delete items">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  isDisabled
                                  className="opacity-30 cursor-not-allowed text-rose-500/50"
                                >
                                  <Lock className="w-3.5 h-3.5 text-rose-400/50" />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination & Count Footer Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-[24px] bg-[#18181f] border border-white/[0.06] shadow-obsidian-card text-xs text-[#8e8e9f]">
          <div>
            Showing <strong className="text-white">{sortedItems.length}</strong> of{' '}
            <strong className="text-white">{totalItems}</strong> total records
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#8e8e9f] font-semibold">Per page:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-[#22222b] border border-white/[0.06] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {totalPages > 1 && (
              <Pagination
                total={totalPages}
                page={page}
                onChange={(p) => setPage(p)}
                size="sm"
                color="primary"
                showControls
              />
            )}
          </div>
        </div>

        {/* Create Item Modal */}
        <Modal
          isOpen={createModal.isOpen}
          onOpenChange={createModal.onOpenChange}
          backdrop="blur"
          radius="lg"
          classNames={{
            base: 'border border-white/[0.08] bg-[#15151a] shadow-2xl rounded-[28px] overflow-hidden',
            backdrop: 'bg-black/70 backdrop-blur-md',
          }}
        >
          <ModalContent>
            {(onClose) => (
              <form onSubmit={handleCreateSubmit}>
                <ModalHeader className="flex flex-col gap-1.5 pt-6 sm:pt-8 px-6 sm:px-8 pb-2">
                  <span className="text-xl font-bold text-foreground font-sans">Create New Item</span>
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground font-sans">
                    Persisted into PostgreSQL database and broadcast across all Socket.io clients.
                  </span>
                </ModalHeader>
                <ModalBody className="space-y-4 px-6 sm:px-8 py-5">
                  <Input
                    label="Title"
                    placeholder="e.g. Implement Odoo API Adapter"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    variant="bordered"
                    size="sm"
                    required
                    autoFocus
                    isInvalid={!!fieldErrors.title}
                    errorMessage={fieldErrors.title}
                  />

                  <Textarea
                    label="Description"
                    placeholder="Details, task scope, or requirements..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    variant="bordered"
                    size="sm"
                    minRows={3}
                    isInvalid={!!fieldErrors.description}
                    errorMessage={fieldErrors.description}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Status"
                      selectedKeys={[formStatus]}
                      onChange={(e) => setFormStatus(e.target.value)}
                      variant="bordered"
                      size="sm"
                    >
                      <SelectItem key="pending">Pending</SelectItem>
                      <SelectItem key="in_progress">In Progress</SelectItem>
                      <SelectItem key="completed">Completed</SelectItem>
                    </Select>

                    <Select
                      label="Priority"
                      selectedKeys={[formPriority]}
                      onChange={(e) => setFormPriority(e.target.value)}
                      variant="bordered"
                      size="sm"
                    >
                      <SelectItem key="low">Low</SelectItem>
                      <SelectItem key="medium">Medium</SelectItem>
                      <SelectItem key="high">High</SelectItem>
                    </Select>
                  </div>
                </ModalBody>
                <ModalFooter className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                  <Button color="danger" variant="flat" onPress={onClose} className="rounded-xl font-semibold">
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={formLoading}
                    className="font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft"
                  >
                    Save Item
                  </Button>
                </ModalFooter>
              </form>
            )}
          </ModalContent>
        </Modal>

        {/* Edit Item Modal */}
        <Modal
          isOpen={editModal.isOpen}
          onOpenChange={editModal.onOpenChange}
          backdrop="blur"
          radius="lg"
          classNames={{
            base: 'border border-white/[0.08] bg-[#15151a] shadow-2xl rounded-[28px] overflow-hidden',
            backdrop: 'bg-black/70 backdrop-blur-md',
          }}
        >
          <ModalContent>
            {(onClose) => (
              <form onSubmit={handleEditSubmit}>
                <ModalHeader className="flex flex-col gap-1.5 pt-6 sm:pt-8 px-6 sm:px-8 pb-2">
                  <span className="text-xl font-bold text-white font-sans">
                    Edit Item #{activeItem?.id}
                  </span>
                  <span className="text-xs sm:text-sm font-normal text-[#8e8e9f] font-sans">
                    Modifications will be immediately broadcast to all connected users.
                  </span>
                </ModalHeader>
                <ModalBody className="space-y-4 px-6 sm:px-8 py-5">
                  <Input
                    label="Title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    variant="bordered"
                    size="sm"
                    required
                    autoFocus
                    isInvalid={!!fieldErrors.title}
                    errorMessage={fieldErrors.title}
                  />

                  <Textarea
                    label="Description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    variant="bordered"
                    size="sm"
                    minRows={3}
                    isInvalid={!!fieldErrors.description}
                    errorMessage={fieldErrors.description}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Status"
                      selectedKeys={[formStatus]}
                      onChange={(e) => setFormStatus(e.target.value)}
                      variant="bordered"
                      size="sm"
                    >
                      <SelectItem key="pending">Pending</SelectItem>
                      <SelectItem key="in_progress">In Progress</SelectItem>
                      <SelectItem key="completed">Completed</SelectItem>
                    </Select>

                    <Select
                      label="Priority"
                      selectedKeys={[formPriority]}
                      onChange={(e) => setFormPriority(e.target.value)}
                      variant="bordered"
                      size="sm"
                    >
                      <SelectItem key="low">Low</SelectItem>
                      <SelectItem key="medium">Medium</SelectItem>
                      <SelectItem key="high">High</SelectItem>
                    </Select>
                  </div>
                </ModalBody>
                <ModalFooter className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                  <Button color="danger" variant="flat" onPress={onClose} className="rounded-xl font-semibold">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={formLoading}
                    className="font-semibold rounded-full bg-white text-black hover:bg-white/90 shadow-sm px-5 py-2 text-xs"
                  >
                    Update Item
                  </Button>
                </ModalFooter>
              </form>
            )}
          </ModalContent>
        </Modal>

        {/* Item Detail Inspector Modal */}
        <Modal
          isOpen={detailModal.isOpen}
          onOpenChange={detailModal.onOpenChange}
          backdrop="blur"
          radius="lg"
          classNames={{
            base: 'border border-white/[0.08] bg-[#15151a] shadow-2xl rounded-[28px] overflow-hidden',
            backdrop: 'bg-black/70 backdrop-blur-md',
          }}
        >
          <ModalContent>
            {(onClose) => (
              <div>
                <ModalHeader className="flex items-center justify-between pb-2 pt-6 sm:pt-8 px-6 sm:px-8">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm text-[#7042f4] font-bold bg-[#7042f4]/15 px-2.5 py-0.5 rounded-lg border border-[#7042f4]/25">#{activeItem?.id}</span>
                    <span className="text-xl font-bold text-white font-sans">Item Details</span>
                  </div>
                </ModalHeader>
                <ModalBody className="space-y-5 py-5 px-6 sm:px-8 text-xs font-sans">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {activeItem?.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2.5">
                      {activeItem && renderStatusChip(activeItem.status)}
                      {activeItem && renderPriorityChip(activeItem.priority)}
                    </div>
                  </div>

                  <Divider className="border-white/[0.06]" />

                  <div className="space-y-2">
                    <span className="font-bold text-[#8e8e9f] uppercase text-[10px] tracking-wider">
                      Description
                    </span>
                    <p className="text-white/90 leading-relaxed bg-[#202029] p-4 rounded-2xl border border-white/[0.04] text-xs sm:text-sm">
                      {activeItem?.description || 'No description provided for this item.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="p-4 rounded-2xl bg-[#202029] border border-white/[0.04]">
                      <span className="text-[#8e8e9f] block text-[10px] uppercase font-bold">Author</span>
                      <span className="font-bold text-white mt-1 flex items-center gap-2 text-xs sm:text-sm">
                        <User className="w-4 h-4 text-[#7042f4]" />
                        {activeItem?.user?.name || 'Admin / System'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#202029] border border-white/[0.04]">
                      <span className="text-[#8e8e9f] block text-[10px] uppercase font-bold">Date Added</span>
                      <span className="font-bold text-white mt-1 flex items-center gap-2 text-xs sm:text-sm">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        {activeItem?.created_at ? new Date(activeItem.created_at).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                  <Button
                    color="primary"
                    variant="flat"
                    className="rounded-full font-semibold bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30 hover:bg-[#7042f4]/30 px-5 text-xs"
                    onPress={() => {
                      onClose();
                      if (activeItem) openEditModal(activeItem);
                    }}
                    startContent={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit Record
                  </Button>
                  <Button variant="solid" color="default" onPress={onClose} className="rounded-full font-semibold bg-white text-black hover:bg-white/90 px-5 text-xs">
                    Close
                  </Button>
                </ModalFooter>
              </div>
            )}
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onOpenChange={deleteModal.onOpenChange}
          backdrop="blur"
          radius="lg"
          classNames={{
            base: 'border border-rose-500/30 bg-[#15151a] shadow-2xl rounded-[28px] overflow-hidden',
            backdrop: 'bg-black/70 backdrop-blur-md',
          }}
        >
          <ModalContent>
            {(onClose) => (
              <div>
                <ModalHeader className="text-rose-500 font-bold flex items-center gap-2.5 pt-6 sm:pt-8 px-6 sm:px-8 pb-2 font-sans">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xl">Confirm Permanent Deletion</span>
                </ModalHeader>
                <ModalBody className="px-6 sm:px-8 py-4 font-sans">
                  <p className="text-sm text-foreground leading-relaxed">
                    Are you sure you want to delete{' '}
                    <strong className="text-foreground font-bold">{activeItem?.title}</strong>?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    This item will be deleted from PostgreSQL and an <code>item:deleted</code> broadcast will be emitted to all connected clients.
                  </p>
                </ModalBody>
                <ModalFooter className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4">
                  <Button variant="flat" onPress={onClose} className="rounded-xl font-semibold">
                    Cancel
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleDeleteConfirm}
                    isLoading={formLoading}
                    className="font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-soft"
                  >
                    Delete Item
                  </Button>
                </ModalFooter>
              </div>
            )}
          </ModalContent>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default ItemsPage;
