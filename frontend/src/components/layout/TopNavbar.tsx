import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  User,
  Shield,
  LogOut,
  ChevronDown,
  UserPlus,
  ShoppingCart,
  ShoppingBag,
  BookOpen,
  BarChart3,
  FileText,
  CreditCard,
  Layers,
  PieChart,
  Scale,
  Users
} from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../common/Logo';
import { CreateUserModal } from '../admin/CreateUserModal';
import { UserRole } from '../../types';

interface TopNavbarProps {
  onSearchClick?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onSearchClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const isModuleActive = (paths: string[]) => {
    return paths.some((p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)));
  };

  return (
    <>
      <header className="sticky top-0 w-full py-3.5 px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between border-b border-white/[0.06] z-40 bg-[#121216]/90 backdrop-blur-xl">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <Logo />
        </Link>

        {/* Center: Desktop Navigation Groups matching Excalidraw */}
        <nav className="hidden lg:flex items-center">
          <div className="bg-[#1c1c23] border border-white/[0.06] rounded-full p-1.5 flex items-center gap-1 shadow-inner text-xs">
            {/* 1. Dashboard */}
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                location.pathname === '/'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Dashboard
            </Link>

            {/* 2. Sales Dropdown */}
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <button
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    isModuleActive(['/sales-orders', '/invoices']) || (location.pathname === '/payments' && location.search.includes('receive'))
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>Sales</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Sales Navigation"
                className="w-56 p-2 bg-[#18181f] border border-white/[0.08] rounded-2xl shadow-obsidian-card"
              >
                <DropdownItem
                  key="so"
                  startContent={<ShoppingCart className="w-4 h-4 text-[#7042f4]" />}
                  onPress={() => navigate('/sales-orders')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Sales order
                </DropdownItem>
                <DropdownItem
                  key="invoice"
                  startContent={<FileText className="w-4 h-4 text-emerald-400" />}
                  onPress={() => navigate('/invoices')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Sale Invoice
                </DropdownItem>
                <DropdownItem
                  key="receipt"
                  startContent={<CreditCard className="w-4 h-4 text-indigo-400" />}
                  onPress={() => navigate('/payments?type=receive')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Receipt (Customer Dues)
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* 3. Purchase Dropdown */}
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <button
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    isModuleActive(['/purchase-orders', '/bills']) || (location.pathname === '/payments' && !location.search.includes('receive'))
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>Purchase</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Purchase Navigation"
                className="w-56 p-2 bg-[#18181f] border border-white/[0.08] rounded-2xl shadow-obsidian-card"
              >
                <DropdownItem
                  key="po"
                  startContent={<ShoppingBag className="w-4 h-4 text-amber-400" />}
                  onPress={() => navigate('/purchase-orders')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Purchase Order
                </DropdownItem>
                <DropdownItem
                  key="bill"
                  startContent={<FileText className="w-4 h-4 text-rose-400" />}
                  onPress={() => navigate('/bills')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Purchase Bill (Vendor Bill)
                </DropdownItem>
                <DropdownItem
                  key="pay"
                  startContent={<CreditCard className="w-4 h-4 text-purple-400" />}
                  onPress={() => navigate('/payments?type=send')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Payment (Vendor Payments)
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* 4. Account Dropdown */}
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <button
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    isModuleActive(['/contacts', '/products', '/accounts', '/journals', '/journal', '/analyticals', '/budgets'])
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>Account</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Account Navigation"
                className="w-60 p-2 bg-[#18181f] border border-white/[0.08] rounded-2xl shadow-obsidian-card"
              >
                <DropdownItem
                  key="contacts"
                  startContent={<Users className="w-4 h-4 text-sky-400" />}
                  onPress={() => navigate('/contacts')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Contact (Partner Master)
                </DropdownItem>
                <DropdownItem
                  key="products"
                  startContent={<BookOpen className="w-4 h-4 text-indigo-400" />}
                  onPress={() => navigate('/products')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Product (Products & Services)
                </DropdownItem>
                <DropdownItem
                  key="coa"
                  startContent={<Scale className="w-4 h-4 text-emerald-400" />}
                  onPress={() => navigate('/accounts')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Chart of Account
                </DropdownItem>
                <DropdownItem
                  key="journals"
                  startContent={<BookOpen className="w-4 h-4 text-amber-400" />}
                  onPress={() => navigate('/journals')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Journals
                </DropdownItem>
                <DropdownItem
                  key="je"
                  startContent={<FileText className="w-4 h-4 text-rose-400" />}
                  onPress={() => navigate('/journal')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Journal Entries
                </DropdownItem>
                <DropdownItem
                  key="analyticals"
                  startContent={<Layers className="w-4 h-4 text-teal-400" />}
                  onPress={() => navigate('/analyticals')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Analyticals (Cost Centers)
                </DropdownItem>
                <DropdownItem
                  key="budgets"
                  startContent={<PieChart className="w-4 h-4 text-purple-400" />}
                  onPress={() => navigate('/budgets')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Analytical Budget
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* 5. Report Dropdown */}
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <button
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    isModuleActive(['/reports'])
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>Report</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Report Navigation"
                className="w-56 p-2 bg-[#18181f] border border-white/[0.08] rounded-2xl shadow-obsidian-card"
              >
                <DropdownItem
                  key="bs"
                  startContent={<Scale className="w-4 h-4 text-indigo-400" />}
                  onPress={() => navigate('/reports/balance-sheet')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Balancesheet
                </DropdownItem>
                <DropdownItem
                  key="pnl"
                  startContent={<BarChart3 className="w-4 h-4 text-emerald-400" />}
                  onPress={() => navigate('/reports/profit-loss')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Profit and Loss
                </DropdownItem>
                <DropdownItem
                  key="budget-rep"
                  startContent={<PieChart className="w-4 h-4 text-purple-400" />}
                  onPress={() => navigate('/reports/budget')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
                >
                  Budget Report
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* Portal link for customer users */}
            {user?.role === UserRole.USER && (
              <Link
                to="/portal"
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                  location.pathname === '/portal'
                    ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.05]'
                }`}
              >
                Client Portal
              </Link>
            )}

            {/* Admin control room */}
            {user?.role === UserRole.ADMIN && (
              <Link
                to="/admin"
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                  location.pathname === '/admin'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-[#c084fc] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
        </nav>

        {/* Right: Circular Action Buttons & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Admin "Create User" Wireframe Button */}
          {user?.role === UserRole.ADMIN && (
            <button
              onClick={() => setCreateUserModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7042f4]/15 hover:bg-[#7042f4]/25 text-[#c084fc] hover:text-white border border-[#7042f4]/40 text-xs font-semibold transition-all cursor-pointer"
              title="Create User (Excalidraw Wireframe)"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          )}

          {/* Search Button */}
          <button
            onClick={onSearchClick || (() => navigate('/products'))}
            className="w-10 h-10 rounded-full bg-[#1c1c23] hover:bg-[#252530] text-[#a0a0b0] hover:text-white flex items-center justify-center border border-white/[0.06] transition-all active:scale-95 shadow-sm cursor-pointer"
            aria-label="Search"
            title="Search products and records"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Live Socket Signal */}
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full bg-[#1c1c23] hover:bg-[#252530] text-[#a0a0b0] hover:text-white flex items-center justify-center border border-white/[0.06] transition-all active:scale-95 shadow-sm"
              aria-label="Notifications"
              title={isConnected ? 'Real-time WebSocket Live' : 'WebSocket Reconnecting...'}
            >
              <Bell className="w-4 h-4" />
              <span
                className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
            </button>
          </div>

          {/* Theme Mode Toggle Circle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[#1c1c23] hover:bg-[#252530] text-[#a0a0b0] hover:text-white flex items-center justify-center border border-white/[0.06] transition-all active:scale-95 shadow-sm cursor-pointer"
            aria-label="Toggle theme"
            title={`Theme: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'}`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* User Profile Avatar with Dropdown */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-gradient-to-tr from-[#7042f4] to-[#c084fc] flex items-center justify-center text-white font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#7042f4]/50 transition-all cursor-pointer">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'UF'}
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="User Profile Actions"
              className="w-64 p-2 bg-[#18181f] border border-white/[0.08] rounded-2xl shadow-obsidian-card text-foreground"
            >
              <DropdownItem key="profile-header" className="h-14 gap-2 cursor-default" textValue="Profile Info">
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">{user?.name || 'Urban Furniture User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</span>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30">
                      {user?.role || 'user'} clearance
                    </span>
                  </div>
                </div>
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<User className="w-4 h-4 text-muted-foreground" />}
                onPress={() => navigate('/profile')}
                className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
              >
                Profile & Clearance
              </DropdownItem>
              {user?.role === UserRole.ADMIN ? (
                <DropdownItem
                  key="admin"
                  startContent={<Shield className="w-4 h-4 text-[#7042f4]" />}
                  onPress={() => navigate('/admin')}
                  className="rounded-xl text-xs py-2 hover:bg-white/[0.05]"
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
                className="rounded-xl text-xs py-2 text-rose-400 hover:bg-rose-500/10"
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-full bg-[#1c1c23] text-[#a0a0b0] hover:text-white flex items-center justify-center border border-white/[0.06]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full bg-[#15151a] border-b border-white/[0.08] p-5 shadow-2xl flex flex-col gap-4 lg:hidden z-50 text-xs"
            >
              <div className="space-y-3">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block font-bold text-white py-1"
                >
                  Dashboard
                </Link>

                {/* Sales Section */}
                <div className="border-t border-white/[0.06] pt-2">
                  <span className="text-[#7042f4] font-bold uppercase tracking-wider text-[10px] block mb-1">
                    Sales
                  </span>
                  <div className="pl-2 space-y-1">
                    <Link to="/sales-orders" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Sales order</Link>
                    <Link to="/invoices" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Sale Invoice</Link>
                    <Link to="/payments?type=receive" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Receipt</Link>
                  </div>
                </div>

                {/* Purchase Section */}
                <div className="border-t border-white/[0.06] pt-2">
                  <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                    Purchase
                  </span>
                  <div className="pl-2 space-y-1">
                    <Link to="/purchase-orders" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Purchase Order</Link>
                    <Link to="/bills" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Purchase Bill (Vendor Bill)</Link>
                    <Link to="/payments?type=send" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Payment</Link>
                  </div>
                </div>

                {/* Account Section */}
                <div className="border-t border-white/[0.06] pt-2">
                  <span className="text-sky-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                    Account Masters
                  </span>
                  <div className="pl-2 space-y-1">
                    <Link to="/contacts" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Contact</Link>
                    <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Product</Link>
                    <Link to="/accounts" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Chart of Account</Link>
                    <Link to="/journals" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Journals</Link>
                    <Link to="/journal" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Journal Entries</Link>
                    <Link to="/analyticals" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Analyticals</Link>
                    <Link to="/budgets" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Analytical Budget</Link>
                  </div>
                </div>

                {/* Report Section */}
                <div className="border-t border-white/[0.06] pt-2">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                    Reports
                  </span>
                  <div className="pl-2 space-y-1">
                    <Link to="/reports/balance-sheet" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Balancesheet</Link>
                    <Link to="/reports/profit-loss" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Profit and Loss</Link>
                    <Link to="/reports/budget" onClick={() => setMobileMenuOpen(false)} className="block text-[#a0a0b0] hover:text-white py-0.5">Budget Report</Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Admin Create User Modal */}
      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
      />
    </>
  );
};
