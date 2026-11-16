import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productService, categoryService } from '../services';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import { SlidersHorizontal, ChevronDown, ChevronRight, X, Filter, ShoppingBag, ArrowRight } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [inStock, setInStock] = useState(false);

  useEffect(() => {
    categoryService.getAll(true)
      .then((res) => setAllCategories(res.data || []))
      .catch(() => setAllCategories([]));
  }, []);

  useEffect(() => {
    categoryService.getBySlug(slug)
      .then((res) => setCategory(res.data))
      .catch(() => setCategory(null));
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    const params = { category_slug: slug, page, per_page: 20, sort_by: sortBy };
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (minDiscount) params.min_discount = minDiscount;
    if (inStock) params.in_stock = true;
    productService.getAll(params)
      .then((res) => {
        setProducts(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, slug, page, sortBy, minPrice, maxPrice, minDiscount, inStock]);

  return (
    <>
      <Helmet>
        <title>{category?.name || 'Category'} — TRS Products</title>
        <meta name="description" content={category?.description || `Browse ${category?.name} products`} />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* ========= LUXURY CATEGORY HERO BANNER ========= */}
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

          <div className="container-custom relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#edd58c] mb-3">
                  <Link to="/" className="hover:text-white transition-colors">Home</Link>
                  <span className="text-[#c59a3f]">/</span>
                  <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
                  <span className="text-[#c59a3f]">/</span>
                  <span className="text-white">{category?.name || 'Category'}</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                  {category?.name || 'Category'}
                </h1>
                {category?.description ? (
                  <p className="text-green-100/90 text-sm md:text-base max-w-2xl font-normal leading-relaxed">
                    {category.description}
                  </p>
                ) : (
                  <p className="text-green-100/80 text-sm md:text-base max-w-xl font-normal">
                    Browse hand-picked, premium authentic products in this collection.
                  </p>
                )}

                <div className="inline-flex items-center gap-1.5 bg-[#051f14]/80 text-[#edd58c] border border-[#c59a3f]/40 px-3.5 py-1 rounded-full text-xs font-bold mt-4 shadow-sm">
                  <ShoppingBag size={12} className="text-[#d8ad38]" />
                  <span>{total} Products Found</span>
                </div>
              </div>

              {category?.image && (
                <div className="hidden md:block flex-shrink-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-28 h-28 lg:w-32 lg:h-32 object-cover rounded-3xl border-2 border-[#c59a3f] shadow-2xl bg-white/10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========= OTHER CATEGORIES QUICK-SWITCHER PILLS ========= */}
        {allCategories.length > 0 && (
          <div className="bg-white border-b border-gray-200/80 shadow-sm py-3.5 sticky top-16 md:top-20 z-30">
            <div className="container-custom">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 mr-1">
                  All Categories:
                </span>
                <Link
                  to="/categories"
                  className="flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  View All
                </Link>
                {allCategories.map((cat) => {
                  const isActive = cat.slug === slug;
                  return (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className={`flex-shrink-0 text-xs font-bold px-4 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#072d1e] text-white shadow-md ring-2 ring-[#c59a3f]/70'
                          : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-[#072d1e]'
                      }`}
                    >
                      {cat.image && (
                        <img src={cat.image} alt={cat.name} className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========= PRODUCTS & FILTERS CONTENT ========= */}
        <div className="container-custom py-8">
          <div className="flex gap-8">
            {/* Filters sidebar */}
            <aside className="w-72 flex-shrink-0 hidden lg:block">
              <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Filter size={18} className="text-[#072d1e]" /> Filters
                  </h3>
                  <button
                    onClick={() => { setMinPrice(''); setMaxPrice(''); setMinDiscount(''); setInStock(false); }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <div>
                  <p className="font-bold text-sm text-gray-800 mb-3">Price Range (Rs.)</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#072d1e] bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <p className="font-bold text-sm text-gray-800 mb-3">Discounts & Deals</p>
                  <div className="space-y-2">
                    {[10, 20, 30].map((d) => (
                      <label key={d} className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-gray-900 font-medium">
                        <input
                          type="radio"
                          name="discount"
                          checked={minDiscount == d}
                          onChange={() => setMinDiscount(d)}
                          className="accent-[#072d1e] w-4 h-4"
                        />
                        <span>{d}% OFF or more</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-gray-900 font-medium">
                      <input
                        type="radio"
                        name="discount"
                        checked={!minDiscount}
                        onChange={() => setMinDiscount('')}
                        className="accent-[#072d1e] w-4 h-4"
                      />
                      <span>Any Discount</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="font-bold text-sm text-gray-800 mb-3">Stock Status</p>
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 font-medium">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="accent-[#072d1e] w-4 h-4 rounded"
                    />
                    <span>In Stock Only</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Main Products Grid */}
            <div className="flex-1 min-w-0">
              {/* Header Sorting Bar */}
              <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                >
                  <SlidersHorizontal size={16} /> Filters
                </button>

                <p className="hidden sm:block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Showing <span className="text-[#072d1e] font-extrabold">{products.length}</span> of {total} products
                </p>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs font-bold text-gray-500 hidden sm:block uppercase tracking-wider">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Mobile filter panel modal */}
              {filtersOpen && (
                <div className="lg:hidden mb-6 bg-white rounded-2xl shadow-lg p-5 border border-gray-200 space-y-4 animate-slide-down">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h4 className="font-bold text-gray-800">Filter Products</h4>
                    <button onClick={() => setFiltersOpen(false)} className="p-1 text-gray-500"><X size={18} /></button>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-700 mb-2">Price Range</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                      <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border rounded-lg p-2 text-xs" />
                    </div>
                  </div>
                  <button onClick={() => setFiltersOpen(false)} className="w-full bg-[#072d1e] text-white py-2.5 rounded-xl font-bold text-sm">
                    Apply Filters
                  </button>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
                  <div className="text-5xl mb-3">📦</div>
                  <h3 className="font-serif text-xl font-bold text-gray-800 mb-2">No products in this category yet</h3>
                  <p className="text-gray-500 text-sm mb-6">Explore our other collections or check back soon!</p>
                  <Link to="/categories" className="bg-[#072d1e] text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-[#0c402c] transition-all inline-block shadow-md">
                    Explore All Categories
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {products.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-10">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold hover:bg-[#072d1e] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit shadow-sm"
                      >
                        ← Prev
                      </button>
                      <span className="text-xs font-bold text-gray-600 px-4">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold hover:bg-[#072d1e] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit shadow-sm"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
