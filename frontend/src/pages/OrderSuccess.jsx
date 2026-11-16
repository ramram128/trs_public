import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orderService } from '../services';
import InvoiceModal from '../components/common/InvoiceModal';
import {
  CheckCircle, Package, MapPin, CreditCard, Calendar, Truck,
  Printer, Upload, Landmark, FileText, Check, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const fetchOrder = () => {
    if (!orderNumber) return;
    orderService.getOrder(orderNumber)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const handleUploadSlip = async (e) => {
    e.preventDefault();
    if (!slipFile) {
      toast.error('Please select a receipt / deposit slip image');
      return;
    }
    setUploadingSlip(true);
    const formData = new FormData();
    formData.append('file', slipFile);

    try {
      await orderService.uploadBankSlip(orderNumber, formData);
      toast.success('Bank deposit slip uploaded successfully!');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload slip');
    } finally {
      setUploadingSlip(false);
    }
  };

  return (
    <>
      <Helmet><title>Order Confirmed — TRS Imports (Quality • Trust • Goodness)</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-200">
              <CheckCircle size={40} className="text-emerald-700" />
            </div>
            <h1 className="text-3xl font-bold font-serif text-[#072d1e] mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 text-sm">Thank you for shopping with TRS Imports. We have received your order.</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#072d1e] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Order Card */}
              <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
                <div className="bg-[#072d1e] text-white p-6 text-center">
                  <p className="text-[#edd58c] text-xs font-semibold uppercase tracking-wider">Order Reference Number</p>
                  <p className="text-2xl font-bold font-mono text-white mt-1">{order.order_number}</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-[#c59a3f]" />
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard size={16} className="text-[#c59a3f]" />
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-semibold text-gray-900 uppercase">
                      {order.payment_method?.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-[#c59a3f]" />
                    <span className="text-gray-500">Delivery Address:</span>
                    <span className="font-medium text-gray-900">{order.address}, {order.city}</span>
                  </div>

                  {/* Items Ordered List */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <p className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">Items Summary</p>
                      <div className="space-y-2.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.product_name} <span className="text-gray-400">× {item.quantity}</span>
                              {item.variant_info && <span className="text-xs text-gray-400 block">{item.variant_info}</span>}
                            </span>
                            <span className="font-semibold text-gray-900">Rs. {item.total?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 mt-4 pt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Subtotal</span>
                          <span>Rs. {order.subtotal?.toLocaleString()}</span>
                        </div>
                        {order.discount_amount > 0 && (
                          <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                            <span>Coupon Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                            <span>- Rs. {order.discount_amount?.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Delivery</span>
                          <span>{order.delivery_charge === 0 ? 'FREE' : `Rs. ${order.delivery_charge?.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 text-[#072d1e]">
                          <span>Total Amount</span>
                          <span>Rs. {order.total?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Bank Transfer Slip Upload Card if selected */}
              {order.payment_method === 'bank_transfer' && (
                <div className="bg-white rounded-2xl shadow-card p-6 border-2 border-indigo-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                      <Landmark size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Direct Bank Transfer Instructions</h3>
                      <p className="text-xs text-gray-500">Please transfer <strong>Rs. {order.total?.toLocaleString()}</strong> to our corporate bank account below:</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/60 rounded-xl p-4 text-xs space-y-1 text-indigo-950 mb-5 border border-indigo-100">
                    <p><strong>Bank:</strong> Commercial Bank of Ceylon PLC</p>
                    <p><strong>Account Name:</strong> TRS Imports & Trading (Pvt) Ltd</p>
                    <p><strong>Account Number:</strong> 1000 8947 2841</p>
                    <p><strong>Branch:</strong> Pettah Branch, Colombo</p>
                    <p><strong>Payment Reference:</strong> {order.order_number}</p>
                  </div>

                  {order.bank_slip_url ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="text-emerald-700" size={18} />
                        <div>
                          <p className="text-xs font-bold text-emerald-900">Deposit Slip Uploaded</p>
                          <p className="text-[11px] text-emerald-700">Your slip has been received and is awaiting admin approval.</p>
                        </div>
                      </div>
                      <a
                        href={order.bank_slip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-900 underline"
                      >
                        View Slip
                      </a>
                    </div>
                  ) : (
                    <form onSubmit={handleUploadSlip} className="space-y-3">
                      <label className="block text-xs font-semibold text-gray-700">
                        Upload Your Bank Transfer Receipt / Screenshot:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          required
                          onChange={(e) => setSlipFile(e.target.files[0])}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200"
                        />
                        <button
                          type="submit"
                          disabled={uploadingSlip || !slipFile}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                        >
                          <Upload size={14} />
                          {uploadingSlip ? 'Uploading...' : 'Submit Slip'}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">Accepted formats: JPG, PNG, WEBP, PDF (Max 5MB)</p>
                    </form>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoice(true)}
                  className="bg-[#c59a3f] hover:bg-[#b08734] text-[#072d1e] px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 text-sm shadow-md"
                >
                  <Printer size={16} /> Print / Save Tax Invoice
                </button>

                <Link
                  to={`/track-order?q=${order.order_number}`}
                  className="bg-[#072d1e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0c2a1d] transition text-center text-sm shadow-md flex items-center gap-2"
                >
                  <Truck size={16} /> Track Order Progress
                </Link>

                <Link
                  to="/"
                  className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:border-[#072d1e] hover:text-[#072d1e] transition text-center text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <p className="text-gray-500">Order details could not be loaded.</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {order && (
        <InvoiceModal
          order={order}
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  );
}
