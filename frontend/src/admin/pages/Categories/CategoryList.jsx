import { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import { Plus, Edit2, Trash2, Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: true, sort_order: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const perPage = 20;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCategories({ status: undefined });
      const items = res.data || [];
      setCategories(items);
      setTotal(items.length);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', description: '', status: true, sort_order: 0 });
    setImageFile(null);
    setImagePreview(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', status: cat.status, sort_order: cat.sort_order || 0 });
    setImageFile(null);
    setImagePreview(cat.image || null);
    setShowModal(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      let categoryId;
      if (editing) {
        await adminService.updateCategory(editing.id, form);
        categoryId = editing.id;
        toast.success('Category updated');
      } else {
        const res = await adminService.createCategory(form);
        categoryId = res.data.id;
        toast.success('Category created');
      }

      // Upload image if selected
      if (imageFile && categoryId) {
        setUploadingImage(true);
        try {
          await adminService.uploadCategoryImage(categoryId, imageFile);
        } catch (imgErr) {
          toast.error('Category saved but image upload failed');
        } finally {
          setUploadingImage(false);
        }
      }

      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteCategory(deleteTarget.id);
      toast.success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot delete');
    }
  };

  const columns = [
    { header: 'Image', accessor: 'image', cell: (row) => (
      <img src={row.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'} alt="" className="w-10 h-10 rounded-lg object-cover" />
    )},
    { header: 'Name', accessor: 'name', cell: (row) => <span className="font-semibold">{row.name}</span> },
    { header: 'Slug', accessor: 'slug', cell: (row) => <span className="text-gray-500 text-sm">{row.slug}</span> },
    { header: 'Products', accessor: 'product_count', cell: (row) => <span className="font-medium">{row.product_count || 0}</span> },
    { header: 'Status', accessor: 'status', cell: (row) => (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${row.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {row.status ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Actions', accessor: 'actions', cell: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-600" /></button>
        <button onClick={() => setDeleteTarget(row)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Manage product categories</p>
        </div>
        <button onClick={openCreate} className="bg-[#1a3c2e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a3c2e]/90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>
      <DataTable columns={columns} data={categories} total={total} page={page} perPage={perPage}
        onPageChange={setPage} isLoading={loading} />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                    <button onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow">
                      <X size={14} />
                    </button>
                    {imageFile && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        New image selected
                      </div>
                    )}
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#1a3c2e] hover:bg-gray-50 transition-colors">
                    <Image size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click to upload image</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} className="accent-[#1a3c2e] w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploadingImage}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1a3c2e] rounded-lg hover:bg-[#1a3c2e]/90 disabled:opacity-50 flex items-center justify-center min-w-[80px]">
                {(saving || uploadingImage) ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Category" message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete" type="danger" />
    </div>
  );
};

export default AdminCategories;
