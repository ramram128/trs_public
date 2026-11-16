import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tag, Flame, Copy, Check } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Offers() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coupons/active')
      .then((res) => setCoupons(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Offers & Coupons - TRS Products</title>
        <meta name="description" content="Get the best coupon codes and discounts on premium imported products at TRS Products." />
      </Helmet>

      {/* Hero */}
      <section className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
        {/* Decorative background curve */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" preserveAspectRatio="none" viewBox="0 0 1200 400">
          <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="w-7 h-7 text-[#d8ad38] animate-bounce-slow" />
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight">Special Offers & Coupons</h1>
            <Flame className="w-7 h-7 text-[#d8ad38] animate-bounce-slow" />
          </div>
          <p className="text-[#edd58c] text-sm md:text-base font-medium max-w-xl mx-auto">
            Exclusive deals on premium imported items. Copy your coupon code and save big at checkout!
          </p>
        </div>
      </section>

      {/* Coupons Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-10 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No coupons available right now</h3>
            <p className="text-gray-500 mb-6">Check back soon for exciting deals!</p>
            <Link to="/products" className="inline-block bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 transition">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Tag size={16} className="text-white" />
              </div>
              <div>
                <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider">Active Coupons</p>
                <h2 className="text-xl font-bold text-gray-900">{coupons.length} Coupon{coupons.length !== 1 ? 's' : ''} Available</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function CouponCard({ coupon }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(`Coupon "${coupon.code}" copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const discountText = coupon.coupon_type === 'percentage'
    ? `${coupon.discount_value}% OFF`
    : `Rs. ${coupon.discount_value} OFF`;

  return (
    <div className="relative bg-white rounded-2xl border-2 border-dashed border-amber-300 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg">
              {discountText}
            </span>
            {coupon.min_order_amount > 0 && (
              <p className="text-[10px] text-gray-400 mt-1.5">Min. order Rs. {coupon.min_order_amount.toLocaleString()}</p>
            )}
          </div>
          <Tag size={18} className="text-amber-300 group-hover:text-amber-500 transition-colors" />
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between mb-2 border border-gray-100">
          <span className="font-mono font-bold text-gray-800 tracking-wider text-sm">{coupon.code}</span>
          <button onClick={handleCopy}
            className="text-amber-600 hover:text-amber-700 p-1 rounded-lg hover:bg-amber-50 transition-colors"
            title="Copy code">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {coupon.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{coupon.description}</p>
        )}

        {coupon.end_date && (
          <p className="text-[10px] text-red-400 mt-2">
            Expires: {new Date(coupon.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-amber-50 rounded-full" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-amber-50 rounded-full" />
    </div>
  );
}
