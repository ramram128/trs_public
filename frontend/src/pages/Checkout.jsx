import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderService, paymentService, settingsService } from '../services';
import api, { getApiError } from '../services/api';
import {
  ShoppingCart, CreditCard, Banknote, MapPin, User, Truck,
  Wallet, Landmark, Shield, Lock, Check, Tag, AlertCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, fetchCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(350);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(5000);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('trs_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    payment_method: 'cod',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customer_name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      }));
    }
    settingsService.get('delivery').then((res) => {
      const settings = res.data;
      if (settings?.delivery_charge) setDeliveryCharge(Number(settings.delivery_charge));
      if (settings?.free_delivery_threshold) setFreeDeliveryThreshold(Number(settings.free_delivery_threshold));
    }).catch(() => {});
  }, [user]);

  const { items = [], subtotal = 0 } = cart;
  const couponDiscount = Number(appliedCoupon?.discount) || 0;
  const delivery = subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge;
  const total = Math.max(0, subtotal - couponDiscount + delivery);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Enter a coupon code');
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', { code: couponInput.trim(), subtotal });
      const disc = Number(res.data.discount_amount) || 0;
      const couponObj = { code: couponInput.trim().toUpperCase(), discount: disc };
      setAppliedCoupon(couponObj);
      localStorage.setItem('trs_applied_coupon', JSON.stringify(couponObj));
      setCouponInput('');
      toast.success(res.data.message || 'Coupon applied successfully!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('trs_applied_coupon');
    toast.success('Coupon removed');
  };

  const handlePayHerePayment = useCallback((order) => {
    paymentService.createPayhereSession(order.order_number).then((payRes) => {
      const d = payRes.data;

      if (typeof window.payhere === 'undefined') {
        toast.error('Payment system is loading. Please try again.');
        setLoading(false);
        return;
      }

      window.payhere.init('sandbox');

      window.payhere.onCompleted = function onCompleted(orderId) {
        localStorage.removeItem('trs_applied_coupon');
        fetchCart();
        navigate(`/order-success/${order.order_number}`);
      };

      window.payhere.onDismissed = function onDismissed() {
        toast.error('Payment was cancelled. Your order is saved — you can complete payment later from your orders.');
        setLoading(false);
      };

      window.payhere.onError = function onError(error) {
        toast.error('Payment failed: ' + (error || 'Unknown error'));
        setLoading(false);
      };

      window.payhere.startPayment({
        sandbox: d.sandbox,
        merchant_id: d.merchant_id,
        return_url: d.return_url,
        cancel_url: d.cancel_url,
        notify_url: d.notify_url,
        order_id: d.order_id,
        items: d.items,
        amount: d.amount,
        currency: d.currency,
        first_name: d.first_name,
        last_name: d.last_name,
        email: d.email,
        phone: d.phone,
        address: d.address,
        city: d.city,
        country: d.country,
        hash: d.hash,
      });
    }).catch(() => {
      toast.error('Payment session creation failed. Please try again.');
      setLoading(false);
    });
  }, [fetchCart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!form.customer_name || !form.email || !form.phone || !form.address || !form.city) {
      toast.error('Please fill in all required customer fields');
      return;
    }

    setLoading(true);
    try {
      const res = await orderService.checkout({
        address: {
          customer_name: form.customer_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state || null,
          pincode: form.pincode || null,
          country: 'Sri Lanka',
        },
        payment_method: form.payment_method,
        coupon_code: appliedCoupon?.code || null,
        notes: form.notes || null,
      });

      const order = res.data;
      localStorage.removeItem('trs_applied_coupon');

      if (form.payment_method === 'online' || form.payment_method === 'card' || form.payment_method === 'wallet') {
        handlePayHerePayment(order);
        return;
      }

      fetchCart();
      navigate(`/order-success/${order.order_number}`);
    } catch (err) {
      const msg = err.response?.data?.detail;
      if (Array.isArray(msg)) {
        toast.error(msg.map((e) => e.msg).join(', '));
      } else {
        toast.error(msg || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <Link to="/products" className="bg-[#072d1e] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0d4a32] transition-colors inline-block mt-4">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Checkout — TRS Imports (Quality • Trust • Goodness)</title></Helmet>
      <div className="bg-gray-50 min-h-screen pb-16">
        <div className="bg-[#072d1e] text-white py-8 md:py-10 border-b border-[#c59a3f]/20">
          <div className="container-custom">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">Secure Checkout</h1>
            <p className="text-[#edd58c] text-sm mt-1">Complete your order with quality & trust</p>
          </div>
        </div>

        <div className="container-custom py-8">
          {/* Guest Checkout Notice if not authenticated */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Checking out as a Guest</p>
                  <p className="text-xs text-amber-700">No account required to place an order. Or sign in to use your saved addresses.</p>
                </div>
              </div>
              <Link
                to="/login?redirect=/checkout"
                className="text-xs font-bold bg-[#072d1e] text-[#edd58c] px-4 py-2 rounded-xl hover:bg-[#0c3c28] transition flex-shrink-0"
              >
                Sign In Now
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left - Customer & Shipping Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Details */}
                <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={18} className="text-[#072d1e]" /> Customer & Delivery Details
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        name="customer_name"
                        required
                        value={form.customer_name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="077 123 4567 / +94 77 123 4567"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Delivery Street Address *</label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={form.address}
                        onChange={handleChange}
                        placeholder="House / Building No, Street name"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">City / Town *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Colombo, Kandy, Galle, etc."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Postal / PIN Code (Optional)</label>
                      <input
                        type="text"
                        name="pincode"
                        value={form.pincode}
                        onChange={handleChange}
                        placeholder="00100"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-[#072d1e]" /> Payment Method
                  </h2>

                  <div className="space-y-3">
                    {/* Cash on Delivery */}
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      form.payment_method === 'cod' ? 'border-[#072d1e] bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={form.payment_method === 'cod'}
                        onChange={handleChange}
                        className="accent-[#072d1e] w-4 h-4"
                      />
                      <Banknote size={22} className="text-[#072d1e]" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">Cash on Delivery (COD)</p>
                        <p className="text-xs text-gray-500">Pay cash directly when parcel is delivered to your doorstep</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">COD</span>
                    </label>

                    {/* Direct Bank Transfer (Wholesale / Bulk Friendly) */}
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      form.payment_method === 'bank_transfer' ? 'border-[#072d1e] bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="bank_transfer"
                        checked={form.payment_method === 'bank_transfer'}
                        onChange={handleChange}
                        className="accent-[#072d1e] w-4 h-4"
                      />
                      <Landmark size={22} className="text-indigo-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">Direct Bank Deposit / Transfer</p>
                        <p className="text-xs text-gray-500">Ideal for Bulk & Wholesale Orders — deposit into company account and upload slip</p>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">B2B BANK</span>
                    </label>

                    {/* Bank Details Display Box if selected */}
                    {form.payment_method === 'bank_transfer' && (
                      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-1.5 text-indigo-900">
                        <p className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                          <Landmark size={15} /> Company Bank Account Information
                        </p>
                        <p><strong>Bank:</strong> Commercial Bank of Ceylon PLC</p>
                        <p><strong>Account Name:</strong> TRS Imports & Trading (Pvt) Ltd</p>
                        <p><strong>Account Number:</strong> 1000 8947 2841</p>
                        <p><strong>Branch:</strong> Pettah Branch, Colombo</p>
                        <p className="text-gray-600 mt-2 italic">
                          * Please note: After clicking "Place Order", you can upload your deposit slip / screenshot directly or send it via WhatsApp: +94 742 975 043.
                        </p>
                      </div>
                    )}

                    {/* Online Payment via PayHere */}
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      form.payment_method === 'online' ? 'border-[#072d1e] bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="online"
                        checked={form.payment_method === 'online'}
                        onChange={handleChange}
                        className="accent-[#072d1e] w-4 h-4"
                      />
                      <CreditCard size={22} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">Online Card / Wallet (PayHere Gateway)</p>
                        <p className="text-xs text-gray-500">Instant checkout with Visa, Mastercard, Genie, eZ Cash</p>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">VISA / MC</span>
                      </div>
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="mt-5">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Order Notes / Delivery Instructions (Optional)</label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={form.notes}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] resize-none"
                      placeholder="e.g., Deliver during business hours, call before arrival..."
                    />
                  </div>
                </div>
              </div>

              {/* Right - Order Summary & Coupon */}
              <div className="lg:col-span-1 space-y-5">
                <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 sticky top-24">
                  <h2 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Order Summary</h2>

                  {/* Items List */}
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 text-sm">
                        <img
                          src={item.product_image || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=60'}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 line-clamp-1 text-xs">{item.product_name}</p>
                          <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                          {item.variant_info && <p className="text-[10px] text-gray-400">{item.variant_info}</p>}
                        </div>
                        <p className="font-semibold text-gray-900 text-xs">
                          Rs. {((item.unit_price || item.final_price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Input & Display */}
                  <div className="pt-3 pb-3 border-t border-gray-100">
                    {appliedCoupon ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-emerald-700" />
                          <div>
                            <span className="text-xs font-bold text-emerald-900">{appliedCoupon.code}</span>
                            <span className="text-xs text-emerald-700 block">Saved Rs. {couponDiscount.toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-gray-400 hover:text-red-500 transition p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Coupon Code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-[#072d1e]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={applyingCoupon || !couponInput.trim()}
                          className="bg-[#072d1e] text-[#edd58c] text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#0c3c28] transition disabled:opacity-50 flex-shrink-0"
                        >
                          {applyingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900">Rs. {subtotal.toLocaleString()}</span>
                    </div>

                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                        <span className="flex items-center gap-1"><Tag size={12} /> Coupon ({appliedCoupon.code})</span>
                        <span>- Rs. {couponDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Truck size={13} /> Delivery</span>
                      <span className={`font-medium ${delivery === 0 ? 'text-emerald-700 font-bold' : 'text-gray-900'}`}>
                        {delivery === 0 ? 'FREE' : `Rs. ${delivery.toLocaleString()}`}
                      </span>
                    </div>

                    {delivery > 0 && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 rounded-lg p-1.5 text-center">
                        Add Rs. {(freeDeliveryThreshold - subtotal).toLocaleString()} more for Free Delivery!
                      </p>
                    )}

                    <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2.5">
                      <span className="text-gray-900">Total Payable</span>
                      <span className="text-[#072d1e]">Rs. {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#072d1e] hover:bg-[#0c3c28] text-[#edd58c] font-bold py-3.5 rounded-xl mt-5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : form.payment_method === 'cod' ? (
                      <>Place COD Order (Rs. {total.toLocaleString()})</>
                    ) : form.payment_method === 'bank_transfer' ? (
                      <>Confirm Bank Transfer Order (Rs. {total.toLocaleString()})</>
                    ) : (
                      <><Lock size={16} /> Pay Online (Rs. {total.toLocaleString()})</>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-gray-400">
                    <Shield size={12} />
                    <span>256-Bit SSL Encrypted & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
