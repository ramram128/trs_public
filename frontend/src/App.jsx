import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Customer Layout & Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import WhatsAppButton from './components/common/WhatsAppButton';
import CartDrawer from './components/cart/CartDrawer';

// Admin
import AdminLayout from './admin/layouts/AdminLayout';
import AdminRoute from './admin/components/AdminRoute';
import AdminLogin from './admin/pages/AdminLogin';
import Dashboard from './admin/pages/Dashboard';
import ProductList from './admin/pages/Products/ProductList';
import ProductForm from './admin/pages/Products/ProductForm';
import ProductDetail from './admin/pages/Products/ProductDetail';
import AdminOrders from './admin/pages/Orders/OrderList';
import AdminOrderDetail from './admin/pages/Orders/OrderDetail';
import AdminCategories from './admin/pages/Categories/CategoryList';
import AdminCustomers from './admin/pages/Customers/CustomerList';
import AdminInventory from './admin/pages/Inventory/InventoryList';
import AdminPayments from './admin/pages/Payments/PaymentList';
import AdminActivityLogs from './admin/pages/Settings/ActivityLog';
import AdminSettings from './admin/pages/Settings/SettingsPage';
import AdminCouponList from './admin/pages/Coupons/CouponList';
import AdminReviewList from './admin/pages/Reviews/ReviewList';
import AdminReports from './admin/pages/Reports/ReportsPage';
import AdminHomepage from './admin/pages/Settings/HomepageManagement';
import AdminProfile from './admin/pages/Settings/AdminProfile';
import AdminNotifications from './admin/pages/Notifications/NotificationList';
import AdminInquiries from './admin/pages/Inquiries/InquiriesList';

// Customer Pages
import HomePage from './pages/Home';
import ProductsPage from './pages/Products';
import ProductDetailPage from './pages/ProductDetail';
import CategoryPage from './pages/Category';
import CategoriesPage from './pages/Categories';
import SearchPage from './pages/Search';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import OrderSuccessPage from './pages/OrderSuccess';
import TrackOrderPage from './pages/TrackOrder';
import { AccountDashboard, MyOrdersPage, OrderDetailPage, WishlistPage, ProfilePage, AddressesPage, ChangePasswordPage } from './pages/Account';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import AboutPage from './pages/About';
import ContactPage from './pages/Contact';
import OffersPage from './pages/Offers';
import FAQPage from './pages/FAQ';
import TermsPage from './pages/Terms';
import { ShippingPolicyPage, ReturnPolicyPage, PrivacyPolicyPage } from './pages/Policies';
import NotFoundPage from './pages/NotFound';

function CustomerLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}

function isAdminPath(pathname) {
  return pathname.startsWith('/admin');
}

function AppContent() {
  const location = useLocation();
  const adminRoute = isAdminPath(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  return (
    <>
      <Toaster position="top-right" />
      {adminRoute ? (
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/add" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="coupons" element={<AdminCouponList />} />
            <Route path="reviews" element={<AdminReviewList />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="homepage" element={<AdminHomepage />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="activity-log" element={<AdminActivityLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<div className="p-4">Page under construction</div>} />
          </Route>
        </Routes>
      ) : (
        <CustomerLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/account" element={<AccountDashboard />} />
            <Route path="/account/orders" element={<MyOrdersPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
            <Route path="/account/wishlist" element={<WishlistPage />} />
            <Route path="/account/addresses" element={<AddressesPage />} />
            <Route path="/account/profile" element={<ProfilePage />} />
            <Route path="/account/change-password" element={<ChangePasswordPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="/return-policy" element={<ReturnPolicyPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CustomerLayout>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <AppContent />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
