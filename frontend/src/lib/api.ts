import axios from 'axios';
import { formatApiError } from './errorHandler';

const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:8000/api`
      : 'http://localhost:8000/api';
  }
  try {
    const parsed = new URL(envUrl);
    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && typeof window !== 'undefined') {
      parsed.hostname = window.location.hostname;
      return parsed.toString().replace(/\/$/, '');
    }
  } catch {
    // ignore
  }
  return envUrl;
};

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error categorization & handling
api.interceptors.response.use(
  (response) => {
    // Dispatch success to clear any lingering network error banners
    window.dispatchEvent(new Event('api:network-success'));
    return response;
  },
  (error) => {
    const formatted = formatApiError(error);

    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized encountered. Clearing session.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    } else if (formatted.isNetworkError) {
      console.warn('[API] Network connection failure to backend server.');
      window.dispatchEvent(new CustomEvent('api:network-error', { detail: formatted }));
    }

    return Promise.reject(error);
  }
);

export default api;

// ==========================================
// DOMAIN API CLIENTS
// ==========================================

export const dashboardApi = {
  getSummary: (params?: Record<string, any>) => api.get('/dashboard/summary', { params }).then(res => res.data),
  getTransactions: () => api.get('/dashboard/transactions').then(res => res.data),
  getAlerts: () => api.get('/dashboard/alerts').then(res => res.data),
  getAnalytics: (params?: Record<string, any>) => api.get('/dashboard/analytics', { params }).then(res => res.data),
  getActivity: (params?: Record<string, any>) => api.get('/dashboard/activity', { params }).then(res => res.data),
};

export const accountsApi = {
  list: (params?: Record<string, any>) => api.get('/accounts', { params }).then(res => res.data),
  get: (id: number) => api.get(`/accounts/${id}`).then(res => res.data),
  create: (data: any) => api.post('/accounts', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/accounts/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/accounts/${id}`).then(res => res.data),
  getLedger: (id: number, params?: Record<string, any>) => api.get(`/accounts/${id}/ledger`, { params }).then(res => res.data),
};

export const productsApi = {
  list: (params?: Record<string, any>) => api.get('/products', { params }).then(res => res.data),
  get: (id: number) => api.get(`/products/${id}`).then(res => res.data),
  create: (data: any) => api.post('/products', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/products/${id}`).then(res => res.data),
  adjustStock: (id: number, data: { quantity_delta: number; reason: string; notes?: string }) =>
    api.post(`/products/${id}/adjust`, data).then(res => res.data),
};

export const vendorsApi = {
  list: (params?: Record<string, any>) => api.get('/vendors', { params }).then(res => res.data),
  get: (id: number) => api.get(`/vendors/${id}`).then(res => res.data),
  create: (data: any) => api.post('/vendors', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/vendors/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/vendors/${id}`).then(res => res.data),
};

export const customersApi = {
  list: (params?: Record<string, any>) => api.get('/customers', { params }).then(res => res.data),
  get: (id: number) => api.get(`/customers/${id}`).then(res => res.data),
  create: (data: any) => api.post('/customers', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/customers/${id}`).then(res => res.data),
};

export const purchaseOrdersApi = {
  list: (params?: Record<string, any>) => api.get('/purchase-orders', { params }).then(res => res.data),
  get: (id: number) => api.get(`/purchase-orders/${id}`).then(res => res.data),
  create: (data: any) => api.post('/purchase-orders', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/purchase-orders/${id}`, data).then(res => res.data),
  submit: (id: number) => api.post(`/purchase-orders/${id}/submit`).then(res => res.data),
  approve: (id: number) => api.post(`/purchase-orders/${id}/approve`).then(res => res.data),
  reject: (id: number, data: { rejected_reason: string }) => api.post(`/purchase-orders/${id}/reject`, data).then(res => res.data),
  receive: (id: number, data: { delivery_date?: string; items: { id: number; quantity_received: number }[] }) =>
    api.post(`/purchase-orders/${id}/receive`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/purchase-orders/${id}`).then(res => res.data),
};

export const salesOrdersApi = {
  list: (params?: Record<string, any>) => api.get('/sales-orders', { params }).then(res => res.data),
  get: (id: number) => api.get(`/sales-orders/${id}`).then(res => res.data),
  create: (data: any) => api.post('/sales-orders', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/sales-orders/${id}`, data).then(res => res.data),
  confirm: (id: number) => api.post(`/sales-orders/${id}/confirm`).then(res => res.data),
  approve: (id: number) => api.post(`/sales-orders/${id}/approve`).then(res => res.data),
  deliver: (id: number, data: { delivery_date?: string; items: { id: number; quantity_delivered: number }[] }) =>
    api.post(`/sales-orders/${id}/deliver`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/sales-orders/${id}`).then(res => res.data),
};

export const invoicesApi = {
  list: (params?: Record<string, any>) => api.get('/invoices', { params }).then(res => res.data),
  get: (id: number) => api.get(`/invoices/${id}`).then(res => res.data),
  create: (data: any) => api.post('/invoices', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/invoices/${id}`, data).then(res => res.data),
  approve: (id: number) => api.post(`/invoices/${id}/approve`).then(res => res.data),
  void: (id: number) => api.post(`/invoices/${id}/void`).then(res => res.data),
  delete: (id: number) => api.delete(`/invoices/${id}`).then(res => res.data),
};

export const paymentsApi = {
  list: (params?: Record<string, any>) => api.get('/payments', { params }).then(res => res.data),
  get: (id: number) => api.get(`/payments/${id}`).then(res => res.data),
  create: (data: any) => api.post('/payments', data).then(res => res.data),
  reconcile: (id: number) => api.post(`/payments/${id}/reconcile`).then(res => res.data),
  delete: (id: number) => api.delete(`/payments/${id}`).then(res => res.data),
};

export const journalApi = {
  list: (params?: Record<string, any>) => api.get('/journal', { params }).then(res => res.data),
  get: (id: number) => api.get(`/journal/${id}`).then(res => res.data),
  create: (data: any) => api.post('/journal', data).then(res => res.data),
  reverse: (id: number) => api.post(`/journal/${id}/reverse`).then(res => res.data),
};

export const reportsApi = {
  getTrialBalance: (params?: Record<string, any>) => api.get('/reports/trial-balance', { params }).then(res => res.data),
  getIncomeStatement: (params?: Record<string, any>) => api.get('/reports/income-statement', { params }).then(res => res.data),
  getBalanceSheet: (params?: Record<string, any>) => api.get('/reports/balance-sheet', { params }).then(res => res.data),
  getArAging: (params?: Record<string, any>) => api.get('/reports/ar-aging', { params }).then(res => res.data),
  getApAging: (params?: Record<string, any>) => api.get('/reports/ap-aging', { params }).then(res => res.data),
  getGstSummary: (params?: Record<string, any>) => api.get('/reports/gst-summary', { params }).then(res => res.data),
};

export const usersApi = {
  list: () => api.get('/users').then(res => res.data),
  getStats: () => api.get('/admin/stats').then(res => res.data),
  updateRole: (userId: number, role: string) => api.patch(`/users/${userId}/role`, { role }).then(res => res.data),
  onboardManager: (data: { name: string; email: string; phone?: string }) =>
    api.post('/admin/onboard-manager', data).then(res => res.data),
  createUser: (data: any) => api.post('/admin/create-user', data).then(res => res.data),
  getMatrix: () => api.get('/rbac/matrix').then(res => res.data),
};

export const journalsApi = {
  list: () => api.get('/journals').then(res => res.data),
  get: (id: number) => api.get(`/journals/${id}`).then(res => res.data),
  create: (data: any) => api.post('/journals', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/journals/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/journals/${id}`).then(res => res.data),
};

export const analyticAccountsApi = {
  list: (params?: Record<string, any>) => api.get('/analytic-accounts', { params }).then(res => res.data),
  get: (id: number) => api.get(`/analytic-accounts/${id}`).then(res => res.data),
  create: (data: any) => api.post('/analytic-accounts', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/analytic-accounts/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/analytic-accounts/${id}`).then(res => res.data),
};

export const budgetsApi = {
  list: (params?: Record<string, any>) => api.get('/budgets', { params }).then(res => res.data),
  get: (id: number) => api.get(`/budgets/${id}`).then(res => res.data),
  create: (data: any) => api.post('/budgets', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/budgets/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/budgets/${id}`).then(res => res.data),
  confirm: (id: number) => api.post(`/budgets/${id}/confirm`).then(res => res.data),
  revise: (id: number) => api.post(`/budgets/${id}/revise`).then(res => res.data),
  cancel: (id: number) => api.post(`/budgets/${id}/cancel`).then(res => res.data),
  getAnalyticTransactions: (id: number, params: { analytic_account_id: number; type: string }) =>
    api.get(`/budgets/${id}/analytic-transactions`, { params }).then(res => res.data),
};

export const contactsApi = {
  list: (params?: Record<string, any>) => api.get('/contacts', { params }).then(res => res.data),
  create: (data: any) => api.post('/contacts', data).then(res => res.data),
};

