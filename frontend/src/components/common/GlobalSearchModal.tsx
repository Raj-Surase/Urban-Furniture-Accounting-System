import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalBody,
} from '@heroui/react';
import {
  Search,
  LayoutDashboard,
  LineChart,
  Layers,
  Shield,
  UserCheck,
  LogIn,
  UserPlus,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sun,
  Moon,
  Radio,
  LogOut,
  CornerDownLeft,
  X,
  LayoutGrid,
  BookOpen,
  Box,
  CreditCard,
  FileSpreadsheet,
  ShoppingBag,
  Truck,
  Users,
  Store,
  Package,
  Receipt,
  Contact,
  ScrollText,
  FolderTree,
  Calculator,
  PieChart,
  BarChart3,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

export interface SearchItem {
  id: string;
  name: string;
  description: string;
  category: 'Pages' | 'Modules' | 'Functionality';
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
  keywords: string[];
  badge?: string;
  shortcut?: string;
  adminOnly?: boolean;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { toast } = useToast();

  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    toast.info(`Theme toggled to ${nextTheme} mode`);
  }, [resolvedTheme, setTheme, toast]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
    toast.success('Signed out successfully');
  }, [logout, navigate, toast]);

  // Comprehensive Search Items Catalog mapping Routes, Modules, & Functionality
  const allItems: SearchItem[] = useMemo(() => [
    // 1. Pages Category - Core Accounting Modules
    {
      id: 'page-dashboard',
      name: 'Dashboard Overview',
      description: 'Executive overview, sales & expense dual-wave telemetry, recent furniture transactions',
      category: 'Pages',
      icon: LayoutDashboard,
      path: '/',
      keywords: ['home', 'main', 'root', 'dashboard', 'revenue', 'overview', 'urban furniture'],
      badge: 'Overview',
    },
    {
      id: 'page-invoices',
      name: 'Invoices & Bills (GST)',
      description: 'Customer Invoices, Vendor Bills, GST breakdown (CGST/SGST/IGST), and PDF generation',
      category: 'Pages',
      icon: FileText,
      path: '/invoices',
      keywords: ['invoices', 'bills', 'gst', 'tax', 'nimesh pathak', 'azure furniture', 'receivable', 'payable'],
      badge: 'Accounting',
    },
    {
      id: 'page-sales-orders',
      name: 'Sales Orders',
      description: 'Customer sales orders, fulfillment tracking (e.g. 5x Office Chairs for Nimesh Pathak)',
      category: 'Pages',
      icon: Truck,
      path: '/sales-orders',
      keywords: ['sales', 'orders', 'so', 'nimesh pathak', 'office chairs', 'commercial sales'],
      badge: 'Sales',
    },
    {
      id: 'page-purchase-orders',
      name: 'Purchase Orders',
      description: 'Procurement from vendors like Azure Furniture and Open Wood for raw timber and tables',
      category: 'Pages',
      icon: ShoppingBag,
      path: '/purchase-orders',
      keywords: ['purchases', 'po', 'azure furniture', 'open wood', 'procurement', 'timber', 'tables'],
      badge: 'Purchasing',
    },
    {
      id: 'page-products',
      name: 'Products & Furniture Inventory',
      description: 'Office Chair, Wooden Table, Sofa, Dining Table, Wooden Chair, valuation, and stock count',
      category: 'Pages',
      icon: Store,
      path: '/products',
      keywords: ['products', 'furniture', 'inventory', 'office chair', 'wooden table', 'sofa', 'dining table', 'stock', 'sku'],
      badge: 'Inventory',
    },
    {
      id: 'page-accounts',
      name: 'Chart of Accounts (CoA)',
      description: 'Master list of accounts: Cash, Bank, Debtors, Creditors, Sale Income, Purchases Expense',
      category: 'Pages',
      icon: BookOpen,
      path: '/accounts',
      keywords: ['accounts', 'chart of accounts', 'coa', 'cash', 'bank', 'debtors', 'creditors', 'income', 'expense'],
      badge: 'Master',
    },
    {
      id: 'page-journal',
      name: 'General Ledger Journals',
      description: 'Double-entry journal records, debit & credit balance enforcement, Sales/Purchase journals',
      category: 'Pages',
      icon: Layers,
      path: '/journal',
      keywords: ['journal', 'ledger', 'double entry', 'debit', 'credit', 'contra', 'entries'],
      badge: 'Ledger',
    },
    {
      id: 'page-payments',
      name: 'Payments & Treasury',
      description: 'Record customer receipts and vendor payments via Cash and Bank (HDFC Bank clearing)',
      category: 'Pages',
      icon: CreditCard,
      path: '/payments',
      keywords: ['payments', 'receipts', 'bank', 'cash', 'reconciliation', 'treasury'],
      badge: 'Treasury',
    },
    {
      id: 'page-customers',
      name: 'Customer Directory',
      description: 'Client accounts master data: Nimesh Pathak, corporate clients, GSTIN, and receivables',
      category: 'Pages',
      icon: Users,
      path: '/customers',
      keywords: ['customers', 'clients', 'contacts', 'nimesh pathak', 'ar'],
      badge: 'Contacts',
    },
    {
      id: 'page-vendors',
      name: 'Vendor Directory',
      description: 'Supplier contacts: Azure Furniture, Open Wood Furnishings, Rahul Sharma, and payables',
      category: 'Pages',
      icon: Truck,
      path: '/vendors',
      keywords: ['vendors', 'suppliers', 'azure furniture', 'open wood', 'rahul sharma', 'ap'],
      badge: 'Contacts',
    },
    {
      id: 'page-bills',
      name: 'Vendor Bills',
      description: 'Vendor bills, procurement billing, and automated payment modal reconciliation',
      category: 'Pages',
      icon: Receipt,
      path: '/bills',
      keywords: ['bills', 'vendor bills', 'procurement bill', 'ap', 'azure furniture', 'payable'],
      badge: 'Purchase',
    },
    {
      id: 'page-contacts',
      name: 'Contacts Master Directory',
      description: 'Unified Customer & Vendor master directory with GSTIN and PAN tax attributes',
      category: 'Pages',
      icon: Contact,
      path: '/contacts',
      keywords: ['contacts', 'customers', 'vendors', 'gstin', 'pan', 'master', 'tax'],
      badge: 'Master',
    },
    {
      id: 'page-journals',
      name: 'Journals Master',
      description: 'Accounting journals: Customer Invoices, Vendor Bills, Bank, Cash, and General Operations',
      category: 'Pages',
      icon: ScrollText,
      path: '/journals',
      keywords: ['journals', 'sales journal', 'purchase journal', 'bank journal', 'cash journal', 'general journal'],
      badge: 'Master',
    },
    {
      id: 'page-analyticals',
      name: 'Analytic Accounts (Cost Centers)',
      description: 'Cost centers, project dimensions, and analytical tracking for furniture business lines',
      category: 'Pages',
      icon: FolderTree,
      path: '/analyticals',
      keywords: ['analyticals', 'analytic accounts', 'cost centers', 'dimensions', 'projects'],
      badge: 'Master',
    },
    {
      id: 'page-budgets',
      name: 'Analytical Budgets',
      description: 'Budget planning, target vs actuals, revision control, and transaction monitoring',
      category: 'Pages',
      icon: Calculator,
      path: '/budgets',
      keywords: ['budgets', 'budgeting', 'plan', 'forecast', 'variance', 'revision'],
      badge: 'Master',
    },
    {
      id: 'page-pnl',
      name: 'Profit & Loss Statement (P&L)',
      description: 'Income statement with custom date range pickers, account codes, and PDF export',
      category: 'Pages',
      icon: TrendingUp,
      path: '/reports/profit-loss',
      keywords: ['profit and loss', 'pnl', 'income statement', 'revenue', 'expense', 'net profit'],
      badge: 'Reports',
    },
    {
      id: 'page-balance-sheet',
      name: 'Balance Sheet Report',
      description: 'Financial position as of date, assets, liabilities, equity, and PDF export',
      category: 'Pages',
      icon: BarChart3,
      path: '/reports/balance-sheet',
      keywords: ['balance sheet', 'assets', 'liabilities', 'equity', 'financial position'],
      badge: 'Reports',
    },
    {
      id: 'page-budget-report',
      name: 'Budget Performance Report',
      description: 'Interactive analytical budget performance with donut charts and tap-to-zoom modals',
      category: 'Pages',
      icon: PieChart,
      path: '/reports/budget',
      keywords: ['budget report', 'actual vs budget', 'pie chart', 'donut chart', 'variance'],
      badge: 'Reports',
    },
    {
      id: 'page-portal',
      name: 'Customer Portal',
      description: 'Client self-service portal for tracking sales orders, invoices, and payment receipts',
      category: 'Pages',
      icon: Globe,
      path: '/portal',
      keywords: ['portal', 'customer portal', 'client portal', 'orders', 'my invoices'],
      badge: 'Portal',
    },
    {
      id: 'page-workshop',
      name: '3D Workshop & Joinery Studio',
      description: 'Interactive 3D furniture customizer, hardwood materials, dimensions, and live quote generation',
      category: 'Pages',
      icon: Package,
      path: '/workshop',
      keywords: ['workshop', 'studio', '3d', 'customizer', 'furniture', 'teak', 'oak', 'joinery', 'dimensions', '3d workshop'],
      badge: 'Studio',
    },
    {
      id: 'page-admin',
      name: 'Admin Governance Console',
      description: 'Actor role governance: Business Owner, Accountant, and Contact user portal clearance',
      category: 'Pages',
      icon: Shield,
      path: '/admin',
      keywords: ['admin', 'governance', 'roles', 'business owner', 'accountant', 'clearance'],
      badge: 'Admin',
      adminOnly: true,
    },
    {
      id: 'page-profile',
      name: 'Profile & Security Credentials',
      description: 'Sanctum session authorization, password credentials, and system actor details',
      category: 'Pages',
      icon: UserCheck,
      path: '/profile',
      keywords: ['profile', 'user', 'settings', 'security', 'credentials'],
      badge: 'Security',
    },

    // 2. Modules & Quick Actions Category
    {
      id: 'module-new-invoice',
      name: 'Create Customer Invoice / Bill',
      description: 'Draft a GST-compliant tax invoice or vendor bill with automated tax computation',
      category: 'Modules',
      icon: PlusCircle,
      path: '/invoices',
      keywords: ['create invoice', 'new bill', 'gst invoice', 'sales invoice', 'vendor bill', 'sale invoice', 'purchase bill'],
      badge: 'Action',
      shortcut: '⌘I',
    },
    {
      id: 'module-new-so',
      name: 'Create Sales Order (SO)',
      description: 'Book customer order for furniture goods (e.g. 5x Office Chairs for Nimesh Pathak)',
      category: 'Modules',
      icon: PlusCircle,
      path: '/sales-orders',
      keywords: ['create so', 'new sales order', 'book order', 'chairs', 'tables', 'sales order'],
      badge: 'Action',
    },
    {
      id: 'module-new-po',
      name: 'Create Purchase Order (PO)',
      description: 'Issue procurement order to Azure Furniture or Open Wood for wooden stock',
      category: 'Modules',
      icon: ShoppingBag,
      path: '/purchase-orders',
      keywords: ['create po', 'purchase order', 'procurement', 'azure furniture', 'timber'],
      badge: 'Action',
    },
    {
      id: 'module-new-product',
      name: 'Add Furniture Product SKU',
      description: 'Register new furniture item (Office Chair, Wooden Table, Sofa) with HSN & GST rate',
      category: 'Modules',
      icon: Package,
      path: '/products',
      keywords: ['add product', 'new sku', 'chair', 'table', 'sofa', 'goods', 'service', 'product master'],
      badge: 'Action',
    },
    {
      id: 'module-workshop-studio',
      name: 'Launch 3D Furniture Studio',
      description: 'Configure bespoke furniture specs, calculate lumber cost & gross margin, and create order quotes',
      category: 'Modules',
      icon: Box,
      path: '/workshop',
      keywords: ['3d workshop', 'custom furniture', 'studio', 'ar preview', 'wood finish', 'joinery'],
      badge: 'Studio',
    },
    {
      id: 'module-report-bs',
      name: 'Generate Balance Sheet',
      description: 'Real-time snapshot of Assets (Cash, Bank, Debtors), Liabilities (Creditors), and Capital',
      category: 'Modules',
      icon: FileSpreadsheet,
      path: '/reports/balance-sheet',
      keywords: ['balance sheet', 'balancesheet', 'assets', 'liabilities', 'capital', 'financial report'],
      badge: 'Report',
    },
    {
      id: 'module-report-pnl',
      name: 'Generate Profit & Loss Account',
      description: 'Income from furniture sales minus raw material purchases and operational expenses',
      category: 'Modules',
      icon: FileSpreadsheet,
      path: '/reports/profit-loss',
      keywords: ['profit and loss', 'pnl', 'net profit', 'sales income', 'purchase expense', 'profit loss'],
      badge: 'Report',
    },

    // 3. Functionality & Tools Category
    {
      id: 'func-toggle-theme',
      name: 'Toggle Dark / Light Theme',
      description: `Switch interface palette (currently using ${resolvedTheme} mode)`,
      category: 'Functionality',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      action: toggleTheme,
      keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'palette', 'toggle', 'color'],
      badge: 'Utility',
      shortcut: '⌘T',
    },
    {
      id: 'func-grid-view',
      name: 'Toggle Items Grid / Table View',
      description: 'Switch between tabular dense view and modern card grid in Items Directory',
      category: 'Functionality',
      icon: LayoutGrid,
      path: '/items',
      keywords: ['grid', 'table', 'view', 'display', 'layout', 'cards'],
      badge: 'View',
    },
    {
      id: 'func-sign-out',
      name: 'Sign Out Current Session',
      description: 'Revoke Sanctum bearer token and exit authenticated session',
      category: 'Functionality',
      icon: LogOut,
      action: handleLogout,
      keywords: ['logout', 'signout', 'exit', 'disconnect', 'leave'],
      badge: 'Auth',
    },
  ], [resolvedTheme, toggleTheme, handleLogout]);

  // Filter items according to search query, role authorization, and category tab
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allItems.filter((item) => {
      // Role check: Hide admin items from non-admin users
      if (item.adminOnly && !isAdmin && user?.role !== UserRole.MANAGER) {
        return false;
      }

      // Category tab check
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Query match check
      if (!q) return true;

      const matchesName = item.name.toLowerCase().includes(q);
      const matchesDesc = item.description.toLowerCase().includes(q);
      const matchesCategory = item.category.toLowerCase().includes(q);
      const matchesKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(q));

      return matchesName || matchesDesc || matchesCategory || matchesKeywords;
    });
  }, [allItems, query, selectedCategory, isAdmin, user?.role]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: { category: string; items: SearchItem[] }[] = [];
    const categories: ('Pages' | 'Modules' | 'Functionality')[] = ['Pages', 'Modules', 'Functionality'];

    categories.forEach((cat) => {
      const catItems = filteredItems.filter((item) => item.category === cat);
      if (catItems.length > 0) {
        groups.push({ category: cat, items: catItems });
      }
    });

    return groups;
  }, [filteredItems]);

  // Flat list for linear keyboard navigation
  const flattenedFilteredItems = useMemo(() => {
    return groupedItems.flatMap((g) => g.items);
  }, [groupedItems]);

  // Execute selected search item
  const handleSelect = useCallback((item: SearchItem) => {
    onClose();
    if (item.action) {
      item.action();
      return;
    }
    if (item.path) {
      if (item.path.includes('#')) {
        const [basePath, hash] = item.path.split('#');
        navigate(basePath || '/');
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      } else {
        navigate(item.path);
      }
    }
  }, [navigate, onClose]);

  // Auto-focus search input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Global hotkey listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search modal (trigger handler)
          const searchBtn = document.querySelector('[data-search-trigger="true"]') as HTMLButtonElement;
          if (searchBtn) searchBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Modal navigation keyboard events (ArrowUp, ArrowDown, Enter, Esc)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (flattenedFilteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flattenedFilteredItems.length) % (flattenedFilteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedFilteredItems[selectedIndex]) {
        handleSelect(flattenedFilteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="top"
      backdrop="blur"
      hideCloseButton
      classNames={{
        base: 'bg-card dark:bg-[#16161c] border border-border dark:border-white/[0.1] rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden mt-12 sm:mt-20 mx-4 max-w-2xl text-foreground',
        backdrop: 'bg-black/50 dark:bg-black/75 backdrop-blur-md z-[100]',
        wrapper: 'z-[101]',
      }}
    >
      <ModalContent>
        <ModalBody className="p-0 gap-0">
          {/* 1. Header Search Input Bar */}
          <div className="flex items-center px-4 sm:px-6 py-4 border-b border-border dark:border-white/[0.08] bg-muted/40 dark:bg-[#1a1a23] gap-3">
            <Search className="w-5 h-5 text-muted-foreground dark:text-[#808090] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search pages, modules, functionality, or quick actions..."
              className="bg-transparent border-none outline-none text-foreground dark:text-white text-sm sm:text-base placeholder:text-muted-foreground dark:placeholder:text-[#606070] w-full font-sans leading-normal"
              autoComplete="off"
              spellCheck="false"
            />
            {query.length > 0 && (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground dark:text-[#808090] dark:hover:text-white hover:bg-muted dark:hover:bg-white/[0.06] transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-background dark:bg-white/[0.06] border border-border dark:border-white/[0.08] text-[10.5px] text-muted-foreground dark:text-[#808090] font-mono select-none">
              ESC
            </kbd>
          </div>

          {/* 2. Filter Category Pills */}
          <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-border dark:border-white/[0.06] bg-card dark:bg-[#141418] overflow-x-auto no-scrollbar">
            {['All', 'Pages', 'Modules', 'Functionality'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all select-none whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground dark:bg-white dark:text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:text-[#808090] dark:hover:text-white dark:hover:bg-white/[0.05]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 3. Search Results List */}
          <div
            ref={listRef}
            className="max-h-[380px] overflow-y-auto p-3 sm:p-4 space-y-4 no-scrollbar"
          >
            {groupedItems.length > 0 ? (
              groupedItems.map((group) => (
                <div key={group.category} className="space-y-1">
                  <div className="px-3 py-1 text-[10.5px] font-bold text-muted-foreground dark:text-[#707080] uppercase tracking-widest font-sans flex items-center justify-between">
                    <span>{group.category}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/80 dark:text-[#606070]">{group.items.length}</span>
                  </div>

                  {group.items.map((item) => {
                    const itemGlobalIndex = flattenedFilteredItems.findIndex((fi) => fi.id === item.id);
                    const isSelected = itemGlobalIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        data-selected={isSelected}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        onClick={() => handleSelect(item)}
                        className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-150 border ${
                          isSelected
                            ? 'bg-muted dark:bg-white/[0.08] border-border dark:border-white/[0.12] text-foreground dark:text-white shadow-sm'
                            : 'border-transparent text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#7042f4] text-white shadow-[0_0_12px_rgba(112,66,244,0.4)]'
                                : 'bg-muted dark:bg-white/[0.05] text-muted-foreground dark:text-[#808090] group-hover:text-foreground dark:group-hover:text-white group-hover:bg-muted-foreground/10 dark:group-hover:bg-white/[0.08]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  isSelected ? 'text-foreground dark:text-white' : 'text-foreground/90 dark:text-white/90 group-hover:text-foreground dark:group-hover:text-white'
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.badge && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase leading-none ${
                                    item.badge === 'Admin'
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                                      : item.badge === 'Action'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                                      : 'bg-muted dark:bg-white/[0.06] text-muted-foreground dark:text-[#808090]'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground dark:text-[#707080] truncate mt-0.5 group-hover:text-foreground dark:group-hover:text-[#9090a0]">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Action / Enter Indicator */}
                        <div className="flex items-center gap-2 pl-3 shrink-0">
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-background dark:bg-white/[0.06] border border-border dark:border-white/[0.08] text-[10px] text-muted-foreground dark:text-[#808090] font-mono">
                              {item.shortcut}
                            </kbd>
                          )}
                          {isSelected && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#7042f4] dark:text-[#c084fc] bg-[#7042f4]/15 border border-[#7042f4]/30 px-2 py-0.5 rounded-lg">
                              <span>Jump</span>
                              <CornerDownLeft className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted dark:bg-white/[0.04] border border-border dark:border-white/[0.06] flex items-center justify-center mx-auto text-muted-foreground dark:text-[#606070]">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground dark:text-white">No results found</h4>
                  <p className="text-xs text-muted-foreground dark:text-[#707080] mt-1 max-w-sm mx-auto">
                    No matching routes, modules, or actions found for &ldquo;{query}&rdquo;.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                  {['Dashboard', 'Items', 'Create Item', 'Admin', 'Theme'].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setQuery(hint)}
                      className="px-2.5 py-1 rounded-lg bg-muted/60 dark:bg-white/[0.04] hover:bg-muted dark:hover:bg-white/[0.08] border border-border dark:border-white/[0.06] text-[11px] text-muted-foreground dark:text-[#808090] hover:text-foreground dark:hover:text-white transition-all"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Keyboard Shortcuts Footer */}
          <div className="border-t border-border dark:border-white/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between text-[11px] text-muted-foreground dark:text-[#707080] bg-card dark:bg-[#141418] select-none">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background dark:bg-white/[0.06] border border-border dark:border-white/[0.08] text-[10px] font-mono text-muted-foreground dark:text-[#808090]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-background dark:bg-white/[0.06] border border-border dark:border-white/[0.08] text-[10px] font-mono text-muted-foreground dark:text-[#808090]">↓</kbd>
                <span className="ml-0.5 hidden sm:inline">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background dark:bg-white/[0.06] border border-border dark:border-white/[0.08] text-[10px] font-mono text-muted-foreground dark:text-[#808090]">↵</kbd>
                <span className="ml-0.5 hidden sm:inline">Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background dark:bg-white/[0.06] border border-border dark:border-white/[0.08] text-[10px] font-mono text-muted-foreground dark:text-[#808090]">ESC</kbd>
                <span className="ml-0.5 hidden sm:inline">Dismiss</span>
              </span>
            </div>

            <div className="text-[10.5px] font-mono text-muted-foreground/80 dark:text-[#606070]">
              {flattenedFilteredItems.length} options
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GlobalSearchModal;

