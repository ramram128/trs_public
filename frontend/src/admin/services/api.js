import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const adminApi = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('trs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('trs_token');
        localStorage.removeItem('trs_user');
        window.location.href = '/admin/login';
      } else if (error.response.status === 403) {
        toast.error("You don't have permission to perform this action.");
        window.location.href = '/';
      } else if (error.response.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        const message = error.response.data?.detail || "An error occurred";
        toast.error(message);
      }
    } else {
      toast.error("Network error. Please check your connection.");
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // Dashboard
  getDashboard: () => adminApi.get('/dashboard'),

  // Analytics/Reports
  getSalesReport: (params) => adminApi.get('/reports/sales', { params }),

  // Products
  getProducts: (params) => axios.get(`${API_URL}/products`, { params }), // Public endpoint with admin auth
  getProduct: (id) => axios.get(`${API_URL}/products/by-id/${id}`),
  createProduct: (data) => adminApi.post('/products', data, { baseURL: API_URL }),
  updateProduct: (id, data) => adminApi.put(`/products/${id}`, data, { baseURL: API_URL }),
  deleteProduct: (id) => adminApi.delete(`/products/${id}`, { baseURL: API_URL }),
  uploadProductImage: (id, file, isMain) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApi.post(`/products/${id}/images?is_main=${isMain}`, formData, {
      baseURL: API_URL,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteProductImage: (productId, imageId) => adminApi.delete(`/products/${productId}/images/${imageId}`, { baseURL: API_URL }),

  // Categories
  getCategories: (params) => axios.get(`${API_URL}/categories`, { params }),
  createCategory: (data) => adminApi.post('/categories', data, { baseURL: API_URL }),
  updateCategory: (id, data) => adminApi.put(`/categories/${id}`, data, { baseURL: API_URL }),
  deleteCategory: (id) => adminApi.delete(`/categories/${id}`, { baseURL: API_URL }),
  uploadCategoryImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApi.post(`/categories/${id}/upload-image`, formData, {
      baseURL: API_URL,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Orders
  getOrders: (params) => adminApi.get('/orders', { params }),
  getOrder: (id) => adminApi.get(`/orders/${id}`),
  updateOrderStatus: (id, data) => adminApi.put(`/orders/${id}/status`, data),
  updatePaymentStatus: (id, data) => adminApi.put(`/orders/${id}/payment-status`, data),
  updateReturnStatus: (id, data) => adminApi.put(`/orders/${id}/return-status`, data),

  // Customers
  getCustomers: (params) => adminApi.get('/customers', { params }),
  toggleCustomerStatus: (id) => adminApi.put(`/customers/${id}/toggle-status`),

  // Inventory
  getInventory: (params) => adminApi.get('/inventory', { params }),
  updateQuickStock: (id, stock) => adminApi.patch(`/inventory/${id}/stock`, { stock }),

  // Payments
  getPayments: (params) => adminApi.get('/payments/admin', { params, baseURL: API_URL }),

  // Settings
  getSettings: () => axios.get(`${API_URL}/settings`),
  updateSettings: (data) => adminApi.put('/settings', data, { baseURL: API_URL }),

  // Logs
  getActivityLogs: (params) => adminApi.get('/activity-log', { params }),

  // Coupons
  getCoupons: () => adminApi.get('/coupons', { baseURL: API_URL }),
  createCoupon: (data) => adminApi.post('/coupons', data, { baseURL: API_URL }),
  updateCoupon: (id, data) => adminApi.put(`/coupons/${id}`, data, { baseURL: API_URL }),
  deleteCoupon: (id) => adminApi.delete(`/coupons/${id}`, { baseURL: API_URL }),

  // Reviews
  getReviews: (params) => adminApi.get('/reviews/admin/all', { params, baseURL: API_URL }),
  toggleReviewApproval: (id) => adminApi.put(`/reviews/admin/${id}/approve`, {}, { baseURL: API_URL }),
  deleteReview: (id) => adminApi.delete(`/reviews/admin/${id}`, { baseURL: API_URL }),

  // Banners
  getBanners: () => adminApi.get('/banners/admin', { baseURL: API_URL }),
  createBanner: (data) => adminApi.post('/banners/admin', data, { baseURL: API_URL }),
  updateBanner: (id, data) => adminApi.put(`/banners/admin/${id}`, data, { baseURL: API_URL }),
  deleteBanner: (id) => adminApi.delete(`/banners/admin/${id}`, { baseURL: API_URL }),

  // Contact Inquiries
  getContactInquiries: (params) => adminApi.get('/contact/admin', { params, baseURL: API_URL }),
  resolveContactInquiry: (id) => adminApi.put(`/contact/admin/${id}/resolve`, {}, { baseURL: API_URL }),
  updateContactInquiryStatus: (id, data) => adminApi.put(`/contact/admin/${id}/status`, data, { baseURL: API_URL }),
  deleteContactInquiry: (id) => adminApi.delete(`/contact/admin/${id}`, { baseURL: API_URL }),

  // Newsletter
  getNewsletterSubscribers: (params) => adminApi.get('/newsletter/admin', { params, baseURL: API_URL }),

  // Admin Profile
  updateProfile: (data) => adminApi.put('/auth/me', data, { baseURL: API_URL }),
};

export default adminService;
