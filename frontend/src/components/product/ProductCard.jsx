import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Eye, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useState } from 'react';

const formatPrice = (price) => `Rs. ${price?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const {
    id, name, slug, price, final_price, discount_percent,
    main_image, stock, is_featured, is_new_arrival, is_best_seller,
    category_name, unit,
  } = product;

  const inWishlist = isInWishlist(id);
  const outOfStock = stock === 0;
  const hasDiscount = discount_percent > 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    await addToCart(id);
    setAdding(false);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
  };

  return (
    <Link
      to={`/products/${slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_24px_rgba(7,45,30,0.12)] hover:border-[#072d1e]/50 transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full"
      id={`product-card-${id}`}
    >
      {/* Image container - Full width edge-to-edge with 4:3 aspect ratio */}
      <div className="relative bg-gray-50 aspect-[4/3] w-full overflow-hidden flex items-center justify-center border-b border-gray-100">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1 pointer-events-none">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] leading-none font-black px-2 py-1 rounded-md shadow-sm">
              -{discount_percent}%
            </span>
          )}
          {is_new_arrival && !hasDiscount && (
            <span className="bg-blue-600 text-white text-[10px] leading-none font-bold px-2 py-1 rounded-md shadow-sm">
              NEW
            </span>
          )}
          {is_best_seller && (
            <span className="bg-[#c59a3f] text-white text-[10px] leading-none font-bold px-2 py-1 rounded-md shadow-sm">
              ★ HOT
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center
                      transition-all duration-200 shadow-md
                      ${inWishlist
                        ? 'bg-red-500 text-white shadow-red-200'
                        : 'bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-white'
                      }`}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        {/* Product image - Full width cover or clean fallback */}
        {imgError || !main_image ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-100/60 p-4">
            <Package size={36} className="text-gray-400 mb-1" />
            <span className="text-[10px] font-bold text-gray-400">TRS Products</span>
          </div>
        ) : (
          <img
            src={main_image}
            alt={name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              outOfStock ? 'opacity-40 grayscale' : ''
            }`}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white text-gray-900 font-bold px-3 py-1 rounded-lg text-xs shadow-md">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick view on hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2.5 pointer-events-none">
          <span className="bg-white/95 text-gray-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
            <Eye size={12} /> View Details
          </span>
        </div>
      </div>

      {/* Product Details Block */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Rating row: 5 Stars + Rating Value + Review Count */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-gray-800">4.5</span>
            <span className="text-[11px] text-gray-400">({(id * 17) % 80 + 25})</span>
          </div>

          {/* Category */}
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#c59a3f] block mb-1">
            {category_name || 'TRS Essentials'}
          </span>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-[#072d1e] transition-colors mb-2 leading-snug">
            {name}
          </h3>
        </div>

        <div>
          {/* Price & Strikethrough */}
          <div className="flex items-baseline gap-2 flex-wrap mb-1 pt-1.5 border-t border-gray-100">
            <span className="text-base sm:text-lg font-extrabold text-[#072d1e] tracking-tight">
              {formatPrice(final_price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(price)}
              </span>
            )}
          </div>

          {/* Unit pill */}
          {unit && (
            <div className="mb-3">
              <span className="inline-block text-[10px] text-gray-500 bg-gray-100/90 px-2 py-0.5 rounded-md font-semibold">
                {unit}
              </span>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold
                        transition-all duration-200 shadow-xs ${
                          outOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#072d1e] hover:bg-[#0c3a28] text-white hover:shadow-md active:scale-[0.99]'
                        }`}
          >
            {adding ? (
              <span className="spinner w-4 h-4" />
            ) : (
              <>
                <ShoppingCart size={14} className="text-[#edd58c]" />
                <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader for product card
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="p-3.5 space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
        </div>
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-8 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}


