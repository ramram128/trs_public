import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, MessageCircle, Send, Building2, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getApiError } from '../services/api';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const isRfqParam = searchParams.get('type') === 'bulk_rfq';
  const productParam = searchParams.get('product') || '';
  const skuParam = searchParams.get('sku') || '';

  const [activeTab, setActiveTab] = useState(isRfqParam ? 'bulk_rfq' : 'general');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: productParam ? `Bulk Quotation for ${productParam}` : '',
    message: productParam ? `Hello, we would like to request wholesale quotation and terms for ${productParam} (SKU: ${skuParam}).` : '',
    inquiry_type: isRfqParam ? 'bulk_rfq' : 'general',
    company_name: '',
    target_qty: '',
    target_price: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isRfqParam) {
      setActiveTab('bulk_rfq');
      setForm((prev) => ({
        ...prev,
        inquiry_type: 'bulk_rfq',
        subject: productParam ? `Bulk RFQ: ${productParam}` : prev.subject || 'Bulk Wholesale Quotation Request',
      }));
    }
  }, [isRfqParam, productParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setForm((prev) => ({
      ...prev,
      inquiry_type: tab,
      subject: tab === 'bulk_rfq' ? (productParam ? `Bulk RFQ: ${productParam}` : 'Bulk Wholesale Quotation Request') : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent! We will get back to you within 24 hours.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Contact Us — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
          {/* Background curve */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="container-custom text-center relative z-10">
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-3 text-white tracking-tight">Contact Us</h1>
            <p className="text-[#edd58c] text-sm md:text-base font-medium max-w-lg mx-auto">
              We'd love to hear from you. Have a question about our products or your bulk orders? Get in touch!
            </p>
          </div>
        </div>

        <div className="container-custom py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              {[
                { icon: Phone, label: 'Phone', value: '+94 742 975 043', href: 'tel:+94742975043' },
                { icon: Mail, label: 'Email', value: 'support@trsimports.com', href: 'mailto:support@trsimports.com' },
                { icon: MapPin, label: 'Address', value: 'Sri Lanka', href: null },
                { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: 'https://wa.me/94742975043' },
              ].map(({ icon: Icon, label, value, href }) => {
                const CardWrapper = href ? 'a' : 'div';
                const cardProps = href 
                  ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: "noopener noreferrer" }
                  : {};
                
                return (
                  <CardWrapper 
                    key={label} 
                    {...cardProps}
                    className="bg-white hover:bg-[#072d1e] rounded-2xl shadow-sm hover:shadow-xl hover:shadow-[#072d1e]/20 p-5 flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-1 group border border-gray-100 hover:border-[#c59a3f]/40 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-green-50 group-hover:bg-[#0a3a27] rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 shadow-sm group-hover:shadow-md">
                      <Icon size={20} className="text-[#072d1e] group-hover:text-[#edd58c] transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 group-hover:text-green-200/80 transition-colors duration-300">{label}</p>
                      <p className="font-bold text-gray-900 group-hover:text-white text-sm transition-colors duration-300 tracking-wide mt-0.5">{value}</p>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-[#072d1e]/10 p-6 sm:p-8 border border-gray-100 hover:border-[#c59a3f]/30 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#c59a3f]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                {/* Form Mode Tabs */}
                <div className="flex border-b border-gray-100 mb-6 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabChange('general')}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === 'general'
                        ? 'border-[#072d1e] text-[#072d1e]'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <MessageCircle size={16} />
                    General Inquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('bulk_rfq')}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === 'bulk_rfq'
                        ? 'border-[#072d1e] text-[#072d1e]'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <Building2 size={16} className="text-[#c59a3f]" />
                    Bulk Order / Wholesale (RFQ)
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {activeTab === 'bulk_rfq' ? 'Request for Wholesale Quotation (RFQ)' : 'Send us a Message'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {activeTab === 'bulk_rfq'
                      ? 'Submit your volume quantity requirements for special wholesale pricing and container shipping.'
                      : 'We usually respond to inquiries within 24 business hours.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Full Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] focus:border-transparent transition-all shadow-sm bg-gray-50/50 hover:bg-white" 
                        placeholder="e.g. John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] focus:border-transparent transition-all shadow-sm bg-gray-50/50 hover:bg-white" 
                        placeholder="john@example.com" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone / WhatsApp Number <span className="text-red-500">*</span></label>
                      <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] focus:border-transparent transition-all shadow-sm bg-gray-50/50 hover:bg-white" 
                        placeholder="+94 77 123 4567" />
                    </div>

                    {activeTab === 'bulk_rfq' ? (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business / Company Name</label>
                        <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] focus:border-transparent transition-all shadow-sm bg-gray-50/50 hover:bg-white" 
                          placeholder="e.g. ABC Traders Pvt Ltd" />
                      </div>
                    ) : (
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                        <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] focus:border-transparent transition-all shadow-sm bg-gray-50/50 hover:bg-white cursor-pointer">
                          <option value="">Select a subject</option>
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Order Issue">Order Issue</option>
                          <option value="Returns & Refunds">Returns & Refunds</option>
                          <option value="Product Question">Product Question</option>
                          <option value="Wholesale">Wholesale Inquiry</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Bulk RFQ specific fields */}
                  {activeTab === 'bulk_rfq' && (
                    <div className="grid sm:grid-cols-3 gap-5 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Product / Item Name</label>
                        <input
                          type="text"
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          placeholder="e.g. Wireless Mouse"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#072d1e] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Target Quantity (Units) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={form.target_qty}
                          onChange={(e) => setForm({ ...form, target_qty: e.target.value })}
                          placeholder="e.g. 50, 100, 500"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#072d1e] bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Target Price (LKR / Unit)</label>
                        <input
                          type="number"
                          value={form.target_price}
                          onChange={(e) => setForm({ ...form, target_price: e.target.value })}
                          placeholder="e.g. 750 (Optional)"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#072d1e] bg-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {activeTab === 'bulk_rfq' ? 'Additional Order Requirements / Delivery Timeline' : 'Message'} <span className="text-red-500">*</span>
                    </label>
                    <textarea rows={activeTab === 'bulk_rfq' ? 4 : 5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] focus:border-transparent transition-all shadow-sm bg-gray-50/50 hover:bg-white resize-none"
                      placeholder={activeTab === 'bulk_rfq' ? "Please specify your target delivery dates, destination city, packaging requirements or custom branding needs..." : "How can we help you today?"} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="bg-[#072d1e] hover:bg-[#0a3a27] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto">
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        {activeTab === 'bulk_rfq' ? 'Submit RFQ Quotation Request' : 'Send Message'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
