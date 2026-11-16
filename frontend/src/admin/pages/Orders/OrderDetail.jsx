import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../../services';
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock, CheckCircle, Truck, ExternalLink, Send, Mail, MessageCircle, Share2, Printer, FileText, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceModal from '../../../components/common/InvoiceModal';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

const AdminOrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  
  // Tracking form state
  const [trackingForm, setTrackingForm] = useState({
    tracking_id: '',
    courier_name: '',
    tracking_url: '',
    order_status: '',
    notify_customer: true,
  });
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSuccessMsg, setTrackingSuccessMsg] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await adminService.getOrder(id);
      setOrder(res.data);
      setTrackingForm({
        tracking_id: res.data.tracking_id || '',
        courier_name: res.data.courier_name || '',
        tracking_url: res.data.tracking_url || '',
        order_status: res.data.order_status || 'shipped',
        notify_customer: true,
      });
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setStatusLoading(true);
    try {
      await adminService.updateOrderStatus(id, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePaymentUpdate = async (newStatus) => {
    setPaymentLoading(true);
    try {
      await adminService.updatePaymentStatus(id, { status: newStatus });
      toast.success(`Payment status updated to ${newStatus}`);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update payment status');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReturnStatusUpdate = async (newReturnStatus) => {
    setReturnLoading(true);
    try {
      await adminService.updateReturnStatus(id, { return_status: newReturnStatus });
      toast.success(`Return request updated to ${newReturnStatus}`);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update return status');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleOpenGmail = () => {
    if (!order) return;
    const trackingId = trackingForm.tracking_id || order.tracking_id || 'N/A';
    const courier = trackingForm.courier_name || order.courier_name || 'Courier Service';
    const trackingUrl = trackingForm.tracking_url || order.tracking_url || `${window.location.origin}/track-order`;
    
    const subject = encodeURIComponent(`Your TRS Products Order Has Been Shipped - #${order.order_number}`);
    const body = encodeURIComponent(
`Hi ${order.customer_name || 'Valued Customer'},

Thank you for your order with TRS Products!

Your order #${order.order_number} has been dispatched.

📦 Tracking Details:
• Tracking Number: ${trackingId}
• Courier Partner: ${courier}
• Track Shipment: ${trackingUrl}

📍 Delivery Destination:
${order.address}, ${order.city}${order.state ? `, ${order.state}` : ''}

For any inquiries, WhatsApp us at +94 742 975 043.

Warm regards,
TRS Products Team`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  const handleOpenWhatsApp = () => {
    if (!order) return;
    const trackingId = trackingForm.tracking_id || order.tracking_id || 'N/A';
    const courier = trackingForm.courier_name || order.courier_name || 'Courier Partner';
    const phoneClean = (order.phone || '').replace(/[^0-9]/g, '');
    
    const text = encodeURIComponent(
`*TRS IMPORTS - Order Shipped!* 🚚

Hi *${order.customer_name || 'Customer'}*, your order *#${order.order_number}* has been dispatched.

📦 *Tracking ID:* ${trackingId}
🚚 *Courier:* ${courier}
🔗 *Track Order:* ${trackingForm.tracking_url || `${window.location.origin}/track-order`}

Thank you for shopping with TRS Products!`
    );

    const waUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handleResendTrackingEmail = async () => {
    if (!order?.tracking_id) {
      toast.error('Please assign a tracking ID first');
      return;
    }
    setResendingEmail(true);
    try {
      const res = await adminService.resendTrackingEmail(id);
      toast.success(res.data?.message || `Tracking email sent to ${order.email}`);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to send tracking email';
      toast.error(errorMsg);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleTrackingUpdate = async (e) => {
    e.preventDefault();
    if (order.tracking_id && trackingForm.tracking_id !== order.tracking_id) {
      const confirmChange = window.confirm(
        `Tracking ID is being changed from "${order.tracking_id}" to "${trackingForm.tracking_id}". Do you want to proceed and send an updated notification to the customer?`
      );
      if (!confirmChange) return;
    }

    setTrackingLoading(true);
    setTrackingSuccessMsg('');
    try {
      const res = await adminService.updateOrderTracking(id, {
        tracking_id: trackingForm.tracking_id,
        courier_name: trackingForm.courier_name,
        tracking_url: trackingForm.tracking_url,
        order_status: trackingForm.order_status,
        notify_customer: trackingForm.notify_customer,
      });

      const message = res.data?.message || 'Tracking ID updated successfully';
      toast.success(message);
      if (res.data?.email_sent) {
        setTrackingSuccessMsg('✓ Tracking ID updated successfully\n✓ Customer notification email sent');
      } else if (res.data?.email_note) {
        setTrackingSuccessMsg(`✓ Tracking ID updated successfully\n⚠️ Note: ${res.data.email_note}`);
      } else {
        setTrackingSuccessMsg('✓ Tracking ID updated successfully');
      }
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update tracking details');
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return <div className="text-center py-12 text-gray-500">Order not found</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                order.order_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.order_status?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowInvoice(true)}
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#1a3c2e]" />
            Print Packing Slip / Invoice
          </button>

          {/* Current Tracking Summary Pill */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 text-sm">
            <Truck className="w-5 h-5 text-[#1a3c2e]" />
            <div>
              <span className="text-xs text-gray-500 block font-medium">Tracking ID</span>
              {order.tracking_id ? (
                <span className="font-mono font-bold text-gray-900">{order.tracking_id}</span>
              ) : (
                <span className="text-amber-600 font-semibold text-xs">Not Assigned Yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Return Request (RMA) Card */}
          {(order.return_requested || order.return_reason || order.return_status || order.order_status === 'return_requested') && (
            <div className="bg-red-50/70 border-2 border-red-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-base">Customer Return / Refund Request</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  order.return_status === 'approved' ? 'bg-green-100 text-green-800' :
                  order.return_status === 'rejected' ? 'bg-red-200 text-red-900' :
                  order.return_status === 'completed' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {order.return_status || 'Pending Review'}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-red-100 text-sm mb-4">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Reason Stated by Customer:</p>
                <p className="text-gray-800 italic">"{order.return_reason || 'No specific reason provided'}"</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={returnLoading || order.return_status === 'approved'}
                  onClick={() => handleReturnStatusUpdate('approved')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Return & Provide Label
                </button>
                <button
                  type="button"
                  disabled={returnLoading || order.return_status === 'rejected'}
                  onClick={() => handleReturnStatusUpdate('rejected')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject Return Request
                </button>
                <button
                  type="button"
                  disabled={returnLoading || order.return_status === 'completed'}
                  onClick={() => handleReturnStatusUpdate('completed')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Return Received & Refunded
                </button>
              </div>
            </div>
          )}
          {/* Shipment Tracking Card */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Shipment Tracking</h2>
                  <p className="text-xs text-gray-500">Assign courier tracking ID and notify customer automatically</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Current Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  order.tracking_id ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {order.tracking_id ? `Assigned: ${order.tracking_id}` : 'Not Assigned Yet'}
                </span>
              </div>
            </div>

            <form onSubmit={handleTrackingUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tracking ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRS987654321 / DHL12345678"
                    value={trackingForm.tracking_id}
                    onChange={(e) => setTrackingForm({ ...trackingForm, tracking_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] focus:border-[#1a3c2e]"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Courier tracking number provided by shipping company</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Courier / Shipping Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DHL, Pronto, Domex, Certis Lanka"
                    value={trackingForm.courier_name}
                    onChange={(e) => setTrackingForm({ ...trackingForm, courier_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] focus:border-[#1a3c2e]"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Shipping provider or courier partner</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tracking URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={trackingForm.tracking_url}
                    onChange={(e) => setTrackingForm({ ...trackingForm, tracking_url: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] focus:border-[#1a3c2e]"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Direct web link for customer package tracking</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Order Status
                  </label>
                  <select
                    value={trackingForm.order_status}
                    onChange={(e) => setTrackingForm({ ...trackingForm, order_status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] focus:border-[#1a3c2e] bg-white capitalize"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-400 mt-1 block">Optionally advance order status (e.g. Shipped)</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trackingForm.notify_customer}
                    onChange={(e) => setTrackingForm({ ...trackingForm, notify_customer: e.target.checked })}
                    className="rounded text-[#1a3c2e] focus:ring-[#1a3c2e] w-4 h-4"
                  />
                  <span>Send shipment notification email to customer ({order.email})</span>
                </label>

                <div className="flex items-center gap-2">
                  {order.tracking_id && (
                    <button
                      type="button"
                      onClick={handleResendTrackingEmail}
                      disabled={resendingEmail}
                      title="Resend the tracking details email to customer"
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resendingEmail ? (
                        <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-amber-700" />
                          Resend Tracking Email
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={trackingLoading || !trackingForm.tracking_id.trim()}
                    className="bg-[#1a3c2e] hover:bg-[#132c22] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {trackingLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#c9a227]" />
                        Update Shipment
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Password-Free Dispatch Options */}
              <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-lg">
                <div className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                  <Share2 className="w-4 h-4 text-emerald-700" />
                  <span>1-Click Password-Free Notification:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenGmail}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-semibold transition-all shadow-sm"
                    title="Open Gmail compose tab with pre-filled tracking details (No password needed)"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Open & Send in Gmail
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all shadow-sm"
                    title="Send tracking details to customer via WhatsApp (No password needed)"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Send via WhatsApp
                  </button>
                </div>
              </div>

              {trackingSuccessMsg && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 whitespace-pre-line">
                  {trackingSuccessMsg}
                </div>
              )}
            </form>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5" /> Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-4 items-center p-3 bg-gray-50 rounded-lg">
                  <img src={item.product_image || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=60'} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × Rs. {item.unit_price?.toLocaleString()}</p>
                  </div>
                  <p className="font-semibold">Rs. {item.total?.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>Rs. {order.subtotal?.toLocaleString()}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-700 font-medium">
                  <span>Coupon Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span>- Rs. {order.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span>{order.delivery_charge === 0 ? 'FREE' : `Rs. ${order.delivery_charge?.toLocaleString()}`}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-[#1a3c2e]">Rs. {order.total?.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Status History */}
          {order.status_history?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Status History</h2>
              <div className="space-y-3">
                {order.status_history.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 bg-[#1a3c2e] text-white rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{h.status?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{h.note || 'No note'} — {new Date(h.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-gray-500">{order.email}</p>
              <p className="text-gray-500">{order.phone}</p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Delivery Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.address}</p>
              <p>{order.city}{order.state ? `, ${order.state}` : ''}{order.pincode ? ` ${order.pincode}` : ''}</p>
              <p>{order.country}</p>
            </div>
          </div>

          {/* Quick Status Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5" /> Quick Status Update</h2>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} disabled={statusLoading || order.order_status === s}
                  onClick={() => handleStatusUpdate(s)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                    order.order_status === s ? 'bg-[#1a3c2e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status & Bank Slip Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment Details</h2>
              <span className="text-xs px-2.5 py-1 bg-gray-100 font-bold text-gray-800 rounded-md uppercase">
                {order.payment_method?.replace(/_/g, ' ') || 'COD'}
              </span>
            </div>

            {/* Bank Transfer Slip Verification */}
            {order.payment_method === 'bank_transfer' && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950">Direct Bank Transfer Receipt</span>
                  {order.bank_slip_url ? (
                    <span className="text-[11px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">Slip Uploaded</span>
                  ) : (
                    <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Slip Pending</span>
                  )}
                </div>

                {order.bank_slip_url ? (
                  <div className="space-y-2">
                    <a
                      href={order.bank_slip_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block group relative rounded-lg overflow-hidden border border-blue-200 bg-white"
                    >
                      <img
                        src={order.bank_slip_url}
                        alt="Bank deposit slip"
                        className="w-full h-36 object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <Eye className="w-4 h-4" /> Click to view full slip
                      </div>
                    </a>
                    {order.payment_status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => handlePaymentUpdate('paid')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Verify Slip & Mark as Paid
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-blue-800">
                    Customer chose Direct Bank Transfer. Bank deposit slip has not been submitted yet.
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Update Payment Status:</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <button key={s} disabled={paymentLoading || order.payment_status === s}
                    onClick={() => handlePaymentUpdate(s)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                      order.payment_status === s ? 'bg-[#1a3c2e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {order.notes && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Order Notes:</p>
                {order.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Tax Invoice & Packing Slip Modal */}
      <InvoiceModal isOpen={showInvoice} onClose={() => setShowInvoice(false)} order={order} />
    </div>
  );
};

export default AdminOrderDetail;

