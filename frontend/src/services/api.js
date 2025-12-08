import axios from 'axios';

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getOne: (id) => api.get('/categories/' + id),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put('/categories/' + id, data),
  delete: (id) => api.delete('/categories/' + id),
};

// Expense APIs
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params: params }),
  getOne: (id) => api.get('/expenses/' + id),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put('/expenses/' + id, data),
  delete: (id) => api.delete('/expenses/' + id),
  getStats: () => api.get('/expenses/stats/summary'),
};

// Income APIs
export const incomeAPI = {
  getAll: (params) => api.get('/incomes', { params: params }),
  getOne: (id) => api.get('/incomes/' + id),
  create: (data) => api.post('/incomes', data),
  update: (id, data) => api.put('/incomes/' + id, data),
  delete: (id) => api.delete('/incomes/' + id),
  getStats: () => api.get('/incomes/stats/summary'),
};

// Budget APIs
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params: params }),
  getOne: (id) => api.get('/budgets/' + id),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put('/budgets/' + id, data),
  delete: (id) => api.delete('/budgets/' + id),
  getCurrentStatus: () => api.get('/budgets/current/status'),
};

// Goal APIs
export const goalAPI = {
  getAll: (params) => api.get('/goals', { params: params }),
  getOne: (id) => api.get('/goals/' + id),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put('/goals/' + id, data),
  updateProgress: (id, data) => api.patch('/goals/' + id + '/progress', data),
  delete: (id) => api.delete('/goals/' + id),
};

// Dashboard APIs
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getBurnRate: () => api.get('/dashboard/burn-rate'),
  getTrends: () => api.get('/dashboard/trends'),
  getRecentTransactions: (limit) => api.get('/dashboard/recent-transactions', { params: { limit: limit || 10 } }),
  getHealthScore: () => api.get('/dashboard/health-score'),
};

export default api;