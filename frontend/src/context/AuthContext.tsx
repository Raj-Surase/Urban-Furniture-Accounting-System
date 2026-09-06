import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { UserRole } from '../types';

export interface User {
  id: number;
  name: string;
  email: string;
  login_id?: string;
  role: UserRole;
  is_customer?: boolean;
  is_vendor?: boolean;
  company_name?: string;
  phone?: string;
  permissions?: string[];
  is_admin?: boolean;
  created_at?: string;
  // Linked partner profile (resolved by email/created_by in /me endpoint)
  customer_id?: number;
  customer_name?: string;
  vendor_id?: number;
  vendor_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAccountant: boolean;
  isStandardUser: boolean;
  isCustomer: boolean;
  isVendor: boolean;
  isLoading: boolean;
  hasRole: (roles: UserRole | string | (UserRole | string)[]) => boolean;
  hasPermission: (permission: string) => boolean;
  login: (credentials: { email?: string; login_id?: string; password: string }) => Promise<void>;
  register: (data: { name?: string; login_id: string; email: string; password: string; role?: UserRole | string; [key: string]: any }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/me');
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    const handleRoleUpdated = () => {
      fetchCurrentUser();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:role-updated', handleRoleUpdated);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:role-updated', handleRoleUpdated);
    };
  }, [fetchCurrentUser]);

  const login = async (credentials: { email?: string; login_id?: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/login', credentials);
      const { user: loggedInUser, token: receivedToken } = response.data;

      localStorage.setItem('auth_token', receivedToken);
      localStorage.setItem('auth_user', JSON.stringify(loggedInUser));

      setToken(receivedToken);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name?: string; login_id: string; email: string; password: string; role?: UserRole | string; [key: string]: any }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/register', data);
      const { user: registeredUser, token: receivedToken } = response.data;

      localStorage.setItem('auth_token', receivedToken);
      localStorage.setItem('auth_user', JSON.stringify(registeredUser));

      setToken(receivedToken);
      setUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    }
  };

  const isAdmin = user?.role === UserRole.ADMIN || !!user?.is_admin;
  const isManager = user?.role === UserRole.MANAGER;
  const isAccountant = user?.role === UserRole.ACCOUNTANT || user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;
  const isStandardUser = user?.role === UserRole.USER || user?.role === UserRole.CUSTOMER || user?.role === UserRole.VENDOR;
  const isCustomer = user?.role === UserRole.CUSTOMER || !!user?.is_customer;
  const isVendor = user?.role === UserRole.VENDOR || !!user?.is_vendor;

  const hasRole = useCallback((roles: UserRole | string | (UserRole | string)[]) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true; // Superuser clearance
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isManager,
        isAccountant,
        isStandardUser,
        isCustomer,
        isVendor,
        isLoading,
        hasRole,
        hasPermission,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

