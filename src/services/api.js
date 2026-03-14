import axios from 'axios';

// In production (Vercel), REACT_APP_API_URL = your Render backend URL
// In development, proxy in package.json forwards /api/* to localhost:8081
const BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor - attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 / token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const newToken = res.data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================================
// Auth Service
// ============================================================
export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  refresh: (data) => api.post('/api/auth/refresh', data),
};

// ============================================================
// User Service
// ============================================================
export const userService = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data) => api.put('/api/users/me', data),
  changePassword: (data) => api.put('/api/users/me/password', data),
};

// ============================================================
// Dashboard Service
// ============================================================
export const dashboardService = {
  getSummary: () => api.get('/api/dashboard/summary'),
};

// ============================================================
// Income Service
// ============================================================
export const incomeService = {
  getAll: () => api.get('/api/income'),
  getByMonth: (month, year) => api.get(`/api/income/month?month=${month}&year=${year}`),
  getMonthlySummary: () => api.get('/api/income/summary'),
  add: (data) => api.post('/api/income', data),
  update: (id, data) => api.put(`/api/income/${id}`, data),
  delete: (id) => api.delete(`/api/income/${id}`),
};

// ============================================================
// Expense Service
// ============================================================
export const expenseService = {
  getAll: (category) => api.get('/api/expenses', { params: category ? { category } : {} }),
  getByMonth: (month, year) => api.get(`/api/expenses/month?month=${month}&year=${year}`),
  getByRange: (start, end) => api.get(`/api/expenses/range?start=${start}&end=${end}`),
  getMonthlySummary: () => api.get('/api/expenses/summary'),
  add: (data) => api.post('/api/expenses', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
};

// ============================================================
// Budget Service
// ============================================================
export const budgetService = {
  getAll: () => api.get('/api/budgets'),
  getByMonth: (month, year) => api.get(`/api/budgets/month?month=${month}&year=${year}`),
  createOrUpdate: (data) => api.post('/api/budgets', data),
  delete: (id) => api.delete(`/api/budgets/${id}`),
};

// ============================================================
// Goal Service
// ============================================================
export const goalService = {
  getAll: () => api.get('/api/goals'),
  create: (data) => api.post('/api/goals', data),
  update: (id, data) => api.put(`/api/goals/${id}`, data),
  contribute: (id, amount) => api.post(`/api/goals/${id}/contribute?amount=${amount}`),
  delete: (id) => api.delete(`/api/goals/${id}`),
};

// ============================================================
// Bill Service
// ============================================================
export const billService = {
  getAll: () => api.get('/api/bills'),
  getUpcoming: (days = 30) => api.get(`/api/bills/upcoming?days=${days}`),
  getOverdue: () => api.get('/api/bills/overdue'),
  create: (data) => api.post('/api/bills', data),
  update: (id, data) => api.put(`/api/bills/${id}`, data),
  markPaid: (id) => api.put(`/api/bills/${id}/pay`),
  delete: (id) => api.delete(`/api/bills/${id}`),
};

// ============================================================
// Utility Helpers
// ============================================================
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const EXPENSE_CATEGORIES = [
  'FOOD', 'RENT', 'TRANSPORT', 'SHOPPING', 'ENTERTAINMENT',
  'BILLS', 'EMI', 'HEALTH', 'EDUCATION', 'OTHER'
];

export const INCOME_SOURCES = [
  'SALARY', 'FREELANCE', 'BONUS', 'INVESTMENT', 'RENTAL', 'BUSINESS', 'OTHER'
];

export const BILL_CATEGORIES = [
  'UTILITIES', 'INSURANCE', 'SUBSCRIPTION', 'LOAN', 'CREDIT_CARD', 'OTHER'
];

export const CATEGORY_COLORS = {
  FOOD: '#f5a623', RENT: '#f05252', TRANSPORT: '#4f8ef7',
  SHOPPING: '#9b87f5', ENTERTAINMENT: '#22c98a', BILLS: '#fb923c',
  EMI: '#e11d48', HEALTH: '#06b6d4', EDUCATION: '#8b5cf6', OTHER: '#64748b'
};

export const CATEGORY_ICONS = {
  FOOD: '🍔', RENT: '🏠', TRANSPORT: '🚗', SHOPPING: '🛍️',
  ENTERTAINMENT: '🎬', BILLS: '📄', EMI: '💳', HEALTH: '❤️',
  EDUCATION: '📚', OTHER: '📦'
};

export const SOURCE_ICONS = {
  SALARY: '💼', FREELANCE: '💻', BONUS: '🎁',
  INVESTMENT: '📈', RENTAL: '🏘️', BUSINESS: '🏪', OTHER: '💰'
};
