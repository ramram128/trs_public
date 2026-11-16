import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  Building2, 
  Mail, 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  Phone, 
  ExternalLink,
  Trash2,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InquiriesList() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'bulk_rfq', 'general'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'resolved'
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await adminService.getContactInquiries();
      setInquiries(res.data?.items || res.data || []);
    } catch (err) {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await adminService.resolveContactInquiry(id);
      toast.success('Inquiry marked as resolved');
      fetchInquiries();
    } catch (err) {
      toast.error('Failed to update inquiry status');
    } finally {
      setResolvingId(null);
    }
  };

  const handleReopen = async (id) => {
    setResolvingId(id);
    try {
      await adminService.updateContactInquiryStatus(id, { status: 'pending' });
      toast.success('Inquiry reopened');
      fetchInquiries();
    } catch (err) {
      toast.error('Failed to reopen inquiry');
    } finally {
      setResolvingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteContactInquiry(deleteTarget.id);
      toast.success('Inquiry deleted successfully');
      setDeleteTarget(null);
      fetchInquiries();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete inquiry');
    } finally {
      setDeleting(false);
    }
  };

  const filteredInquiries = inquiries.filter((item) => {
    const isResolved = item.status === 'resolved' || item.is_resolved;

    // Type filter
    if (filterType === 'bulk_rfq' && item.inquiry_type !== 'bulk_rfq') return false;
    if (filterType === 'general' && item.inquiry_type === 'bulk_rfq') return false;

    // Status filter
    if (statusFilter === 'pending' && isResolved) return false;
    if (statusFilter === 'resolved' && !isResolved) return false;

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(term);
      const matchEmail = item.email?.toLowerCase().includes(term);
      const matchCompany = item.company_name?.toLowerCase().includes(term);
      const matchSubject = item.subject?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchCompany && !matchSubject) return false;
    }

    return true;
  });

  const rfqCount = inquiries.filter(i => i.inquiry_type === 'bulk_rfq' && !(i.status === 'resolved' || i.is_resolved)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Inquiries & Bulk RFQs</h1>
            {rfqCount > 0 && (
              <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-300">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                {rfqCount} Pending RFQ{rfqCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer queries, complaints, and wholesale bulk quote requests.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-[#1a3c2e] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Inquiries ({inquiries.length})
            </button>
            <button
              onClick={() => setFilterType('bulk_rfq')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterType === 'bulk_rfq'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Bulk RFQs ({inquiries.filter(i => i.inquiry_type === 'bulk_rfq').length})
            </button>
            <button
              onClick={() => setFilterType('general')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'general'
                  ? 'bg-[#1a3c2e] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              General Inquiries ({inquiries.filter(i => i.inquiry_type !== 'bulk_rfq').length})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1a3c2e]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, company, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] bg-gray-50/50 hover:bg-white"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Inquiries Found</h3>
          <p className="text-xs text-gray-500 mt-1">
            {searchTerm || filterType !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Customer messages and bulk RFQs will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((item) => {
            const isRfq = item.inquiry_type === 'bulk_rfq';
            const isResolved = item.status === 'resolved' || item.is_resolved;
            const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all p-5 ${
                  isRfq
                    ? 'border-amber-200/80 bg-gradient-to-r from-amber-50/30 to-white'
                    : 'border-gray-150'
                } ${isResolved ? 'opacity-75' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isRfq ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-amber-700" />
                          Wholesale Bulk RFQ
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-900 font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                          General Inquiry
                        </span>
                      )}

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isResolved ? '✓ Resolved' : '● Pending Action'}
                      </span>

                      <span className="text-[11px] text-gray-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{item.subject || 'No Subject'}</h3>
                      {item.company_name && (
                        <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                          🏢 Company: <span className="text-gray-800">{item.company_name}</span>
                        </p>
                      )}
                    </div>

                    {/* RFQ Target Quantities Badge */}
                    {isRfq && (item.target_qty || item.target_price) && (
                      <div className="inline-flex flex-wrap gap-4 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs">
                        {item.target_qty && (
                          <div>
                            <span className="text-gray-500 font-medium">Requested Qty: </span>
                            <span className="font-mono font-bold text-gray-900">{item.target_qty} Units</span>
                          </div>
                        )}
                        {item.target_price && (
                          <div>
                            <span className="text-gray-500 font-medium">Target Price: </span>
                            <span className="font-mono font-bold text-emerald-800">Rs. {Number(item.target_price).toLocaleString()} / unit</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Box */}
                    <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-150 text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {item.message}
                    </div>

                    {/* Contact Info Pills */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                      <span className="font-medium text-gray-900">From: {item.name}</span>
                      <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> {item.email}
                      </a>
                      {item.phone && (
                        <a href={`tel:${item.phone}`} className="text-gray-700 hover:underline flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5" /> {item.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex md:flex-col items-center gap-2 shrink-0">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hi ${item.name}, thank you for contacting TRS Imports regarding "${item.subject || 'your inquiry'}".`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Reply
                      </a>
                    )}

                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject || 'TRS Imports Inquiry'}`)}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email Reply
                    </a>

                    {!isResolved ? (
                      <button
                        type="button"
                        disabled={resolvingId === item.id}
                        onClick={() => handleResolve(item.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-green-50 border border-green-300 text-green-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        Mark Resolved
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={resolvingId === item.id}
                        onClick={() => handleReopen(item.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-50 border border-amber-300 text-amber-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        Reopen
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Inquiry"
        message={`Are you sure you want to delete inquiry #${deleteTarget?.id} from "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
