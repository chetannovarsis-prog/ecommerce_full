import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Add a request interceptor to include the customer token
api.interceptors.request.use(
  (config) => {
    const customer = JSON.parse(localStorage.getItem('customer') || 'null');
    const token = customer?.token;
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
