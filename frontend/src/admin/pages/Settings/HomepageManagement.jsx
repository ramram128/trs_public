import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Image, Eye, EyeOff } from 'lucide-react';

export default function HomepageManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', button_text: 'Shop Now', sort_order: 0, is_active: true, position: 'hero' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const res = await adminService.getBanners();
      setBanners(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateBanner(editing.id, form);
        toast.success('Banner updated');
      } else {
        await adminService.createBanner(form);
        toast.success('Banner created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: 'Shop Now', sort_order: 0, is_active: true, position: 'hero' });
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteBanner(deleteId);
      toast.success('Banner deleted');
      setDeleteId(null);
      fetchBanners();
    } catch (err) { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Homepage Management</h1>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 flex items-center gap-2">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><Image size={48} className="mx-auto text-gray-300 mb-3" /><p>No banners yet</p></div>
        ) : (
          <div className="space-y-3">
            {banners.map(banner => (
              <div key={banner.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                {banner.image_url && <img src={banner.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{banner.title}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{banner.position}</span>
                    {!banner.is_active && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded">Inactive</span>}
                  </div>
                  {banner.subtitle && <p className="text-xs text-gray-500 mt-0.5">{banner.subtitle}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(banner); setForm({ title: banner.title, subtitle: banner.subtitle || '', image_url: banner.image_url || '', link_url: banner.link_url || '', button_text: banner.button_text, sort_order: banner.sort_order, is_active: banner.is_active, position: banner.position }); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteId(banner.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="font-bold text-lg mb-4">{editing ? 'Edit Banner' : 'Create Banner'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <input type="url" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                  <input type="text" value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="/products" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                  <input type="text" value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                  <select value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    <option value="hero">Hero</option>
                    <option value="promo">Promo</option>
                    <option value="sidebar">Sidebar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded" />
                    Active
                  </label>
                </div>
              </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="font-bold text-lg mb-2">Delete Banner?</h3>
            <p className="text-gray-500 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
