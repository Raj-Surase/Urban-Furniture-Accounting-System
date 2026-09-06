import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Menu, Search, User, Shield, LogOut } from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onSearchClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { user, logout, login } = useAuth();
  const { toast } = useToast();

  const handleQuickSwitchRole = async (targetEmail: string, roleName: string) => {
    try {
      await login({ email: targetEmail, password: 'password' });
      toast.success(`Active session switched to ${roleName}!`);
      window.dispatchEvent(new CustomEvent('auth:role-updated'));

      const targetRole = targetEmail.includes(UserRole.ADMIN) ? UserRole.ADMIN : targetEmail.includes(UserRole.MANAGER) ? UserRole.MANAGER : UserRole.USER;
      if (targetRole === UserRole.USER && ['/admin', '/accounts', '/journal', '/reports'].includes(location.pathname)) {
        navigate('/invoices');
      } else if (targetRole === UserRole.MANAGER && location.pathname === '/admin') {
        navigate('/');
      }
    } catch {
      toast.error(`Failed to switch to ${roleName}`);
    }
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Urban Furniture', path: '/' }];

    let currentPath = '';
    parts.forEach((part) => {
      currentPath += `/${part}`;
      let name = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
      if (part === 'invoices') name = 'Sale Invoice';
      if (part === 'bills') name = 'Purchase Bill (Vendor Bill)';
      if (part === 'purchase-orders') name = 'Purchase Order';
      if (part === 'sales-orders') name = 'Sales order';
      if (part === 'products') name = 'Product Master';
      if (part === 'contacts') name = 'Contact Master';
      if (part === 'accounts') name = 'Chart of Account';
      if (part === 'journals') name = 'Journals';
      if (part === 'journal') name = 'Journal Entries';
      if (part === 'analyticals') name = 'Analyticals';
      if (part === 'budgets') name = 'Analytical Budget';
      if (part === 'payments') {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('type') === 'receive') name = 'Receipt (Customer Inflows)';
        else if (searchParams.get('type') === 'send') name = 'Payment (Vendor Outflows)';
        else name = 'Payments & Receipts';
      }
      if (part === 'customers') name = 'Customer Directory';
      if (part === 'vendors') name = 'Vendor Directory';
      if (part === 'reports') name = 'Report';
      if (part === 'profit-loss') name = 'Profit and Loss';
      if (part === 'balance-sheet') name = 'Balancesheet';
      if (part === 'budget') name = 'Budget Report';
      if (part === 'portal') name = 'Customer Invoice Portal';
      if (part === 'workshop' || part === 'studio') name = '3D Workshop Studio';
      if (part === 'items') name = 'Operations Tracker';
      if (part === 'admin') name = 'Admin Console';
      if (part === 'profile') name = 'Profile & Clearance';
      if (part === 'forbidden') name = 'Access Denied';
      breadcrumbs.push({ name, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-card/90 dark:bg-[#121216]/90 backdrop-blur-xl border-b border-border dark:border-white/[0.06] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left side: Hamburger & Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-xl text-foreground/70 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/[0.06] md:hidden transition-colors active:scale-95"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center space-x-1.5 text-xs sm:text-sm text-muted-foreground dark:text-[#808090] font-sans select-none truncate">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path}>
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 dark:text-white/20 shrink-0" />}
                {isLast ? (
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[250px] px-2.5 py-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.06] rounded-lg shadow-xs">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="hover:text-foreground dark:hover:text-white hover:bg-muted/40 dark:hover:bg-white/[0.04] px-2 py-1 rounded-lg transition-colors truncate font-medium"
                  >
                    {crumb.name}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right side: Search, Realtime Status, Theme & User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Prominent Header Search Bar with Hotkey */}
        <button
          data-search-trigger="true"
          onClick={onSearchClick}
          className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-[#18181f] dark:hover:bg-[#202028] text-slate-600 hover:text-slate-900 dark:text-[#808090] dark:hover:text-white border border-slate-200 dark:border-white/[0.08] dark:hover:border-white/20 text-xs transition-all active:scale-[0.98] w-40 sm:w-60 md:w-72 lg:w-80 group shadow-xs select-none"
          aria-label="Search pages and modules"
          title="Press ⌘K or Ctrl+K to search"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#808090] group-hover:text-slate-700 dark:group-hover:text-white transition-colors shrink-0" />
            <span className="truncate text-xs text-slate-500 group-hover:text-slate-800 dark:text-[#707080] dark:group-hover:text-[#9090a0]">
              Search accounting records, products, invoices...
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-[10px] text-slate-500 dark:text-[#808090] font-mono group-hover:text-slate-700 dark:group-hover:text-white transition-all">
              ⌘K
            </kbd>
          </div>
        </button>

        {/* Quick Demo Role Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-[#18181f] p-1 rounded-full border border-slate-200 dark:border-white/[0.06] text-xs shadow-xs">
          <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground dark:text-[#808090] pl-2 pr-1">Actor:</span>
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('admin@example.com', 'Admin (Business Owner)')}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
              user?.role === UserRole.ADMIN
                ? 'bg-[#7042f4] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground dark:text-[#808090] dark:hover:text-white'
            }`}
            title="Admin (Business Owner) - Full system rights"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('manager@example.com', 'Invoicing User (Accountant)')}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
              user?.role === UserRole.MANAGER
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground dark:text-[#808090] dark:hover:text-white'
            }`}
            title="Invoicing User (Accountant) - Master data, transactions, reports"
          >
            Accountant
          </button>
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('user@example.com', 'Contact User (Customer/Vendor)')}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
              user?.role === UserRole.USER
                ? 'bg-emerald-500 text-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground dark:text-[#808090] dark:hover:text-white'
            }`}
            title="Contact User - View invoices/bills and register payments"
          >
            Contact
          </button>
        </div>

        {/* Realtime Live Socket Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border border-border dark:border-white/[0.06] bg-muted/50 dark:bg-[#1c1c23] transition-colors ${
            isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
          title={isConnected ? 'WebSocket Realtime Connected' : 'WebSocket Disconnected'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline text-xs font-semibold">
            {isConnected ? 'Socket Live' : 'Offline'}
          </span>
        </div>

        {/* Theme Mode Toggle */}
        <ThemeToggle />

        {/* User Profile Avatar Dropdown */}
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button className="relative w-9 h-9 rounded-full overflow-hidden border border-border dark:border-white/10 bg-gradient-to-tr from-[#7042f4] to-[#c084fc] flex items-center justify-center text-white font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#7042f4]/50 transition-all cursor-pointer">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="User Actions"
            variant="flat"
            className="w-64 p-2 bg-card dark:bg-[#18181f] border border-border dark:border-white/[0.08] rounded-2xl shadow-2xl text-foreground"
          >
            <DropdownItem key="profile-header" className="h-14 gap-2 cursor-default" textValue="Profile Info">
              <div className="flex flex-col">
                <p className="font-bold text-xs text-foreground dark:text-white">{user?.name || 'Authorized User'}</p>
                <p className="text-[11px] text-muted-foreground dark:text-[#808090] truncate">{user?.email || 'user@example.com'}</p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      user?.role === UserRole.ADMIN
                        ? 'bg-[#7042f4]/20 text-[#7042f4] dark:text-[#c084fc] border-[#7042f4]/30'
                        : user?.role === UserRole.MANAGER
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {user?.role ? `${user.role} clearance` : 'Guest'}
                  </span>
                </div>
              </div>
            </DropdownItem>
            <DropdownItem
              key="settings"
              startContent={<User className="w-4 h-4 text-muted-foreground dark:text-[#808090]" />}
              onPress={() => navigate('/profile')}
              className="rounded-xl text-xs py-2 hover:bg-muted/60 dark:hover:bg-white/[0.05]"
            >
              Profile & Clearance
            </DropdownItem>
            {user?.role === UserRole.ADMIN ? (
              <DropdownItem
                key="admin"
                startContent={<Shield className="w-4 h-4 text-[#7042f4]" />}
                onPress={() => navigate('/admin')}
                className="rounded-xl text-xs py-2 hover:bg-muted/60 dark:hover:bg-white/[0.05]"
              >
                Admin Control Room
              </DropdownItem>
            ) : null}
            <DropdownItem
              key="logout"
              color="danger"
              startContent={<LogOut className="w-4 h-4 text-rose-500" />}
              onPress={async () => {
                await logout();
                navigate('/login');
              }}
              className="rounded-xl text-xs py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            >
              Sign Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  );
};
