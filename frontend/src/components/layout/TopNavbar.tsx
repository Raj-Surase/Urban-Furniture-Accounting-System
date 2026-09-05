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

interface TopNavbarProps {
  onSearchClick?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onSearchClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Invoices', path: '/invoices' },
    { label: 'Sales', path: '/sales-orders' },
    { label: 'Purchases', path: '/purchase-orders' },
    { label: 'Products', path: '/products' },
    { label: 'Accounts', path: '/accounts' },
    { label: 'Reports', path: '/reports' },
    ...(user?.role === 'admin'
      ? [{ label: 'Admin', path: '/admin' }]
      : []),
  ];

  const isNavActive = (itemPath: string) => {
    if (itemPath === '/') {
      return location.pathname === '/' && !location.hash;
    }
    if (itemPath === '/#analytics') {
      return location.pathname === '/' && location.hash === '#analytics';
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <header className="sticky top-0 w-full py-3.5 px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between border-b border-white/[0.06] z-40 bg-[#121216]/90 backdrop-blur-xl">
      {/* Left: Brand Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <Logo />
      </Link>

      {/* Center: Docked Horizontal Pill Navigation (Desktop) */}
      <nav className="hidden md:flex items-center">
        <div className="bg-[#1c1c23] border border-white/[0.06] rounded-full p-1.5 flex items-center gap-1 shadow-inner">
          {navItems.map((item) => {
            const active = isNavActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`relative px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 select-none ${
                  active
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-[#9090a0] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activePillNav"
                    className="absolute inset-0 bg-white rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Right: Circular Action Buttons & Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Circular Button */}
        <button
          onClick={onSearchClick || (() => navigate('/items'))}
          className="w-10 h-10 rounded-full bg-[#1c1c23] hover:bg-[#252530] text-[#a0a0b0] hover:text-white flex items-center justify-center border border-white/[0.06] transition-all active:scale-95 shadow-sm"
          aria-label="Search"
          title="Search items and records"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Real-time Notification / Live Socket Signal */}
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
          className="w-10 h-10 rounded-full bg-[#1c1c23] hover:bg-[#252530] text-[#a0a0b0] hover:text-white flex items-center justify-center border border-white/[0.06] transition-all active:scale-95 shadow-sm"
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
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
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
            {user?.role === 'admin' ? (
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
          className="md:hidden w-10 h-10 rounded-full bg-[#1c1c23] text-[#a0a0b0] hover:text-white flex items-center justify-center border border-white/[0.06]"
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
            className="absolute top-full left-0 w-full bg-[#141418] border-b border-white/[0.08] p-4 flex flex-col gap-2 z-50 md:hidden shadow-2xl"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isNavActive(item.path)
                    ? 'bg-white text-black font-bold'
                    : 'text-[#9090a0] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default TopNavbar;
