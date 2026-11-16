import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { categoryService } from '../services';
import { ArrowRight, Sparkles, ShoppingBag, Layers } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getAll(true)
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>All Categories — TRS Products</title>
        <meta name="description" content="Explore all product categories at TRS Products. Quality dry fruits, groceries, spices, and imported essentials." />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* ========= HERO BANNER ========= */}
        <div className="bg-[#072d1e] text-white py-12 md:py-16 relative overflow-hidden">
          {/* Botanical Gold Leaf Vectors */}
          <svg className="absolute -top-6 -left-6 w-44 h-44 text-[#c59a3f]/25 pointer-events-none stroke-current fill-none stroke-[1.2]" viewBox="0 0 100 100">
            <path d="M10 90 Q 30 50, 70 30 Q 50 70, 10 90 Z M30 50 Q 50 20, 90 10 Q 70 40, 30 50 Z" />
          </svg>
          <svg className="absolute -bottom-8 -left-8 w-56 h-56 text-[#c59a3f]/20 pointer-events-none stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 100">
            <path d="M0 100 C 30 70, 70 70, 100 0 C 70 30, 70 70, 0 100 Z" />
          </svg>
          {/* Background curve */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>

          <div className="container-custom text-center relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#edd58c] mb-3">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-[#c59a3f]">/</span>
              <span className="text-white">All Categories</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-3 tracking-tight text-white">
              Explore Our Categories
            </h1>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="h-[1px] w-6 bg-[#c59a3f]"></span>
              <p className="text-[#d8ad38] text-xs md:text-sm font-bold uppercase tracking-[0.25em]">Hand-Picked & Guaranteed Fresh</p>
              <span className="h-[1px] w-6 bg-[#c59a3f]"></span>
            </div>
            <p className="text-green-100/90 text-sm md:text-base max-w-xl mx-auto font-normal">
              Browse through our premium selection of dry fruits, nuts, authentic spices, and daily kitchen essentials.
            </p>
          </div>
        </div>

        {/* ========= CATEGORIES GRID ========= */}
        <div className="container-custom py-12 md:py-16">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-pulse">
                  <div className="h-44 bg-gray-200 rounded-2xl mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md mx-auto">
              <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Categories Found</h3>
              <p className="text-gray-500 text-sm mb-6">Categories are being updated. Check back shortly!</p>
              <Link to="/products" className="bg-[#072d1e] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#0c402c] transition-all inline-block shadow-md">
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="group bg-white rounded-3xl shadow-card hover:shadow-2xl border border-gray-100 hover:border-[#c59a3f]/50 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1.5"
                >
                  {/* Image container */}
                  <div className="relative h-48 sm:h-52 bg-gradient-to-br from-green-50 to-amber-50/40 overflow-hidden flex items-center justify-center p-4">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-2xl transform group-hover:scale-108 transition-transform duration-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[#072d1e]/10 text-[#072d1e] flex items-center justify-center font-serif text-3xl font-bold border border-[#c59a3f]/30 group-hover:scale-110 transition-transform">
                        {cat.name.charAt(0)}
                      </div>
                    )}

                    {/* Product count badge */}
                    {cat.product_count !== undefined && (
                      <div className="absolute top-3 right-3 bg-[#072d1e]/85 backdrop-blur-md text-[#edd58c] text-[11px] font-bold px-3 py-1 rounded-full border border-[#c59a3f]/40 shadow-sm flex items-center gap-1">
                        <ShoppingBag size={11} className="text-[#d8ad38]" />
                        <span>{cat.product_count} items</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-serif font-bold text-lg md:text-xl text-gray-900 group-hover:text-[#072d1e] transition-colors leading-snug">
                        {cat.name}
                      </h2>
                      {cat.description ? (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                          {cat.description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1.5 italic">
                          Explore premium selections in this collection.
                        </p>
                      )}
                    </div>

                    {/* Footer link */}
                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-[#072d1e] group-hover:text-[#c59a3f] transition-colors">
                      <span className="tracking-wide uppercase">Shop Collection</span>
                      <div className="w-7 h-7 rounded-full bg-green-50 group-hover:bg-[#072d1e] text-[#072d1e] group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
