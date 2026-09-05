import axios from 'axios';
import { formatApiError } from './errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
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
