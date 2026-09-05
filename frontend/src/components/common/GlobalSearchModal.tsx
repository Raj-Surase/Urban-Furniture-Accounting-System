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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

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
    // 1. Pages Category
    {
      id: 'page-dashboard',
      name: 'Dashboard Overview',
      description: 'Executive telemetry, 3-segment revenue visualizer, real-time KPI metrics',
      category: 'Pages',
      icon: LayoutDashboard,
      path: '/',
      keywords: ['home', 'main', 'root', 'dashboard', 'revenue', 'overview', 'kpi'],
      badge: 'Page',
    },
    {
      id: 'page-analytics',
      name: 'Analytics Curves & Heatmap',
      description: 'Dual-wave performance charts, weekly 7x6 activity heatmap, and volume velocity',
      category: 'Pages',
      icon: LineChart,
      path: '/#analytics',
      keywords: ['analytics', 'charts', 'heatmap', 'wave', 'trends', 'traffic', 'activity'],
      badge: 'Page',
    },
    {
      id: 'page-items',
      name: 'Items Directory',
      description: 'PostgreSQL CRUD resource table, item status filters, and inventory catalog',
      category: 'Pages',
      icon: Layers,
      path: '/items',
      keywords: ['items', 'crud', 'table', 'records', 'inventory', 'database', 'postgres'],
      badge: 'Page',
    },
    {
      id: 'page-admin',
      name: 'Admin Control Room',
      description: 'Role-based access matrix, security personnel directory, system health diagnostics',
      category: 'Pages',
      icon: Shield,
      path: '/admin',
      keywords: ['admin', 'users', 'roles', 'permissions', 'management', 'security', 'audit'],
      badge: 'Admin',
      adminOnly: true,
    },
    {
      id: 'page-profile',
      name: 'Profile & Clearance',
      description: 'Security credentials, device sessions, appearance settings, and user clearance',
      category: 'Pages',
      icon: UserCheck,
      path: '/profile',
      keywords: ['profile', 'account', 'user', 'settings', 'security', 'clearance', 'password'],
      badge: 'Page',
    },
    {
      id: 'page-login',
      name: 'Authentication Portal',
      description: 'Sign in with credentials via Laravel Sanctum bearer token handshake',
      category: 'Pages',
      icon: LogIn,
      path: '/login',
      keywords: ['login', 'signin', 'auth', 'token', 'access', 'sanctum'],
      badge: 'Auth',
    },
    {
      id: 'page-register',
      name: 'User Onboarding & Registration',
      description: 'Provision a new user account with role selection in PostgreSQL',
      category: 'Pages',
      icon: UserPlus,
      path: '/register',
      keywords: ['register', 'signup', 'create account', 'onboarding', 'new user'],
      badge: 'Auth',
    },

    // 2. Modules & Operations Category
    {
      id: 'module-new-item',
      name: 'Create New Entity / Item',
      description: 'Launch modal to persist a new entity record into the PostgreSQL database',
      category: 'Modules',
      icon: PlusCircle,
      path: '/items?action=new',
      keywords: ['create', 'new', 'add', 'item', 'entity', 'insert', 'plus'],
      badge: 'Action',
      shortcut: '⌘N',
    },
    {
      id: 'module-filter-progress',
      name: 'Filter: In-Progress Operations',
      description: 'View and manage operations currently undergoing active processing',
      category: 'Modules',
      icon: Clock,
      path: '/items?status=in_progress',
      keywords: ['filter', 'in progress', 'processing', 'active', 'operations'],
      badge: 'Filter',
    },
    {
      id: 'module-filter-completed',
      name: 'Filter: Completed Tasks',
      description: 'Inspect verified and completed operational items in the database',
      category: 'Modules',
      icon: CheckCircle2,
      path: '/items?status=completed',
      keywords: ['filter', 'completed', 'done', 'verified', 'success'],
      badge: 'Filter',
    },
    {
      id: 'module-filter-pending',
      name: 'Filter: Pending Verification',
      description: 'Review queued operational items awaiting review and confirmation',
      category: 'Modules',
      icon: AlertCircle,
      path: '/items?status=pending',
      keywords: ['filter', 'pending', 'queued', 'waiting', 'unverified'],
      badge: 'Filter',
    },
    {
      id: 'module-audit-logs',
      name: 'System Audit Ledger',
      description: 'Inspect live authorization attempts, administrative actions, and audit logs',
      category: 'Modules',
      icon: FileText,
      path: '/admin?tab=logs',
      keywords: ['audit', 'logs', 'ledger', 'history', 'events', 'security logs'],
      badge: 'Admin',
      adminOnly: true,
    },
    {
      id: 'module-sessions',
      name: 'Active Telemetry Sessions',
      description: 'Audit active device connections, IP addresses, and Sanctum tokens',
      category: 'Modules',
      icon: ShieldCheck,
      path: '/profile#sessions',
      keywords: ['sessions', 'devices', 'tokens', 'ip', 'connections', 'telemetry'],
      badge: 'Security',
    },
    {
      id: 'module-broadcast-studio',
      name: 'Real-time Broadcast Studio',
      description: 'Trigger mock multi-client event dispatch over Node.js Socket.io',
      category: 'Modules',
      icon: Radio,
      path: '/?broadcast=true',
      keywords: ['broadcast', 'socket', 'emitter', 'realtime', 'websocket', 'events'],
      badge: 'Socket',
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
      if (item.adminOnly && !isAdmin && user?.role !== 'manager') {
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
        base: 'bg-[#16161c] border border-white/[0.1] rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden mt-12 sm:mt-20 mx-4 max-w-2xl',
        backdrop: 'bg-black/75 backdrop-blur-md',
      }}
    >
      <ModalContent>
        <ModalBody className="p-0 gap-0">
          {/* 1. Header Search Input Bar */}
          <div className="flex items-center px-4 sm:px-6 py-4 border-b border-white/[0.08] bg-[#1a1a23] gap-3">
            <Search className="w-5 h-5 text-[#808090] shrink-0" />
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
              className="bg-transparent border-none outline-none text-white text-sm sm:text-base placeholder:text-[#606070] w-full font-sans leading-normal"
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
                className="p-1 rounded-lg text-[#808090] hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[10.5px] text-[#808090] font-mono select-none">
              ESC
            </kbd>
          </div>

          {/* 2. Filter Category Pills */}
          <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-white/[0.06] bg-[#141418] overflow-x-auto no-scrollbar">
            {['All', 'Pages', 'Modules', 'Functionality'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all select-none whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#808090] hover:text-white hover:bg-white/[0.05]'
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
                  <div className="px-3 py-1 text-[10.5px] font-bold text-[#707080] uppercase tracking-widest font-sans flex items-center justify-between">
                    <span>{group.category}</span>
                    <span className="text-[10px] font-mono text-[#606070]">{group.items.length}</span>
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
                            ? 'bg-white/[0.08] border-white/[0.12] text-white shadow-sm'
                            : 'border-transparent text-[#9090a0] hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#7042f4] text-white shadow-[0_0_12px_rgba(112,66,244,0.4)]'
                                : 'bg-white/[0.05] text-[#808090] group-hover:text-white group-hover:bg-white/[0.08]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.badge && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase leading-none ${
                                    item.badge === 'Admin'
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                      : item.badge === 'Action'
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                      : 'bg-white/[0.06] text-[#808090]'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#707080] truncate mt-0.5 group-hover:text-[#9090a0]">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Action / Enter Indicator */}
                        <div className="flex items-center gap-2 pl-3 shrink-0">
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#808090] font-mono">
                              {item.shortcut}
                            </kbd>
                          )}
                          {isSelected && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#c084fc] bg-[#7042f4]/15 border border-[#7042f4]/30 px-2 py-0.5 rounded-lg">
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
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto text-[#606070]">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">No results found</h4>
                  <p className="text-xs text-[#707080] mt-1 max-w-sm mx-auto">
                    No matching routes, modules, or actions found for &ldquo;{query}&rdquo;.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                  {['Dashboard', 'Items', 'Create Item', 'Admin', 'Theme'].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setQuery(hint)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-[#808090] hover:text-white transition-all"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Keyboard Shortcuts Footer */}
          <div className="border-t border-white/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between text-[11px] text-[#707080] bg-[#141418] select-none">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-[#808090]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-[#808090]">↓</kbd>
                <span className="ml-0.5 hidden sm:inline">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-[#808090]">↵</kbd>
                <span className="ml-0.5 hidden sm:inline">Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-[#808090]">ESC</kbd>
                <span className="ml-0.5 hidden sm:inline">Dismiss</span>
              </span>
            </div>

            <div className="text-[10.5px] font-mono text-[#606070]">
              {flattenedFilteredItems.length} options
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GlobalSearchModal;

