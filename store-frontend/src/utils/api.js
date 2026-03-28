import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ecommerce-backend-s90k.onrender.com/api',
});

// Add a request interceptor to include the customer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
