import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Shield,
  UserCheck,
  User,
  LogOut,
  FileText,
  ShoppingBag,
  Truck,
  BookOpen,
  CreditCard,
  Users,
  Store,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Contact,
  ScrollText,
  FolderTree,
  Calculator,
  PieChart,
  BarChart3,
  TrendingUp,
  Package,
  Globe,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Logo } from '../common/Logo';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface MenuGroup {
  id: string;
  category: string;
  badge?: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, isCustomer, isVendor, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isAccountantOrAdmin = isAdmin || user?.role === UserRole.MANAGER || user?.role === UserRole.ACCOUNTANT;

  let nonElevatedMenuGroups: MenuGroup[] = [];

  if (isCustomer || user?.role === UserRole.CUSTOMER) {
    nonElevatedMenuGroups = [
      {
        id: 'overview',
        category: 'Client Studio & Catalog',
        items: [
          { name: 'Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Furniture Catalog', path: '/products', icon: Store },
          { name: '3D Workshop', path: '/workshop', icon: Package },
          { name: 'Customer Portal', path: '/portal', icon: Globe },
        ],
      },
      {
        id: 'my_activity',
        category: 'Orders & Documents',
        items: [
          { name: 'My Sales Orders', path: '/sales-orders', icon: Truck },
          { name: 'My Invoices', path: '/invoices', icon: FileText },
          { name: 'Payment Receipts', path: '/payments', icon: ArrowDownLeft },
          { name: 'Workshop Items', path: '/items', icon: Layers },
        ],
      },
      {
        id: 'account',
        category: 'My Account',
        items: [
          { name: 'My Customer Profile', path: '/customers', icon: Users },
          { name: 'Profile & Clearance', path: '/profile', icon: UserCheck },
        ],
      },
    ];
  } else if (isVendor || user?.role === UserRole.VENDOR) {
    nonElevatedMenuGroups = [
      {
        id: 'overview',
        category: 'Vendor Workspace',
        items: [
          { name: 'Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Furniture Catalog', path: '/products', icon: Store },
          { name: '3D Workshop', path: '/workshop', icon: Package },
        ],
      },
      {
        id: 'my_activity',
        category: 'Procurement & Bills',
        items: [
          { name: 'My Purchase Orders', path: '/purchase-orders', icon: ShoppingBag },
          { name: 'My Vendor Bills', path: '/bills', icon: Receipt },
          { name: 'Settlement Payments', path: '/payments', icon: ArrowUpRight },
          { name: 'Workshop Items', path: '/items', icon: Layers },
        ],
      },
      {
        id: 'account',
        category: 'My Account',
        items: [
          { name: 'My Vendor Profile', path: '/vendors', icon: Truck },
          { name: 'Profile & Clearance', path: '/profile', icon: UserCheck },
        ],
      },
    ];
  } else {
    // Standard User (Staff)
    nonElevatedMenuGroups = [
      {
        id: 'overview',
        category: 'Workspace & Catalog',
        items: [
          { name: 'Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Furniture Catalog', path: '/products', icon: Store },
          { name: '3D Workshop', path: '/workshop', icon: Package },
          { name: 'Customer Portal', path: '/portal', icon: Globe },
          { name: 'Operations Tracker', path: '/items', icon: Layers },
        ],
      },
      {
        id: 'my_activity',
        category: 'My Orders & Invoices',
        items: [
          { name: 'My Sales Orders', path: '/sales-orders', icon: Truck },
          { name: 'My Purchase Orders', path: '/purchase-orders', icon: ShoppingBag },
          { name: 'Invoices & Bills', path: '/invoices', icon: FileText },
        ],
      },
      {
        id: 'operations',
        category: 'Partner Records',
        items: [
          { name: 'My Customer Profile', path: '/customers', icon: Users },
          { name: 'My Vendor Profile', path: '/vendors', icon: Truck },
          { name: 'My Bills', path: '/bills', icon: Receipt },
          { name: 'Payments & Receipts', path: '/payments', icon: ArrowDownLeft },
        ],
      },
      {
        id: 'system',
        category: 'My Account',
        items: [
          { name: 'Profile & Clearance', path: '/profile', icon: UserCheck },
        ],
      },
    ];
  }

  const menuGroups: MenuGroup[] = isAccountantOrAdmin
    ? [
        {
          id: 'overview',
          category: 'Overview & Studio',
          items: [
            { name: 'Dashboard', path: '/', icon: LayoutDashboard },
            { name: '3D Workshop Studio', path: '/workshop', icon: Package },
            { name: 'Customer Portal', path: '/portal', icon: Globe },
            { name: 'Operations Tracker', path: '/items', icon: Layers },
          ],
        },
        {
          id: 'sales',
          category: 'Sales',
          items: [
            { name: 'Sales order', path: '/sales-orders', icon: Truck },
            { name: 'Sale Invoice', path: '/invoices', icon: FileText },
            { name: 'Receipt', path: '/payments?type=receive', icon: ArrowDownLeft },
            { name: 'Customer Directory', path: '/customers', icon: Users },
          ],
        },
        {
          id: 'purchase',
          category: 'Purchase',
          items: [
            { name: 'Purchase Order', path: '/purchase-orders', icon: ShoppingBag },
            { name: 'Purchase Bill (Vendor Bill)', path: '/bills', icon: Receipt },
            { name: 'Payment (Vendor Payment)', path: '/payments?type=send', icon: ArrowUpRight },
            { name: 'Vendor Directory', path: '/vendors', icon: Truck },
          ],
        },
        {
          id: 'master',
          category: 'Account (Master Data)',
          items: [
            { name: 'Contact Master', path: '/contacts', icon: Contact },
            { name: 'Product Master', path: '/products', icon: Store },
            { name: 'Chart of Account', path: '/accounts', icon: BookOpen },
            { name: 'Journals', path: '/journals', icon: ScrollText },
            { name: 'Journal Entries', path: '/journal', icon: Layers },
            { name: 'Analyticals', path: '/analyticals', icon: FolderTree },
            { name: 'Analytical Budget', path: '/budgets', icon: Calculator },
          ],
        },
        {
          id: 'reports',
          category: 'Report',
          items: [
            { name: 'Balancesheet', path: '/reports/balance-sheet', icon: BarChart3 },
            { name: 'Profit and Loss', path: '/reports/profit-loss', icon: TrendingUp },
            { name: 'Budget Report', path: '/reports/budget', icon: PieChart },
          ],
        },
        {
          id: 'system',
          category: 'System & Security',
          items: [
            ...(isAdmin
              ? [
                  {
                    name: 'Admin Console',
                    path: '/admin',
                    icon: Shield,
                  },
                ]
              : []),
            { name: 'Profile & Clearance', path: '/profile', icon: UserCheck },
          ],
        },
      ]
    : nonElevatedMenuGroups;


  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [base, query] = path.split('?');
      const params = new URLSearchParams(query);
      const locParams = new URLSearchParams(location.search);
      if (location.pathname !== base) return false;
      for (const [key, val] of params.entries()) {
        if (locParams.get(key) !== val) return false;
      }
      return true;
    }
    if (path === '/') {
      return location.pathname === '/' && !location.hash && !location.search;
    }
    // Prevent generic payments link from highlighting when sub-types are active
    if (path === '/payments' && (location.search.includes('type=receive') || location.search.includes('type=send'))) {
      return false;
    }
    return location.pathname === path || (location.pathname.startsWith(path + '/') && path !== '/');
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some((item) => isActive(item.path));
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full select-none bg-sidebar text-sidebar-foreground">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 border-b border-sidebar-border w-full shrink-0 px-6 bg-sidebar">
        <Link to="/" onClick={onClose} className="flex items-center group">
          <Logo className="transition-transform duration-200 group-hover:scale-[1.02]" />
        </Link>
        <button
          onClick={onClose}
          className="p-1.5 -mr-1 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent md:hidden transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Navigation */}
      <nav ref={navRef} className="flex-1 overflow-y-auto space-y-4 py-4 px-3.5 no-scrollbar">
        {menuGroups.map((group) => {
          const groupActive = isGroupActive(group);
          // If the group contains active route, keep it expanded
          const isCollapsed = Boolean(collapsedGroups[group.id] && !groupActive);

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-[10.5px] font-bold tracking-wider text-slate-400 dark:text-sidebar-foreground/60 uppercase hover:text-slate-700 hover:bg-slate-100/60 dark:hover:text-sidebar-foreground dark:hover:bg-sidebar-accent/50 transition-colors group/header font-sans"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="truncate">{group.category}</span>
                  {group.badge && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-sidebar-accent text-slate-600 dark:text-sidebar-foreground/80 border border-slate-200 dark:border-sidebar-border normal-case tracking-normal">
                      {group.badge}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-slate-400 dark:text-sidebar-foreground/50 transition-transform duration-200 group-hover/header:text-slate-700 dark:group-hover/header:text-sidebar-foreground shrink-0 ml-1',
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  )}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 pt-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          'relative flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-xs font-medium',
                          active
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-sidebar-foreground/70 dark:hover:text-sidebar-foreground dark:hover:bg-sidebar-accent'
                        )}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              active
                                ? 'text-white dark:text-black'
                                : 'text-slate-500 group-hover:text-slate-900 dark:text-sidebar-foreground/60 dark:group-hover:text-sidebar-foreground'
                            )}
                          />
                          <span className="tracking-tight truncate">{item.name}</span>
                        </div>

                        {(item.badge || active) && (
                          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                            {item.badge && (
                              <span
                                className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded border',
                                  active
                                    ? 'bg-white/20 text-white border-white/30 dark:bg-black/10 dark:text-black dark:border-black/20'
                                    : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-sidebar-accent dark:text-sidebar-foreground/70 dark:border-sidebar-border'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black shrink-0" />
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Profile Card */}
      <div className="p-3.5 mt-auto shrink-0 border-t border-sidebar-border bg-sidebar">
        <div className="p-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 flex items-center justify-between">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center space-x-3 min-w-0 flex-1 group"
          >
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#7042f4] to-[#c084fc] flex items-center justify-center shrink-0 text-white font-bold text-xs uppercase shadow-sm">
                {user?.name ? user.name.charAt(0) : <User className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar',
                  isConnected ? 'bg-emerald-400' : 'bg-rose-500'
                )}
                title={isConnected ? 'WebSocket Online' : 'Offline'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-sidebar-foreground font-sans leading-none truncate group-hover:text-primary transition-colors">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`inline-block text-[9.5px] font-bold uppercase tracking-wider leading-none px-1.5 py-0.5 rounded border ${
                    user?.role === UserRole.ADMIN
                      ? 'bg-[#7042f4]/15 text-[#7042f4] dark:text-[#c084fc] border-[#7042f4]/30'
                      : user?.role === UserRole.MANAGER
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-sidebar-accent text-sidebar-foreground/70 border-sidebar-border'
                  }`}
                >
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>
          </Link>

          <button
            className="h-8 w-8 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 active:scale-95 ml-1 cursor-pointer"
            onClick={() => {
              onClose();
              logout();
            }}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform duration-300 md:hidden shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 z-40 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none">
        {renderSidebarContent()}
      </aside>
    </>
  );
};
