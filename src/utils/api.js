import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('athletos_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and extract data
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const res = error.response;
    if (res) {
      const errMsg = typeof res.data === 'string' ? res.data : (res.data?.error || res.data?.message || '');
      if (res.status === 401 || (res.status === 403 && errMsg.toLowerCase().includes('deactivated'))) {
        localStorage.removeItem('athletos_token');
        window.location.href = '/';
      }
      return Promise.reject(new Error(errMsg || 'API Error'));
    }
    return Promise.reject(new Error(error.message || 'Network Error'));
  }
);

export const api = {
  get: (path) => axiosInstance.get(path),
  post: (path, body) => axiosInstance.post(path, body),
  put: (path, body) => axiosInstance.put(path, body),
  delete: (path) => axiosInstance.delete(path)
};
