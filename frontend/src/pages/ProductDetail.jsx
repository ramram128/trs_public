import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productService } from '../services';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import api, { getApiError } from '../services/api';
import {
  ShoppingCart, Heart, Star, ChevronLeft, ChevronRight,
  Truck, Shield, RotateCcw, Minus, Plus, Share2, Check,
  ArrowRight, ZoomIn, MessageSquare, Building2, Tag, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatPrice = (p) => `Rs. ${(p || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);
    productService.getBySlug(slug)
      .then((res) => {
        const p = res.data;
        setProduct(p);
        if (p.moq && p.moq > 1) {
          setQuantity(p.moq);
        }
        const main = p.images?.find((img) => img.is_main) || p.images?.[0];
        setMainImage(main?.image_url || null);
        // Load related products
        if (p.category_id) {
          productService.getAll({ category_id: p.category_id, per_page: 6 })
            .then((r) => setRelatedProducts(r.data.items?.filter((rp) => rp.id !== p.id).slice(0, 5) || []))
            .catch(() => {});
        }
        // Load reviews
        api.get(`/reviews/product/${p.id}`).then(r => setReviews(r.data)).catch(() => {});
        api.get(`/reviews/product/${p.id}/summary`).then(r => setReviewSummary(r.data)).catch(() => {});
      })
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    setAddingToCart(true);
    await addToCart(product.id, quantity, selectedVariant?.id);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setAddingToCart(true);
    const success = await addToCart(product.id, quantity, selectedVariant?.id);
    setAddingToCart(false);
    if (success) navigate('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to write a review'); return; }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { product_id: product.id, ...reviewForm });
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, title: '', comment: '' });
      api.get(`/reviews/product/${product.id}`).then(r => setReviews(r.data)).catch(() => {});
      api.get(`/reviews/product/${product.id}/summary`).then(r => setReviewSummary(r.data)).catch(() => {});
    } catch (err) {
      toast.error(getApiError(err));
    } finally { setSubmittingReview(false); }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (error || !product) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Product Not Found</h2>
        <p className="text-gray-400 mb-6">The product you're looking for doesn't exist.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock === 0;
  const hasDiscount = product.discount_percent > 0;
  const allImages = product.images?.length > 0 
    ? product.images 
    : [{ image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600', is_main: true }];

  // Group variants by type
  const variantGroups = product.variants?.reduce((acc, v) => {
    if (!acc[v.variant_type]) acc[v.variant_type] = [];
    acc[v.variant_type].push(v);
    return acc;
  }, {});

  // Parse bulk tiers
  const bulkTiers = Array.isArray(product.bulk_tiers)
    ? product.bulk_tiers
    : (typeof product.bulk_tiers === 'string' ? (JSON.parse(product.bulk_tiers || '[]')) : []);

  // Compute active unit price based on selected quantity
  const getActiveUnitPrice = () => {
    let price = product.final_price;
    if (bulkTiers && bulkTiers.length > 0) {
      const sorted = [...bulkTiers].sort((a, b) => b.min_qty - a.min_qty);
      for (const tier of sorted) {
        if (quantity >= tier.min_qty) {
          if (tier.unit_price) { price = tier.unit_price; break; }
          if (tier.discount_pct) { price = product.final_price * (1 - tier.discount_pct / 100); break; }
        }
      }
    }
    return price;
  };
  const activeUnitPrice = getActiveUnitPrice();
  const isWholesaleTierActive = activeUnitPrice < product.final_price;

  return (
    <>
      <Helmet>
        <title>{product.name} — TRS Products</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
        <meta property="og:title" content={product.name} />
        <meta property="og:image" content={mainImage} />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-custom py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <Link to="/" className="hover:text-green-900">Home</Link>
              <span>/</span>
              <Link to="/products" className="hover:text-green-900">Products</Link>
              {product.category_name && (
                <>
                  <span>/</span>
                  <Link to={`/category/${product.category_id}`} className="hover:text-green-900">{product.category_name}</Link>
                </>
              )}
              <span>/</span>
              <span className="text-gray-800 font-medium truncate">{product.name}</span>
            </div>
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-2 gap-10 mb-12">
            {/* Left — Image gallery */}
            <div>
              {/* Main image */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-card group mb-4 aspect-square">
                {hasDiscount && (
                  <span className="absolute top-4 left-4 z-10 discount-badge text-sm px-3 py-1">
                    -{product.discount_percent}% OFF
                  </span>
                )}
                <img
                  src={mainImage || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-4 right-4 bg-white/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={18} />
                </button>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img.image_url)}
                      className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        mainImage === img.image_url ? 'border-green-900 shadow-green' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Product details */}
            <div>
              {/* Category + badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {product.category_name && (
                  <span className="badge-green text-xs">{product.category_name}</span>
                )}
                {product.is_new_arrival && <span className="badge bg-blue-100 text-blue-700 text-xs">NEW</span>}
                {product.is_best_seller && <span className="badge bg-gold-100 text-gold-700 text-xs">🔥 Best Seller</span>}
                {product.moq > 1 && (
                  <span className="badge bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                    MOQ: {product.moq} {product.unit || 'units'}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={16} className={s <= 4 ? 'text-gold-500 fill-gold-500' : 'text-gray-200'} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{reviewSummary.average_rating || '—'} ({reviewSummary.total_reviews || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="bg-green-50/80 border border-green-100 rounded-2xl p-4 mb-4">
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-green-900">{formatPrice(activeUnitPrice)}</span>
                  {(hasDiscount || isWholesaleTierActive) && (
                    <span className="text-gray-400 line-through text-lg">{formatPrice(product.price)}</span>
                  )}
                  {product.unit && <span className="text-gray-500 text-sm">/ {product.unit}</span>}
                  {isWholesaleTierActive && (
                    <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Wholesale Tier Applied
                    </span>
                  )}
                </div>
                {product.moq > 1 && (
                  <p className="text-amber-800 text-xs font-semibold mt-2 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                    Minimum Order Quantity (MOQ): <strong>{product.moq} {product.unit || 'units'}</strong>
                  </p>
                )}
              </div>

              {/* Bulk / Wholesale Tier Pricing Table */}
              {bulkTiers.length > 0 && (
                <div className="bg-white border-2 border-emerald-100 rounded-2xl p-4 mb-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                        <Tag className="w-4 h-4 text-emerald-700" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Wholesale Volume Pricing</h3>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Buy More, Save More
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {bulkTiers.map((tier, idx) => {
                      const tierPrice = tier.unit_price || (product.final_price * (1 - (tier.discount_pct || 0) / 100));
                      const isSelected = quantity >= tier.min_qty;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQuantity(Math.max(product.moq || 1, tier.min_qty))}
                          className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                            isSelected
                              ? 'border-[#1a3c2e] bg-emerald-50/70 font-semibold shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                          }`}
                        >
                          <div className="text-gray-500 font-medium">{tier.min_qty}+ {product.unit || 'units'}</div>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">{formatPrice(tierPrice)}</div>
                          {tier.discount_pct && (
                            <span className="text-[10px] text-green-700 font-bold block mt-0.5">
                              Save {tier.discount_pct}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock status */}
              <div className={`flex items-center gap-2 mb-4 text-sm font-medium ${
                outOfStock ? 'text-red-500' : product.stock <= 10 ? 'text-orange-500' : 'text-green-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  outOfStock ? 'bg-red-500' : product.stock <= 10 ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                {outOfStock ? 'Out of Stock' : product.stock <= 10 ? `Only ${product.stock} left!` : `In Stock (${product.stock} available)`}
              </div>

              {/* Variants */}
              {variantGroups && Object.entries(variantGroups).map(([type, variants]) => (
                <div key={type} className="mb-4">
                  <p className="font-semibold text-gray-700 mb-2 capitalize">{type}:</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.filter((v) => v.is_active).map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedVariant?.id === v.id
                            ? 'border-green-900 bg-green-50 text-green-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {v.variant_value}
                        {v.price_adjustment > 0 && <span className="text-xs text-gray-400 ml-1">(+{formatPrice(v.price_adjustment)})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <p className="font-semibold text-gray-700">Quantity:</p>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                    disabled={quantity <= (product.moq || 1)}
                    className="px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2.5 font-semibold border-x border-gray-200 min-w-[50px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {product.moq > 1 && (
                  <span className="text-xs text-gray-500 font-medium">Min: {product.moq}</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock || addingToCart}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {addingToCart ? <span className="spinner" /> : <ShoppingCart size={18} />}
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={outOfStock || addingToCart}
                  className="flex-1 btn-gold flex items-center justify-center gap-2"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => toggle(product.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    inWishlist
                      ? 'border-red-400 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-400'
                  }`}
                  title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Bulk RFQ button for B2B */}
              <div className="mb-6">
                <Link
                  to={`/contact?type=bulk_rfq&product=${encodeURIComponent(product.name)}&sku=${encodeURIComponent(product.sku || '')}&moq=${product.moq || 1}`}
                  className="w-full border-2 border-dashed border-[#1a3c2e] hover:bg-emerald-50/50 text-[#1a3c2e] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center"
                >
                  <Building2 className="w-4 h-4 text-[#c9a227]" />
                  Need Container / 100+ Bulk Wholesale Order? Request a Quotation (RFQ)
                </Link>
              </div>

              {/* SKU */}
              {product.sku && (
                <p className="text-sm text-gray-400 mb-4">SKU: <span className="text-gray-600">{product.sku}</span></p>
              )}

              {/* Delivery info */}
              <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                {[
                  { icon: Truck, text: 'Island-wide delivery | Free above Rs. 5,000', color: 'text-blue-500' },
                  { icon: Shield, text: '100% genuine products guaranteed', color: 'text-green-500' },
                  { icon: RotateCcw, text: 'Easy return & exchange policy', color: 'text-orange-500' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                    <Icon size={16} className={color} />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs — Description & Specifications */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-12">
            <div className="flex border-b border-gray-100">
              {['description', 'specifications', 'delivery', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-semibold text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-green-900 text-green-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'delivery' ? 'Delivery Info' : tab === 'reviews' ? `Reviews (${reviewSummary.total_reviews})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === 'description' && (
                <div className="prose prose-sm max-w-none text-gray-600">
                  {product.description || <p className="text-gray-400">No description available.</p>}
                </div>
              )}
              {activeTab === 'specifications' && (
                <div>
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(product.specifications).map(([key, val]) => (
                          <tr key={key} className="border-b border-gray-50">
                            <td className="py-3 pr-4 font-semibold text-gray-700 w-1/3 capitalize">{key.replace(/_/g, ' ')}</td>
                            <td className="py-3 text-gray-600">{String(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-400">No specifications available.</p>
                  )}
                </div>
              )}
              {activeTab === 'delivery' && (
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { title: 'Standard Delivery', desc: 'Rs. 350 | 2-5 business days' },
                      { title: 'Free Delivery', desc: 'Orders above Rs. 5,000' },
                      { title: 'COD Available', desc: 'Cash on delivery island-wide' },
                      { title: 'Return Policy', desc: 'Easy returns within 7 days' },
                    ].map((d) => (
                      <div key={d.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-800">{d.title}</p>
                          <p className="text-gray-500">{d.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Review Summary */}
                  {reviewSummary.total_reviews > 0 && (
                    <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-900">{reviewSummary.average_rating}</p>
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(reviewSummary.average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{reviewSummary.total_reviews} reviews</p>
                      </div>
                    </div>
                  )}

                  {/* Review Form */}
                  {user ? (
                    <form onSubmit={submitReview} className="border border-gray-100 rounded-xl p-4">
                      <h4 className="font-semibold text-sm mb-3">Write a Review</h4>
                      <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Rating *</label>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <button key={s} type="button" onClick={() => setReviewForm({...reviewForm, rating: s})}>
                              <Star size={20} className={s <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <input type="text" placeholder="Review title (optional)" value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-900" />
                      <textarea placeholder="Your review..." rows={3} value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-900 resize-none" />
                      <button type="submit" disabled={submittingReview}
                        className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition disabled:opacity-50">
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  ) : (
                    <p className="text-sm text-gray-500"><Link to="/login" className="text-green-700 font-medium hover:underline">Login</Link> to write a review</p>
                  )}

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No reviews yet. Be the first to review this product!</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
                            </div>
                            <span className="font-semibold text-sm text-gray-900">{review.user_name}</span>
                            <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          {review.title && <p className="font-medium text-sm text-gray-800">{review.title}</p>}
                          {review.comment && <p className="text-sm text-gray-600 mt-1">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
                {product.category_id && (
                  <Link to={`/products?category_id=${product.category_id}`} className="text-green-900 text-sm flex items-center gap-1 group">
                    View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container-custom py-8">
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton w-20 h-20 rounded-xl" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-6 w-1/3" />
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-24 w-full rounded-2xl" />
          <div className="skeleton h-12 w-full rounded-2xl" />
          <div className="skeleton h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
