import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8080/api/v1'
).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '');
      // Do not clear user auth session if 401 is an access rejection on a specific order resource
      if (!url.includes('/auth/login') && !url.includes('/ecommerce/orders/')) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('auth-user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth_updated'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export function getAuthToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth_updated'));
  }
}

export function removeAuthToken(): void {
  setAuthToken(null);
}

export default api;
