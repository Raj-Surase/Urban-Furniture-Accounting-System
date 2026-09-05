import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions?: string[];
  is_admin?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStandardUser: boolean;
  isLoading: boolean;
  hasRole: (roles: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string }) => Promise<void>;
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

  const login = async (credentials: { email: string; password: string }) => {
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

  const register = async (data: { name: string; email: string; password: string; role?: string }) => {
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

  const isAdmin = user?.role === 'admin' || !!user?.is_admin;
  const isManager = user?.role === 'manager';
  const isStandardUser = user?.role === 'user';

  const hasRole = useCallback((roles: string | string[]) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Superuser clearance
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
        isStandardUser,
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

