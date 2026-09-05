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
  FileSpreadsheet,
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
  const { user, isAdmin, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isAccountantOrAdmin = isAdmin || user?.role === UserRole.MANAGER || user?.role === UserRole.ACCOUNTANT;

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
            { name: 'Reports Hub', path: '/reports', icon: FileSpreadsheet },
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
    : [
        {
          id: 'overview',
          category: 'Workspace & Catalog',
          items: [
            { name: 'Dashboard', path: '/', icon: LayoutDashboard },
            { name: 'Furniture Catalog', path: '/products', icon: Store },
            { name: '3D Workshop', path: '/workshop', icon: Package },
            { name: 'Customer Portal', path: '/portal', icon: Globe },
          ],
        },
        {
          id: 'my_activity',
          category: 'My Orders & Invoices',
          items: [
            { name: 'My Sales Orders', path: '/sales-orders', icon: Truck },
            { name: 'My Purchase Orders', path: '/purchase-orders', icon: ShoppingBag },
            { name: 'My Invoices', path: '/invoices', icon: FileText },
            { name: 'Workshop Items', path: '/items', icon: Layers },
          ],
        },
        {
          id: 'operations',
          category: 'Operations & Directory',
          items: [
            { name: 'Customer Directory', path: '/customers', icon: Users },
            { name: 'Vendor Directory', path: '/vendors', icon: Truck },
            { name: 'Vendor Bills', path: '/bills', icon: Receipt },
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
    // Prevent reports hub from staying active on deep sub-reports
    if (path === '/reports') {
      return location.pathname === '/reports';
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
    <div className="flex flex-col h-full text-white select-none bg-[#141418]">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 border-b border-white/[0.06] w-full shrink-0 px-6 bg-[#121216]">
        <Link to="/" onClick={onClose} className="flex items-center group">
          <Logo className="transition-transform duration-200 group-hover:scale-[1.02]" />
        </Link>
        <button
          onClick={onClose}
          className="p-1.5 -mr-1 rounded-lg text-[#808090] hover:text-white hover:bg-white/[0.06] md:hidden transition-colors"
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
                className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-[10.5px] font-bold tracking-wider text-[#808090] uppercase hover:text-white hover:bg-white/[0.03] transition-colors group/header font-sans"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="truncate">{group.category}</span>
                  {group.badge && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/[0.06] text-[#a0a0b0] border border-white/10 normal-case tracking-normal">
                      {group.badge}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-[#606070] transition-transform duration-200 group-hover/header:text-white shrink-0 ml-1',
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
                            ? 'bg-white text-black font-semibold shadow-sm'
                            : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
                        )}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              active ? 'text-black' : 'text-[#808090] group-hover:text-white'
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
                                    ? 'bg-black/10 text-black border-black/20'
                                    : item.badgeColor || 'bg-white/[0.06] text-[#808090] border-white/10'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
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
      <div className="p-3.5 mt-auto shrink-0 border-t border-white/[0.06] bg-[#121216]/60">
        <div className="p-3 rounded-2xl border border-white/[0.06] bg-[#18181f] flex items-center justify-between">
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
                  'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#18181f]',
                  isConnected ? 'bg-emerald-400' : 'bg-rose-500'
                )}
                title={isConnected ? 'WebSocket Online' : 'Offline'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white font-sans leading-none truncate group-hover:text-[#c084fc] transition-colors">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`inline-block text-[9.5px] font-bold uppercase tracking-wider leading-none px-1.5 py-0.5 rounded border ${
                    user?.role === UserRole.ADMIN
                      ? 'bg-[#7042f4]/20 text-[#c084fc] border-[#7042f4]/30'
                      : user?.role === UserRole.MANAGER
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-white/[0.06] text-[#808090] border-white/10'
                  }`}
                >
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>
          </Link>

          <button
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#808090] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 active:scale-95 ml-1"
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#141418] text-white border-r border-white/[0.06] flex flex-col transition-transform duration-300 md:hidden shadow-2xl',
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
      <aside className="fixed left-0 top-0 bottom-0 w-64 z-40 hidden md:flex flex-col bg-[#141418] text-white border-r border-white/[0.06] select-none">
        {renderSidebarContent()}
      </aside>
    </>
  );
};
