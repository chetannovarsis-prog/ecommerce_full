import axios from 'axios';

const normalizeBaseUrl = (value) => {
  const fallback = 'http://localhost:5000/api';
  const rawValue = (value || '').trim();

  if (!rawValue) {
    return fallback;
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue.replace(/\/+$/, '');
  }

  if (rawValue.startsWith('//')) {
    return `${window.location.protocol}${rawValue}`.replace(/\/+$/, '');
  }

  if (rawValue.startsWith(':')) {
    return `${window.location.protocol}//${window.location.hostname}${rawValue}`.replace(/\/+$/, '');
  }

  if (rawValue.startsWith('/')) {
    return `${window.location.origin}${rawValue}`.replace(/\/+$/, '');
  }

  return `https://${rawValue}`.replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL),
  timeout: 15000,
});

// Add interceptor to inject adminToken into every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export default api;
