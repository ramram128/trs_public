import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import { ArrowLeft, Upload, X, Save, Plus, Trash2, Building2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [bulkTiers, setBulkTiers] = useState([]);
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      category_id: '',
      description: '',
      price: '',
      discount_percent: 0,
      stock: 0,
      low_stock_threshold: 5,
      weight: '',
      unit: 'kg',
      moq: 1,
      status: true,
      is_featured: false,
      is_new_arrival: false,
      is_best_seller: false,
      meta_title: '',
      meta_description: '',
      tags: ''
    }
  });

  const addBulkTier = () => {
    setBulkTiers(prev => [...prev, { min_qty: 10, unit_price: '', discount_pct: '' }]);
  };

  const removeBulkTier = (index) => {
    setBulkTiers(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkTier = (index, field, value) => {
    setBulkTiers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value === '' ? '' : Number(value) };
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await adminService.getCategories();
        setCategories(catRes.data || []);

        if (isEditMode) {
          const prodRes = await adminService.getProduct(id);
          const product = prodRes.data;
          reset({
            name: product.name,
            sku: product.sku || '',
            category_id: product.category_id || '',
            description: product.description || '',
            price: product.price,
            discount_percent: product.discount_percent,
            stock: product.stock,
            low_stock_threshold: product.low_stock_threshold,
            weight: product.weight || '',
            unit: product.unit || 'kg',
            moq: product.moq || 1,
            status: product.status,
            is_featured: product.is_featured,
            is_new_arrival: product.is_new_arrival,
            is_best_seller: product.is_best_seller,
            meta_title: product.meta_title || '',
            meta_description: product.meta_description || '',
            tags: product.tags || ''
          });
          if (product.bulk_tiers) {
            const parsed = Array.isArray(product.bulk_tiers)
              ? product.bulk_tiers
              : (typeof product.bulk_tiers === 'string' ? JSON.parse(product.bulk_tiers || '[]') : []);
            setBulkTiers(parsed);
          }
          if (product.images) {
            setExistingImages(product.images);
          }
        }
      } catch (err) {
        toast.error('Failed to load data');
        if (isEditMode) navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode, reset, navigate]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        isMain: images.length === 0 && existingImages.length === 0
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeNewImage = (index) => {
    setImages(prev => {
      const newImgs = [...prev];
      URL.revokeObjectURL(newImgs[index].preview);
      newImgs.splice(index, 1);
      if (newImgs.length > 0 && !newImgs.some(img => img.isMain) && existingImages.length === 0) {
        newImgs[0].isMain = true;
      }
      return newImgs;
    });
  };

  const deleteExistingImage = async (imageId) => {
    try {
      await adminService.deleteProductImage(id, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted');
    } catch (err) {
      // Error handled by interceptor
    }
  };

  const setMainImageNew = (index) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isMain: i === index })));
    setExistingImages(prev => prev.map(img => ({ ...img, is_main: false })));
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      // Convert numeric fields
      const payload = {
        ...data,
        category_id: data.category_id ? parseInt(data.category_id) : null,
        price: parseFloat(data.price),
        discount_percent: parseFloat(data.discount_percent),
        stock: parseInt(data.stock),
        low_stock_threshold: parseInt(data.low_stock_threshold),
        weight: data.weight ? parseFloat(data.weight) : null,
        moq: data.moq ? parseInt(data.moq) : 1,
        bulk_tiers: bulkTiers.filter(t => t.min_qty > 0 && (t.unit_price > 0 || t.discount_pct > 0)),
      };

      let productId = id;

      if (isEditMode) {
        await adminService.updateProduct(id, payload);
        toast.success('Product updated successfully');
      } else {
        const res = await adminService.createProduct(payload);
        productId = res.data.id;
        toast.success('Product created successfully');
      }

      // Upload images sequentially to avoid overwhelming the server
      if (images.length > 0) {
        toast.loading('Uploading images...', { id: 'upload' });
        for (const img of images) {
          await adminService.uploadProductImage(productId, img.file, img.isMain);
        }
        toast.success('Images uploaded', { id: 'upload' });
      }

      navigate('/admin/products');
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/products')}
          className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditMode ? 'Update product details and inventory' : 'Create a new product in your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    placeholder="Premium Ceylon Tea"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-y"
                    placeholder="Enter product description..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing & Inventory</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (Rs.) *</label>
                  <input
                    {...register('price', { required: 'Price is required', min: { value: 0, message: 'Must be positive' } })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount (%)</label>
                  <input
                    {...register('discount_percent', { min: 0, max: 100 })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity *</label>
                  <input
                    {...register('stock', { required: 'Stock is required', min: 0 })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Low Stock Threshold</label>
                  <input
                    {...register('low_stock_threshold', { min: 0 })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU</label>
                  <input
                    {...register('sku')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    placeholder="e.g. TEA-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight / Unit</label>
                  <div className="flex gap-2">
                    <input
                      {...register('weight')}
                      type="number"
                      step="0.01"
                      className="w-2/3 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                      placeholder="e.g. 500"
                    />
                    <select
                      {...register('unit')}
                      className="w-1/3 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] bg-white"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Minimum Order Quantity (MOQ)
                  </label>
                  <input
                    {...register('moq', { min: 1 })}
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    placeholder="1"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Minimum quantity required to purchase</span>
                </div>
              </div>
            </div>

            {/* Wholesale & Bulk Volume Pricing Tiers */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Wholesale Volume Pricing (B2B Tiers)</h2>
                    <p className="text-xs text-gray-500">Provide discounted unit pricing when customers purchase in bulk</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addBulkTier}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Tier
                </button>
              </div>

              {bulkTiers.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">No wholesale tiers configured.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click "Add Tier" to set volume discounts (e.g. 10+ for Rs. 850 / pc).</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-2 uppercase tracking-wider">
                    <div className="col-span-4">Min Qty (Units)</div>
                    <div className="col-span-4">Tier Unit Price (Rs.)</div>
                    <div className="col-span-3">Discount %</div>
                    <div className="col-span-1 text-center">Del</div>
                  </div>
                  {bulkTiers.map((tier, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <div className="col-span-4">
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 10"
                          value={tier.min_qty}
                          onChange={(e) => updateBulkTier(idx, 'min_qty', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#1a3c2e]"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 850"
                          value={tier.unit_price}
                          onChange={(e) => updateBulkTier(idx, 'unit_price', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#1a3c2e]"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="e.g. 15%"
                          value={tier.discount_pct}
                          onChange={(e) => updateBulkTier(idx, 'discount_pct', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#1a3c2e]"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeBulkTier(idx)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remove tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Images</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {/* Existing Images */}
                {existingImages.map((img) => (
                  <div key={img.id} className={`relative rounded-xl border-2 overflow-hidden group ${img.is_main ? 'border-[#c9a227]' : 'border-gray-200'}`}>
                    <img src={img.image_url} alt="Product" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={() => deleteExistingImage(img.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {img.is_main && (
                      <span className="absolute top-2 left-2 bg-[#c9a227] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">MAIN</span>
                    )}
                  </div>
                ))}

                {/* New Images */}
                {images.map((img, index) => (
                  <div key={index} className={`relative rounded-xl border-2 overflow-hidden group ${img.isMain ? 'border-[#c9a227]' : 'border-gray-200'}`}>
                    <img src={img.preview} alt="New upload" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button type="button" onClick={() => removeNewImage(index)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600">
                        <X className="w-4 h-4" />
                      </button>
                      {!img.isMain && (
                        <button type="button" onClick={() => setMainImageNew(index)} className="text-[10px] bg-white text-gray-900 font-medium px-2 py-1 rounded">
                          Set Main
                        </button>
                      )}
                    </div>
                    {img.isMain && (
                      <span className="absolute top-2 left-2 bg-[#c9a227] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">MAIN</span>
                    )}
                  </div>
                ))}

                {/* Upload Button */}
                <label className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-32 cursor-pointer hover:border-[#1a3c2e] hover:bg-gray-50 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs font-medium text-gray-500">Upload Images</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500">You can upload multiple images. The first image uploaded will be set as the main image by default.</p>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            
            {/* Organization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Organization</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    {...register('category_id')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
                  <input
                    {...register('tags')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    placeholder="organic, premium, spices"
                  />
                </div>
              </div>
            </div>

            {/* Visibility & Badges */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Visibility & Badges</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('status')} className="w-4 h-4 text-[#1a3c2e] border-gray-300 rounded focus:ring-[#1a3c2e]" />
                  <span className="text-sm font-medium text-gray-700">Active (Visible on store)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_featured')} className="w-4 h-4 text-[#1a3c2e] border-gray-300 rounded focus:ring-[#1a3c2e]" />
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_new_arrival')} className="w-4 h-4 text-[#1a3c2e] border-gray-300 rounded focus:ring-[#1a3c2e]" />
                  <span className="text-sm font-medium text-gray-700">New Arrival</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_best_seller')} className="w-4 h-4 text-[#1a3c2e] border-gray-300 rounded focus:ring-[#1a3c2e]" />
                  <span className="text-sm font-medium text-gray-700">Best Seller</span>
                </label>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label>
                  <input
                    {...register('meta_title')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
                  <textarea
                    {...register('meta_description')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-y"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#1a3c2e] rounded-xl hover:bg-[#153024] transition-colors shadow-sm flex items-center justify-center disabled:opacity-70 min-w-[120px]"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Save Changes' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
