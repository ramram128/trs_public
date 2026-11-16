import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import DataTable from '../../components/DataTable';
import toast from 'react-hot-toast';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchReviews(); }, [page, statusFilter]);

  const fetchReviews = async () => {
    try {
      const res = await adminService.getReviews({ page, status: statusFilter || undefined });
      setReviews(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleApproval = async (id) => {
    try {
      await adminService.toggleReviewApproval(id);
      toast.success('Review updated');
      fetchReviews();
    } catch (err) { toast.error('Failed to update'); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await adminService.deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const columns = [
    { header: 'Product', cell: (r) => <span className="text-sm">{r.product_name || 'N/A'}</span> },
    { header: 'Customer', cell: (r) => <span className="text-sm font-medium">{r.user_name}</span> },
    { header: 'Rating', cell: (r) => (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
      </div>
    )},
    { header: 'Review', cell: (r) => (
      <div className="max-w-xs">
        {r.title && <p className="font-medium text-sm">{r.title}</p>}
        {r.comment && <p className="text-xs text-gray-500 truncate">{r.comment}</p>}
      </div>
    )},
    { header: 'Status', cell: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {r.is_approved ? 'Approved' : 'Pending'}
      </span>
    )},
    { header: 'Date', cell: (r) => <span className="text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</span> },
    { header: 'Actions', cell: (r) => (
      <div className="flex gap-2">
        <button onClick={() => toggleApproval(r.id)} className={r.is_approved ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'} title={r.is_approved ? 'Hide' : 'Approve'}>
          {r.is_approved ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <div className="flex gap-2">
          {['', 'approved', 'pending'].map(f => (
            <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === f ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><Star size={48} className="mx-auto text-gray-300 mb-3" /><p>No reviews found</p></div>
        ) : (
          <>
            <DataTable columns={columns} data={reviews} />
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1 rounded-lg bg-gray-100 text-sm disabled:opacity-50">Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-3 py-1 rounded-lg bg-gray-100 text-sm disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
