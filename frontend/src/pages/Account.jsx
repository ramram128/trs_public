import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { authService, orderService, productService } from '../services';
import { User, Package, Heart, Settings, LogOut, ChevronRight, ShoppingBag, Clock, MapPin, Lock, Truck, ExternalLink, Printer, RotateCcw, Upload, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getApiError } from '../services/api';
import InvoiceModal from '../components/common/InvoiceModal';

const NAV_ITEMS = [
  { to: '/account', icon: User, label: 'Dashboard' },
  { to: '/account/orders', icon: Package, label: 'My Orders' },
  { to: '/account/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/account/addresses', icon: MapPin, label: 'Addresses' },
  { to: '/account/profile', icon: Settings, label: 'Profile' },
  { to: '/account/change-password', icon: Lock, label: 'Change Password' },
];

export default function AccountLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <Helmet><title>My Account — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-[#072d1e] text-white py-8 md:py-10 border-b border-[#c59a3f]/20">
          <div className="container-custom">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">My Account</h1>
            <p className="text-[#edd58c] text-sm mt-1">Welcome, {user?.name || 'Customer'}</p>
          </div>
        </div>
        <div className="container-custom py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="p-4 border-b border-gray-100 text-center">
                  <div className="w-16 h-16 bg-green-900 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <nav className="p-2">
                  {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        location.pathname === to ? 'bg-green-50 text-green-900' : 'text-gray-600 hover:bg-gray-50'
                      }`}>
                      <Icon size={16} /> {label}
                    </Link>
                  ))}
                  <button onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut size={16} /> Logout
                  </button>
                </nav>
              </div>
            </aside>
            <div className="lg:col-span-3">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export function AccountDashboard() {
  const { user } = useAuth();
  return (
    <AccountLayout>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Dashboard</h2>
        <p className="text-gray-500 mb-6">Welcome back, <strong>{user?.name}</strong>! Here's your account overview.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/account/orders" className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
            <ShoppingBag size={24} className="text-green-700" />
            <div><p className="font-semibold text-gray-900">My Orders</p><p className="text-sm text-gray-500">View order history</p></div>
            <ChevronRight size={16} className="ml-auto text-gray-400" />
          </Link>
          <Link to="/account/wishlist" className="flex items-center gap-4 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
            <Heart size={24} className="text-red-500" />
            <div><p className="font-semibold text-gray-900">Wishlist</p><p className="text-sm text-gray-500">Your saved items</p></div>
            <ChevronRight size={16} className="ml-auto text-gray-400" />
          </Link>
          <Link to="/account/addresses" className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
            <MapPin size={24} className="text-purple-600" />
            <div><p className="font-semibold text-gray-900">Addresses</p><p className="text-sm text-gray-500">Manage delivery addresses</p></div>
            <ChevronRight size={16} className="ml-auto text-gray-400" />
          </Link>
          <Link to="/track-order" className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
            <Clock size={24} className="text-amber-600" />
            <div><p className="font-semibold text-gray-900">Track Order</p><p className="text-sm text-gray-500">Check delivery status</p></div>
            <ChevronRight size={16} className="ml-auto text-gray-400" />
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getMyOrders()
      .then((res) => setOrders(res.data.items || res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AccountLayout>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">My Orders</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <Link to="/products" className="bg-green-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-800 inline-block mt-3">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id || order.order_number} to={`/account/orders/${order.order_number}`}
                className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/50 transition-all">
                <Package size={20} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{order.order_number}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.item_count || order.items?.length || 0} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">Rs. {order.total?.toLocaleString()}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{order.order_status?.replace(/_/g, ' ')}</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const fetchOrder = () => {
    if (!id) return;
    orderService.getOrder(id)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success('Order cancelled successfully');
      setOrder({ ...order, order_status: 'cancelled' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      toast.error('Please enter a reason for the return request');
      return;
    }
    setSubmittingReturn(true);
    try {
      await orderService.requestReturn(order.order_number, { reason: returnReason });
      toast.success('Return request submitted! Our support team will review it.');
      setShowReturnModal(false);
      fetchOrder();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleSlipUpload = async (e) => {
    e.preventDefault();
    if (!slipFile) {
      toast.error('Select a receipt image');
      return;
    }
    setUploadingSlip(true);
    const fd = new FormData();
    fd.append('file', slipFile);
    try {
      const res = await orderService.uploadBankSlip(order.order_number, fd);
      toast.success('Deposit slip uploaded successfully!');
      setOrder({ ...order, bank_slip_url: res.data.bank_slip_url });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUploadingSlip(false);
    }
  };

  const canCancel = order && ['pending', 'confirmed'].includes(order.order_status);
  const canReturn = order && order.order_status === 'delivered';

  return (
    <AccountLayout>
      <div className="bg-white rounded-2xl shadow-card p-6">
        {loading ? (
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        ) : !order ? (
          <p className="text-gray-500 text-center py-8">Order not found</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <span>{order.order_number}</span>
                  <button
                    onClick={() => setShowInvoice(true)}
                    className="text-xs bg-[#c59a3f]/15 hover:bg-[#c59a3f]/30 text-[#072d1e] font-bold px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                    title="Print Official Tax Invoice"
                  >
                    <Printer size={13} /> Invoice
                  </button>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <span className={`self-start sm:self-end px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                  order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  order.order_status === 'return_requested' ? 'bg-purple-100 text-purple-700' :
                  order.order_status === 'returned' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{order.order_status?.replace(/_/g, ' ')}</span>
                <span className="text-[11px] text-gray-400 uppercase font-medium">Payment: {order.payment_method?.replace(/_/g, ' ')} ({order.payment_status})</span>
              </div>
            </div>

            {/* Shipment Tracking Box */}
            <div className="bg-gradient-to-r from-emerald-50/70 to-green-50/70 border border-emerald-100 rounded-xl p-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#072d1e] text-[#edd58c] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Tracking ID</span>
                    {order.tracking_id ? (
                      <div>
                        <span className="text-sm font-bold font-mono text-[#072d1e]">{order.tracking_id}</span>
                        {order.courier_name && (
                          <span className="text-xs text-gray-600 block mt-0.5 font-medium">Courier: {order.courier_name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        Not Assigned Yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {order.tracking_url ? (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#072d1e] hover:bg-[#0c3c28] text-[#edd58c] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink size={14} /> Track Shipment
                    </a>
                  ) : (
                    <Link
                      to={`/track-order?q=${order.order_number}`}
                      className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Clock size={14} /> View Timeline
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Transfer Slip Upload Card if applicable */}
            {order.payment_method === 'bank_transfer' && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl mb-5 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <FileText size={15} /> Direct Bank Transfer Receipt
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Payment: {order.payment_status}
                  </span>
                </div>
                {order.bank_slip_url ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Check size={14} /> Deposit slip submitted (Under verification)
                    </span>
                    <a href={order.bank_slip_url} target="_blank" rel="noopener noreferrer" className="text-indigo-700 font-bold underline">
                      View Uploaded Slip
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSlipUpload} className="flex gap-2 items-center mt-2">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      required
                      onChange={(e) => setSlipFile(e.target.files[0])}
                      className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-800"
                    />
                    <button
                      type="submit"
                      disabled={uploadingSlip || !slipFile}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <Upload size={13} /> {uploadingSlip ? '...' : 'Upload Slip'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Return Status Alert if requested */}
            {order.return_reason && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl mb-5 text-xs text-purple-900">
                <p><strong>Return Request Status:</strong> <span className="uppercase font-bold">{order.return_status || 'Under Review'}</span></p>
                <p className="text-purple-700 mt-0.5">Reason: {order.return_reason}</p>
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-3 mb-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <img src={item.product_image || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=60'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.variant_info && <p className="text-[11px] text-gray-400">{item.variant_info}</p>}
                  </div>
                  <p className="text-sm font-semibold">Rs. {item.total?.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>Rs. {order.subtotal?.toLocaleString()}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Coupon Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span>- Rs. {order.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>{order.delivery_charge === 0 ? 'FREE' : `Rs. ${order.delivery_charge?.toLocaleString()}`}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-green-900">Rs. {order.total?.toLocaleString()}</span></div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowInvoice(true)}
                className="bg-[#c59a3f] hover:bg-[#b08734] text-[#072d1e] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Print Invoice
              </button>

              {canReturn && (
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw size={14} /> Request Return / Refund
                </button>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>

            {/* Return Modal */}
            {showReturnModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <h3 className="font-bold text-gray-900 text-base mb-2">Request Order Return / Refund</h3>
                  <p className="text-xs text-gray-500 mb-4">Please describe why you wish to return this order (damaged goods, wrong items, quality issue):</p>
                  <form onSubmit={handleReturnSubmit} className="space-y-4">
                    <textarea
                      rows={3}
                      required
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Enter detailed reason for return..."
                      className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#072d1e] outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReturnModal(false)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReturn}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {submittingReturn ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Invoice Modal */}
            {order && (
              <InvoiceModal
                order={order}
                isOpen={showInvoice}
                onClose={() => setShowInvoice(false)}
              />
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}

export function WishlistPage() {
  const { wishlist, toggle } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wishlist || wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      wishlist.map(item => {
        const productId = typeof item === 'object' ? item.product_id : item;
        return api.get(`/products/by-id/${productId}`).then(res => res.data).catch(() => null);
      })
    ).then(results => {
      setProducts(results.filter(Boolean));
    }).finally(() => setLoading(false));
  }, [wishlist]);

  if (!wishlist || wishlist.length === 0) {
    return (
      <AccountLayout>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No items in your wishlist</p>
            <Link to="/products" className="bg-green-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-800 inline-block mt-3">Discover Products</Link>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">My Wishlist ({wishlist.length} items)</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Could not load wishlist items</p>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="flex gap-4 items-center p-3 border border-gray-100 rounded-xl">
                <Link to={`/products/${product.slug}`}>
                  <img src={product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=80'} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product.slug}`} className="font-medium text-sm text-gray-900 hover:text-green-700 line-clamp-1">{product.name}</Link>
                  <p className="text-green-700 font-bold text-sm">Rs. {product.final_price?.toLocaleString()}</p>
                  <p className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </p>
                </div>
                <button onClick={() => toggle(product.id)} className="text-red-400 hover:text-red-600 text-sm font-medium">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', city: user.city || '', state: user.state || '', pincode: user.pincode || '' });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(form);
      await updateUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountLayout>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900 resize-none" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="bg-green-900 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}

export function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ label: 'Home', customer_name: '', phone: '', address: '', city: '', state: '', pincode: '', is_default: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/addresses/${editing.id}`, form);
        toast.success('Address updated');
      } else {
        await api.post('/addresses', form);
        toast.success('Address added');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ label: 'Home', customer_name: '', phone: '', address: '', city: '', state: '', pincode: '', is_default: false });
      fetchAddresses();
    } catch (err) {
      toast.error(getApiError(err));
    } finally { setSaving(false); }
  };

  const handleEdit = (addr) => {
    setEditing(addr);
    setForm({ label: addr.label, customer_name: addr.customer_name, phone: addr.phone || '', address: addr.address, city: addr.city, state: addr.state || '', pincode: addr.pincode || '', is_default: addr.is_default });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/default`);
      toast.success('Default address set');
      fetchAddresses();
    } catch (err) { toast.error(getApiError(err)); }
  };

  return (
    <AccountLayout>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-900">My Addresses</h2>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ label: 'Home', customer_name: '', phone: '', address: '', city: '', state: '', pincode: '', is_default: false }); }}
            className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition">
            + Add Address
          </button>
        </div>

        {showForm && (
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-sm mb-3">{editing ? 'Edit Address' : 'New Address'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <option>Home</option><option>Work</option><option>Other</option>
                </select>
                <input type="text" placeholder="Full Name *" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" required />
              </div>
              <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              <textarea placeholder="Address *" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" required />
              <div className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="City *" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" required />
                <input type="text" placeholder="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                <input type="text" placeholder="Postal Code" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} className="rounded" />
                Set as default address
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No saved addresses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className={`border rounded-xl p-4 ${addr.is_default ? 'border-green-300 bg-green-50' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{addr.label}</span>
                      {addr.is_default && <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-sm text-gray-700">{addr.customer_name}</p>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                    <p className="text-sm text-gray-600">{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.pincode}</p>
                    {addr.phone && <p className="text-xs text-gray-500 mt-1">{addr.phone}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {!addr.is_default && <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-green-700 hover:text-green-800">Set Default</button>}
                    <button onClick={() => handleEdit(addr)} className="text-xs text-blue-600 hover:text-blue-700">Edit</button>
                    <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 hover:text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

export function ChangePasswordPage() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.new_password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { current_password: form.current_password, new_password: form.new_password });
      toast.success('Password changed successfully');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally { setLoading(false); }
  };

  return (
    <AccountLayout>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={form.current_password} onChange={e => setForm({...form, current_password: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={form.confirm_password} onChange={e => setForm({...form, confirm_password: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" required minLength={8} />
          </div>
          <button type="submit" disabled={loading}
            className="bg-green-900 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}
