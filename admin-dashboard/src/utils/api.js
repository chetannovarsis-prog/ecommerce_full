import axios from 'axios';
import { supabase } from '../services/supabaseClient';

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

// Add interceptor for token if needed in future
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
