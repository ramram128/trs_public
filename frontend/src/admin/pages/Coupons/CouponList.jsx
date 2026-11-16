import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import DataTable from '../../components/DataTable';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

export default function CouponList() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', coupon_type: 'percentage', discount_value: 10, min_order_amount: 0, max_uses: '', max_uses_per_user: 1, start_date: '', end_date: '', is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await adminService.getCoupons();
      setCoupons(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, max_uses: form.max_uses ? parseInt(form.max_uses) : null };
      if (editing) {
        await adminService.updateCoupon(editing.id, data);
        toast.success('Coupon updated');
      } else {
        await adminService.createCoupon(data);
        toast.success('Coupon created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ code: '', description: '', coupon_type: 'percentage', discount_value: 10, min_order_amount: 0, max_uses: '', max_uses_per_user: 1, start_date: '', end_date: '', is_active: true });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save coupon');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteCoupon(deleteId);
      toast.success('Coupon deleted');
      setDeleteId(null);
      fetchCoupons();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const columns = [
    { header: 'Code', cell: (c) => <span className="font-mono font-bold text-green-700">{c.code}</span> },
    { header: 'Type', cell: (c) => <span className="capitalize">{c.coupon_type}</span> },
    { header: 'Discount', cell: (c) => c.coupon_type === 'percentage' ? `${c.discount_value}%` : `Rs. ${c.discount_value}` },
    { header: 'Min. Order', cell: (c) => `Rs. ${c.min_order_amount}` },
    { header: 'Used', cell: (c) => `${c.used_count}${c.max_uses ? `/${c.max_uses}` : ''}` },
    { header: 'Status', cell: (c) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {c.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Actions', cell: (c) => (
      <div className="flex gap-2">
        <button onClick={() => { setEditing(c); setForm({ code: c.code, description: c.description || '', coupon_type: c.coupon_type, discount_value: c.discount_value, min_order_amount: c.min_order_amount, max_uses: c.max_uses || '', max_uses_per_user: c.max_uses_per_user, start_date: c.start_date ? c.start_date.slice(0,10) : '', end_date: c.end_date ? c.end_date.slice(0,10) : '', is_active: c.is_active }); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 size={14} /></button>
        <button onClick={() => setDeleteId(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 flex items-center gap-2">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><Tag size={48} className="mx-auto text-gray-300 mb-3" /><p>No coupons yet</p></div>
        ) : (
          <DataTable columns={columns} data={coupons} />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editing ? 'Edit Coupon' : 'Create Coupon'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                  <select value={form.coupon_type} onChange={e => setForm({...form, coupon_type: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount Value *</label>
                  <input type="number" value={form.discount_value} onChange={e => setForm({...form, discount_value: parseFloat(e.target.value) || 0})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min. Order Amount</label>
                  <input type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: parseFloat(e.target.value) || 0})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Per User</label>
                  <input type="number" value={form.max_uses_per_user} onChange={e => setForm({...form, max_uses_per_user: parseInt(e.target.value) || 1})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" min="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded" />
                Active
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal 
          isOpen={true}
          title="Delete Coupon"
          message="Are you sure you want to delete this coupon? This action cannot be undone." 
          confirmText="Delete"
          onConfirm={handleDelete} 
          onClose={() => setDeleteId(null)} 
        />
      )}
    </div>
  );
}
