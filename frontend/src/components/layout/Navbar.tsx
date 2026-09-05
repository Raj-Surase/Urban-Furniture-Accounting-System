import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Chip,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Layers,
  LogOut,
  Shield,
  LayoutDashboard,
  Database,
  UserCheck,
  Radio,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <HeroNavbar
      maxWidth="xl"
      isBordered
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className="bg-background/80 dark:bg-background/80 backdrop-blur-xl sticky top-0 z-40 border-b border-default-200/80 dark:border-default-100/80 transition-colors"
      classNames={{
        wrapper: 'px-4 sm:px-6',
      }}
    >
      {/* Mobile Menu Toggle button */}
      {isAuthenticated && (
        <NavbarContent className="md:hidden" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="text-foreground"
          />
        </NavbarContent>
      )}

      {/* Brand Logo & Title */}
      <NavbarBrand className="gap-2.5">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-foreground group"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-secondary">
              OdooHack26
            </span>
          </div>
        </Link>
      </NavbarBrand>

      {/* Desktop Navigation Links */}
      {isAuthenticated && (
        <NavbarContent className="hidden md:flex gap-2" justify="center">
          <NavbarItem isActive={isActive('/')}>
            <Link
              to="/"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                isActive('/')
                  ? 'text-primary bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                  : 'text-default-600 hover:text-foreground hover:bg-default-100/80'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </NavbarItem>

          <NavbarItem isActive={isActive('/items')}>
            <Link
              to="/items"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                isActive('/items')
                  ? 'text-primary bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                  : 'text-default-600 hover:text-foreground hover:bg-default-100/80'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Items CRUD
            </Link>
          </NavbarItem>

          {isAdmin && (
            <NavbarItem isActive={isActive('/admin')}>
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  isActive('/admin')
                    ? 'text-secondary bg-secondary-50 dark:bg-secondary-900/30 shadow-sm'
                    : 'text-default-600 hover:text-foreground hover:bg-default-100/80'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-secondary" />
                Admin Console
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>
      )}

      {/* Right Section: Realtime Badge, Theme Toggle & User Avatar */}
      <NavbarContent justify="end" className="gap-2 sm:gap-3">
        {/* Realtime Live Socket Indicator */}
        <NavbarItem className="hidden sm:flex">
          <Chip
            size="sm"
            color={isConnected ? 'success' : 'danger'}
            variant="flat"
            startContent={
              <span
                className={`w-2 h-2 rounded-full ml-1 ${
                  isConnected ? 'bg-success animate-ping' : 'bg-danger'
                }`}
              />
            }
            className="text-[11px] font-bold select-none cursor-default py-0.5 border border-default-200/50 dark:border-default-100/50"
          >
            {isConnected ? 'Socket Live' : 'Offline'}
          </Chip>
        </NavbarItem>

        {/* Theme Switcher */}
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>

        {/* User Auth Section */}
        {isAuthenticated && user ? (
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-default-100 transition-colors focus:outline-none"
                  aria-label="Open user menu"
                >
                  <Avatar
                    size="sm"
                    color={user.role === 'admin' ? 'secondary' : 'primary'}
                    name={user.name.substring(0, 1).toUpperCase()}
                    isBordered
                    className="cursor-pointer text-xs font-bold"
                  />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-foreground leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-primary uppercase">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-default-400 hidden lg:block" />
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User Actions" variant="flat">
                <DropdownItem key="profile_info" className="h-14 gap-2" textValue="Signed in email">
                  <p className="font-semibold text-xs text-default-500">Signed in as</p>
                  <p className="font-bold text-xs text-primary truncate">{user.email}</p>
                </DropdownItem>
                <DropdownItem
                  key="view_profile"
                  startContent={<UserCheck className="w-4 h-4 text-default-500" />}
                  onPress={() => navigate('/profile')}
                >
                  Profile & Clearance
                </DropdownItem>
                {isAdmin ? (
                  <DropdownItem
                    key="admin_console"
                    startContent={<Shield className="w-4 h-4 text-secondary" />}
                    onPress={() => navigate('/admin')}
                  >
                    Admin Console
                  </DropdownItem>
                ) : null}
                <DropdownItem
                  key="logout"
                  color="danger"
                  className="text-danger"
                  startContent={<LogOut className="w-4 h-4" />}
                  onPress={handleLogout}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        ) : (
          <NavbarItem className="flex items-center gap-2">
            <Link to="/login">
              <Button size="sm" variant="light" className="font-semibold text-xs">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button
                size="sm"
                color="primary"
                variant="shadow"
                className="font-bold text-xs shadow-primary/20"
              >
                Register
              </Button>
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* HeroUI Native Mobile Menu */}
      {isAuthenticated && (
        <NavbarMenu className="bg-background/95 backdrop-blur-xl pt-6 px-6 gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-default-200/80 dark:border-default-100/80">
            <span className="text-xs font-bold text-default-500 uppercase tracking-wider">
              Navigation
            </span>
            <Chip
              size="sm"
              color={isConnected ? 'success' : 'danger'}
              variant="dot"
              className="text-[10px]"
            >
              {isConnected ? 'Realtime Connected' : 'Disconnected'}
            </Chip>
          </div>

          <NavbarMenuItem isActive={isActive('/')}>
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary'
                  : 'text-foreground hover:bg-default-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </NavbarMenuItem>

          <NavbarMenuItem isActive={isActive('/items')}>
            <Link
              to="/items"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/items')
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary'
                  : 'text-foreground hover:bg-default-100'
              }`}
            >
              <Database className="w-4 h-4" />
              Items CRUD
            </Link>
          </NavbarMenuItem>

          {isAdmin && (
            <NavbarMenuItem isActive={isActive('/admin')}>
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/admin')
                    ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary'
                    : 'text-foreground hover:bg-default-100'
                }`}
              >
                <Shield className="w-4 h-4 text-secondary" />
                Admin Console
              </Link>
            </NavbarMenuItem>
          )}

          <NavbarMenuItem isActive={isActive('/profile')}>
            <Link
              to="/profile"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/profile')
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary'
                  : 'text-foreground hover:bg-default-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Profile & Clearance
            </Link>
          </NavbarMenuItem>

          <div className="pt-4 border-t border-default-200/80 dark:border-default-100/80 mt-2">
            <Button
              variant="flat"
              color="danger"
              size="sm"
              className="w-full font-bold"
              startContent={<LogOut className="w-4 h-4" />}
              onPress={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </NavbarMenu>
      )}
    </HeroNavbar>
  );
};
