import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const categoryService = {
  getAll: (status = true) => api.get('/categories', { params: { status } }),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  uploadImage: (id, formData) =>
    api.post(`/categories/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (id, formData, isMain = false) =>
    api.post(`/products/${id}/images`, formData, {
      params: { is_main: isMain },
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (productId, imageId) =>
    api.delete(`/products/${productId}/images/${imageId}`),
};

export const searchService = {
  search: (q, page = 1) => api.get('/search', { params: { q, page } }),
  suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
};

export const cartService = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const wishlistService = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const orderService = {
  checkout: (data) => api.post('/orders/checkout', data),
  getMyOrders: () => api.get('/orders'),
  getOrder: (orderNumber) => api.get(`/orders/${orderNumber}`),
  trackOrder: (identifier) => api.get(`/orders/track/${identifier}`),
  requestReturn: (orderNumber, data) => api.post(`/orders/${orderNumber}/return`, data),
  uploadBankSlip: (orderNumber, formData) =>
    api.post(`/orders/${orderNumber}/bank-slip`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const contactService = {
  submit: (data) => api.post('/contact', data),
};

export const paymentService = {
  createPayhereSession: (orderNumber) =>
    api.post('/payments/create-payhere-session', { order_number: orderNumber }),
  verifyPayment: (orderNumber) => api.get(`/payments/verify/${orderNumber}`),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  updatePaymentStatus: (id, data) => api.put(`/admin/orders/${id}/payment-status`, data),
  updateOrderTracking: (id, data) => api.patch(`/admin/orders/${id}/tracking`, data),
  resendTrackingEmail: (id) => api.post(`/admin/orders/${id}/send-tracking-email`),
  updateReturnStatus: (id, data) => api.put(`/admin/orders/${id}/return-status`, data),
  // Customers
  getCustomers: (params) => api.get('/admin/customers', { params }),
  toggleCustomerStatus: (id) => api.put(`/admin/customers/${id}/toggle-status`),
};

export const addressService = {
  getAll: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.put(`/addresses/${id}/default`),
};

export const couponService = {
  validate: (data) => api.post('/coupons/validate', data),
};

export const reviewService = {
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  getSummary: (productId) => api.get(`/reviews/product/${productId}/summary`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const settingsService = {
  get: (group) => api.get('/settings', { params: group ? { group } : {} }),
  update: (data) => api.put('/settings', data),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};
