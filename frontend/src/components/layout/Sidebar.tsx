import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Logo } from '../common/Logo';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  const isAccountantOrAdmin = isAdmin || user?.role === 'manager';

  const menuGroups = [
    {
      category: 'Overview',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        ...(isAccountantOrAdmin ? [{ name: 'Financial & GST Reports', path: '/reports', icon: FileSpreadsheet }] : []),
      ],
    },
    {
      category: 'Accounting & Treasury',
      items: [
        { name: 'Invoices & Bills (GST)', path: '/invoices', icon: FileText },
        { name: 'Payments & Treasury', path: '/payments', icon: CreditCard },
        ...(isAccountantOrAdmin ? [{ name: 'Chart of Accounts', path: '/accounts', icon: BookOpen }] : []),
        ...(isAccountantOrAdmin ? [{ name: 'General Ledger Journal', path: '/journal', icon: Layers }] : []),
      ],
    },
    {
      category: 'Sales & Purchasing',
      items: [
        { name: 'Sales Orders', path: '/sales-orders', icon: Truck },
        { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingBag },
        { name: 'Products & Inventory', path: '/products', icon: Store },
        { name: 'Customer Directory', path: '/customers', icon: Users },
        { name: 'Vendor Directory', path: '/vendors', icon: Truck },
      ],
    },
    {
      category: 'System & Governance',
      items: [
        ...(isAdmin ? [{ name: 'Admin Console', path: '/admin', icon: Shield }] : []),
        { name: 'Profile & Clearance', path: '/profile', icon: UserCheck },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' && !location.hash;
    }
    if (path === '/#analytics') {
      return location.pathname === '/' && location.hash === '#analytics';
    }
    return location.pathname.startsWith(path);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full text-white select-none bg-[#141418]">
      {/* Brand Header */}
      <div className="flex items-center h-16 border-b border-white/[0.06] w-full shrink-0 px-6 bg-[#121216]">
        <Link to="/" onClick={onClose} className="flex items-center w-full group">
          <Logo className="transition-transform duration-200 group-hover:scale-[1.02]" />
        </Link>
      </div>

      {/* Menu Navigation */}
      <nav ref={navRef} className="flex-1 overflow-y-auto space-y-5 py-6 px-3.5 no-scrollbar">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            {group.category && (
              <h3 className="px-3 text-[10.5px] font-bold tracking-widest text-[#808090] uppercase pb-1 font-sans">
                {group.category}
              </h3>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-xs font-medium',
                    active
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-black' : 'text-[#808090] group-hover:text-white'
                      )}
                    />
                    <span className="tracking-tight truncate">{item.name}</span>
                  </div>

                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
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
                    user?.role === 'admin'
                      ? 'bg-[#7042f4]/20 text-[#c084fc] border-[#7042f4]/30'
                      : user?.role === 'manager'
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
