import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag, X, Copy, Check } from 'lucide-react';
import api, { getApiError } from '../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || items.reduce((sum, i) => sum + (i.price || i.unit_price || 0) * (i.quantity || 1), 0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const deliveryCharge = subtotal >= 5000 ? 0 : 350;
  const total = subtotal - couponDiscount + deliveryCharge;

  useEffect(() => {
    api.get('/coupons/active').then((res) => setAvailableCoupons(res.data)).catch(() => {});
    const saved = localStorage.getItem('trs_applied_coupon');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.code) {
          setCouponCode(parsed.code);
          setCouponDiscount(Number(parsed.discount) || 0);
        }
      } catch {}
    }
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    setApplyingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, subtotal });
      const disc = Number(res.data.discount_amount) || 0;
      setCouponDiscount(disc);
      localStorage.setItem('trs_applied_coupon', JSON.stringify({ code: couponCode.trim(), discount: disc }));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getApiError(err));
      setCouponDiscount(0);
      localStorage.removeItem('trs_applied_coupon');
    } finally { setApplyingCoupon(false); }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    localStorage.removeItem('trs_applied_coupon');
    toast.success('Coupon removed');
  };

  return (
    <>
      <Helmet><title>Cart — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-[#072d1e] text-white py-8 md:py-10 border-b border-[#c59a3f]/20">
          <div className="container-custom">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">Shopping Cart</h1>
            <p className="text-[#edd58c] text-sm mt-1">{cart?.item_count || items.length} item(s) in your cart</p>
          </div>
        </div>
        <div className="container-custom py-8">
          {items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-card">
              <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
              <Link to="/products" className="bg-green-900 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white rounded-2xl shadow-card p-4 flex gap-4">
                    <img src={item.image || item.product_image || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=80'} alt={item.name || item.product_name}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name || item.product_name}</h3>
                      <p className="text-green-900 font-bold mt-1">Rs. {(item.price || item.unit_price || 0).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity?.(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="font-semibold text-sm w-8 text-center">{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity?.(item.id, (item.quantity || 1) + 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeItem?.(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <p className="font-bold text-sm">Rs. {((item.price || item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <Link to="/products" className="flex items-center gap-2 text-green-900 font-medium text-sm hover:underline">
                  <ArrowLeft size={16} /> Continue Shopping
                </Link>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
                  <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">Rs. {subtotal.toLocaleString()}</span></div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1"><Tag size={14} /> Coupon ({couponCode.toUpperCase()})</span>
                        <span className="font-semibold">- Rs. {couponDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery</span>
                      <span className={`font-semibold ${deliveryCharge === 0 ? 'text-green-600' : ''}`}>{deliveryCharge === 0 ? 'FREE' : `Rs. ${deliveryCharge}`}</span>
                    </div>
                    {deliveryCharge > 0 && (
                      <p className="text-xs text-green-700 bg-green-50 rounded-lg p-2">Free delivery on orders above Rs. 5,000</p>
                    )}
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-xl text-green-900">Rs. {total.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Available Coupons */}
                  {availableCoupons.length > 0 && couponDiscount === 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Coupons</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableCoupons.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setCouponCode(c.code); toast.success(`Coupon "${c.code}" selected — click Apply`); }}
                            className="w-full flex items-center gap-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-left group"
                          >
                            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Tag size={14} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-700 text-xs">{c.code}</span>
                                <span className="text-[10px] font-semibold text-white bg-amber-500 px-1.5 py-0.5 rounded">
                                  {c.coupon_type === 'percentage' ? `${c.discount_value}% OFF` : `Rs. ${c.discount_value} OFF`}
                                </span>
                              </div>
                              {c.description && <p className="text-[10px] text-gray-500 truncate mt-0.5">{c.description}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coupon Input */}
                  <div className="mt-4">
                    {couponDiscount > 0 ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                        <span className="flex items-center gap-1 text-sm text-green-700 font-medium"><Tag size={14} /> {couponCode.toUpperCase()}</span>
                        <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code"
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
                        <button onClick={applyCoupon} disabled={applyingCoupon}
                          className="bg-green-100 text-green-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-200 transition disabled:opacity-50">
                          {applyingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                  </div>
                  <Link to="/checkout" className="w-full bg-green-900 hover:bg-green-800 text-white font-semibold py-3 rounded-xl mt-6 block text-center transition-colors">
                    Proceed to Checkout
                  </Link>
                  <button onClick={() => clearCart?.()} className="w-full text-red-500 text-sm font-medium mt-3 hover:underline">
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
