import React from 'react';
import { Printer, X, Download, CheckCircle, Clock, Truck } from 'lucide-react';

export default function InvoiceModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.order_number?.replace('TRS-', '') || order.order_number || '0000'}`;
  const formattedDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : new Date().toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-gray-200">
        {/* Modal Top Actions Bar (Hidden on print) */}
        <div className="bg-[#072d1e] text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#edd58c] font-bold">Official Invoice & Receipt</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">{order.order_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#c59a3f] hover:bg-[#b08734] text-[#072d1e] text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice" className="p-8 sm:p-10 text-gray-800 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-[#072d1e]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-serif tracking-wider text-[#072d1e]">TRS IMPORTS</span>
              </div>
              <p className="text-xs font-semibold text-[#c59a3f] uppercase tracking-widest mt-0.5">Quality · Trust · Goodness</p>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                <p>No. 45, Main Wholesale Street, Colombo 11, Sri Lanka</p>
                <p>Hotline / WhatsApp: +94 742 975 043 | Email: support@trsimports.com</p>
                <p>Web: www.trsimports.com</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block bg-[#072d1e] text-[#edd58c] font-bold text-xs uppercase px-3 py-1 rounded-md mb-2">
                Commercial Invoice
              </span>
              <p className="text-xs text-gray-500">Invoice No: <strong className="text-gray-900 font-mono">{invoiceNumber}</strong></p>
              <p className="text-xs text-gray-500">Order Ref: <strong className="text-gray-900 font-mono">{order.order_number}</strong></p>
              <p className="text-xs text-gray-500">Date: <strong className="text-gray-900">{formattedDate}</strong></p>
            </div>
          </div>

          {/* Billed To & Payment Status */}
          <div className="grid sm:grid-cols-2 gap-6 py-6 border-b border-gray-100 text-xs">
            <div>
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Customer / Delivered To:</p>
              <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
              <p className="text-gray-600 mt-0.5">{order.address}</p>
              <p className="text-gray-600">{order.city}{order.state ? `, ${order.state}` : ''}{order.pincode ? ` - ${order.pincode}` : ''}</p>
              <p className="text-gray-600">{order.country || 'Sri Lanka'}</p>
              <p className="text-gray-600 mt-1">Phone: <strong>{order.phone}</strong> | Email: {order.email}</p>
            </div>

            <div className="sm:text-right space-y-1">
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Payment & Dispatch Summary:</p>
              <p className="text-gray-600">
                Method: <strong className="uppercase text-gray-900">{order.payment_method?.replace(/_/g, ' ')}</strong>
              </p>
              <p className="text-gray-600">
                Payment Status:{' '}
                <span className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                  order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.payment_status}
                </span>
              </p>
              <p className="text-gray-600">
                Order Status:{' '}
                <span className="font-semibold text-gray-900 uppercase">{order.order_status?.replace(/_/g, ' ')}</span>
              </p>
              {order.tracking_id && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-left sm:text-right">
                  <p className="text-[11px] text-gray-600">
                    Courier: <strong>{order.courier_name || 'Standard Courier'}</strong>
                  </p>
                  <p className="text-[11px] font-mono text-[#072d1e] font-bold">
                    Tracking ID: {order.tracking_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="py-2.5 px-3 font-bold text-gray-700 w-10">#</th>
                  <th className="py-2.5 px-3 font-bold text-gray-700">Product Description</th>
                  <th className="py-2.5 px-3 font-bold text-gray-700 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 font-bold text-gray-700 text-right w-24">Price (Rs.)</th>
                  <th className="py-2.5 px-3 font-bold text-gray-700 text-right w-28">Total (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(order.items || []).map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="py-3 px-3 text-gray-400 font-mono">{index + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-900">{item.product_name}</p>
                      {item.variant_info && <p className="text-[11px] text-gray-500">{item.variant_info}</p>}
                      {item.product_sku && <p className="text-[10px] text-gray-400 font-mono">SKU: {item.product_sku}</p>}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-gray-700">{(item.unit_price || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{(item.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Totals */}
          <div className="flex justify-end pt-2 pb-6 border-t border-gray-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-900">Rs. {(order.subtotal || 0).toLocaleString()}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount {order.coupon_code ? `(${order.coupon_code})` : ''}:</span>
                  <span>- Rs. {(order.discount_amount || 0).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span className="font-medium text-gray-900">
                  {order.delivery_charge === 0 ? 'FREE' : `Rs. ${(order.delivery_charge || 0).toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t-2 border-[#072d1e]">
                <span>Grand Total:</span>
                <span className="text-[#072d1e] text-base">Rs. {(order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-gray-100 text-center text-[10px] text-gray-400 space-y-1">
            <p className="font-medium text-gray-600">Thank you for your business with TRS Imports!</p>
            <p>This is a computer-generated commercial tax invoice. For returns or support inquiries, contact WhatsApp: +94 742 975 043.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
