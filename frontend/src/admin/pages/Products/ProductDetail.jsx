import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import { ArrowLeft, Edit, Package, Tag, Boxes, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await adminService.getProduct(id);
        setProduct(res.data);
      } catch (err) {
        toast.error('Failed to load product');
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/products/${id}/edit`)}
          className="px-4 py-2 bg-[#1a3c2e] text-white rounded-xl text-sm font-medium hover:bg-[#153024] transition-colors flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" /> Images
            </h2>
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {product.images.map((img) => (
                  <div key={img.id} className={`relative rounded-xl border-2 overflow-hidden ${img.is_main ? 'border-[#c9a227]' : 'border-gray-200'}`}>
                    <img src={img.image_url} alt={product.name} className="w-full h-32 object-cover" />
                    {img.is_main && (
                      <span className="absolute top-2 left-2 bg-[#c9a227] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">MAIN</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No images uploaded</p>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description || 'No description'}</p>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-xs text-gray-500">{key}</span>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Stock */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Price & Stock
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Price</span>
                <span className="text-sm font-medium text-gray-900">Rs. {product.price?.toLocaleString()}</span>
              </div>
              {product.discount_percent > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Discount</span>
                  <span className="text-sm font-medium text-red-500">{product.discount_percent}%</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="text-sm font-medium text-gray-700">Final Price</span>
                <span className="text-sm font-bold text-[#1a3c2e]">Rs. {product.final_price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Stock</span>
                <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-500' : product.stock <= product.low_stock_threshold ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {product.stock} {product.unit || 'pcs'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Weight</span>
                <span className="text-sm font-medium text-gray-900">{product.weight ? `${product.weight}g` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" /> Category & Tags
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm font-medium text-gray-900">{product.category_name || 'Uncategorized'}</span>
              </div>
              {product.tags && (
                <div>
                  <span className="text-xs text-gray-500">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags.split(',').map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status & Badges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Boxes className="w-5 h-5" /> Status & Badges
            </h2>
            <div className="space-y-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                {product.status ? 'Active' : 'Draft'}
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.is_featured && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Featured</span>}
                {product.is_new_arrival && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">New Arrival</span>}
                {product.is_best_seller && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Best Seller</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
