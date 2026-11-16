import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orderService } from '../services';
import { Search, Package, Clock, CheckCircle, Truck, MapPin, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get('q') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchTrackOrder = async (query) => {
    if (!query || !query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await orderService.trackOrder(query.trim());
      setOrder(res.data);
    } catch {
      setOrder(null);
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setIdentifier(q);
      fetchTrackOrder(q);
    }
  }, [searchParams]);

  const handleSearch = async (e) => {
    e.preventDefault();
    fetchTrackOrder(identifier);
  };

  const currentStepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.order_status) : -1;

  return (
    <>
      <Helmet><title>Track Order — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-[#072d1e] text-white py-10 md:py-14 relative overflow-hidden">
          {/* Background curve */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="container-custom text-center relative z-10">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-white tracking-tight">Track Your Order</h1>
            <p className="text-[#edd58c] text-sm md:text-base font-medium">Enter your order ID below to view live delivery status and updates</p>
          </div>
        </div>

        <div className="container-custom py-8 max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-card p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter Order Number (e.g., ORD-20260911-0001)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e]" />
              <button type="submit" disabled={loading}
                className="bg-[#072d1e] hover:bg-[#0c2a1d] text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm flex-shrink-0 shadow-sm">
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search size={18} /> Track Order</>}
              </button>
            </div>
          </form>

          {searched && !loading && !order && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-card p-6">
              <Package size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="font-bold text-gray-700">No order found with that identifier.</p>
              <p className="text-sm mt-1 text-gray-400">Please verify your order number and try again.</p>
            </div>
          )}

          {order && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="bg-[#072d1e] text-white p-4 sm:p-5 flex justify-between items-center">
                <div>
                  <p className="text-[#edd58c] text-xs font-semibold uppercase tracking-wider">Order Number</p>
                  <p className="font-bold text-base sm:text-lg text-white font-mono mt-0.5">{order.order_number}</p>
                </div>
                <span className="px-3 py-1 bg-[#c59a3f] text-[#072d1e] rounded-full text-xs font-bold capitalize shadow-sm">
                  {order.order_status?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Shipment Tracking Details Banner */}
              <div className="p-4 sm:p-6 bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#072d1e] text-[#edd58c] flex items-center justify-center flex-shrink-0">
                    <Truck size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Tracking ID</span>
                    {order.tracking_id ? (
                      <div>
                        <span className="text-sm font-bold font-mono text-[#072d1e]">{order.tracking_id}</span>
                        {order.courier_name && (
                          <span className="text-xs text-gray-600 block font-medium mt-0.5">Courier: {order.courier_name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded inline-block mt-0.5">
                        Not Assigned Yet
                      </span>
                    )}
                  </div>
                </div>

                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start sm:self-center bg-[#072d1e] hover:bg-[#0c3c28] text-[#edd58c] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink size={14} /> Track Shipment
                  </a>
                )}
              </div>

              <div className="p-4 sm:p-6">
                {/* Timeline */}
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-[#072d1e] text-[#edd58c]' : 'bg-gray-100 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-green-100 shadow-sm' : ''}`}>
                            <StepIcon size={14} />
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 ${isCompleted ? 'bg-[#072d1e]' : 'bg-gray-200'}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`font-semibold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                          {isCurrent && <p className="text-xs text-[#c59a3f] font-bold mt-0.5">Current status</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-medium capitalize">{order.payment_method} — {order.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-[#072d1e]">Rs. {order.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

