import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productService, categoryService } from '../services';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import {
  Filter, SlidersHorizontal, ChevronDown, ChevronUp, X,
  LayoutGrid, ShieldCheck, Truck, Headphones, Sparkles,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Category scroll state
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scrollByAmount = (offset) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filter state
  const [filters, setFilters] = useState({
    category_slug: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_discount: searchParams.get('min_discount') || '',
    in_stock: searchParams.get('in_stock') === 'true',
    is_featured: searchParams.get('is_featured') === 'true',
    is_new_arrival: searchParams.get('is_new_arrival') === 'true',
    is_best_seller: searchParams.get('is_best_seller') === 'true',
    sort_by: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  });

  // Load categories
  useEffect(() => {
    categoryService.getAll(true).then((res) => setCategories(res.data)).catch(() => { });
  }, []);

  // Load products
  const loadProducts = useCallback(() => {
    setLoading(true);
    const params = {
      page: filters.page,
      per_page: 20,
      sort_by: filters.sort_by,
    };
    if (filters.category_slug) params.category_slug = filters.category_slug;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.min_discount) params.min_discount = filters.min_discount;
    if (filters.in_stock) params.in_stock = true;
    if (filters.is_featured) params.is_featured = true;
    if (filters.is_new_arrival) params.is_new_arrival = true;
    if (filters.is_best_seller) params.is_best_seller = true;

    productService.getAll(params)
      .then((res) => {
        setProducts(res.data.items || []);
        setPagination({
          total: res.data.total,
          page: res.data.page,
          total_pages: res.data.total_pages,
        });
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      category_slug: '', min_price: '', max_price: '', min_discount: '',
      in_stock: false, is_featured: false, is_new_arrival: false, is_best_seller: false,
      sort_by: 'newest', page: 1,
    });
  };

  const hasActiveFilters = Boolean(
    filters.category_slug || filters.min_price || filters.max_price ||
    filters.min_discount || filters.in_stock || filters.is_featured ||
    filters.is_new_arrival || filters.is_best_seller
  );

  return (
    <>
      <Helmet>
        <title>Our Products — TRS Products</title>
        <meta name="description" content="Discover authentic imported goods, premium dry fruits, spices and more — right at your doorstep." />
      </Helmet>

      <div className="bg-[#f6f8f7] min-h-screen pb-16">
        {/* ========= LUXURY HERO BANNER ========= */}
        <div className="bg-[#062a1c] text-white relative overflow-hidden">
          {/* Subtle botanical illustration background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg className="absolute -top-12 -left-12 w-64 h-64 text-[#c59a3f] stroke-current fill-none stroke-[1.2]" viewBox="0 0 100 100">
              <path d="M10 90 Q 30 50, 70 30 Q 50 70, 10 90 Z M30 50 Q 50 20, 90 10 Q 70 40, 30 50 Z" />
            </svg>
            <svg className="absolute -bottom-10 left-48 w-56 h-56 text-[#c59a3f] stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 100">
              <path d="M0 100 C 30 70, 70 70, 100 0 C 70 30, 70 70, 0 100 Z" />
            </svg>
          </div>

          {/* Right side spices / dry fruits hero photo with smooth gradient blend */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 lg:w-1/2 pointer-events-none hidden sm:block">
            <img
              src="/hero_spices.webp"
              alt="Premium Spices & Dry Fruits"
              className="w-full h-full object-cover object-center"
            />
            {/* Smooth emerald gradient fade to blend the photo into the banner */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#062a1c] via-[#062a1c]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062a1c]/40 via-transparent to-[#062a1c]/30" />
          </div>

          <div className="container-custom relative z-10 py-10 sm:py-14 md:py-16">
            <div className="max-w-xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-3">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <span className="text-gray-400">/</span>
                <span className="text-white">Products</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                Our <span className="text-[#edd58c]">Products</span>
              </h1>

              {/* Subtitle */}
              <p className="text-green-100/90 text-sm md:text-base font-normal leading-relaxed mb-4 max-w-lg">
                Discover authentic imported goods, premium dry fruits, spices and more — right at your doorstep.
              </p>

              {/* Handwritten Script Tag */}
              <div className="inline-flex items-center gap-2 text-[#edd58c] font-serif italic text-sm tracking-wide bg-[#041a11]/60 px-3 py-1 rounded-full border border-[#c59a3f]/30">
                <span>~ Pure &bull; Natural &bull; Healthy ♡</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========= CATEGORY SWITCHER BAR ========= */}
        <div className="container-custom -mt-4 sm:-mt-6 relative z-20 mb-8">
          <div className="relative group">
            {canScrollLeft && (
              <button 
                onClick={() => scrollByAmount(-200)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-30 w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#072d1e] hover:scale-110 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            <div 
              ref={categoryScrollRef}
              onScroll={checkScroll}
              className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-md border border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
            >
            {/* All Products Tab */}
            <button
              onClick={() => updateFilter('category_slug', '')}
              className={`flex-shrink-0 flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 ${
                !filters.category_slug
                  ? 'bg-[#072d1e] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LayoutGrid size={15} />
              <span>All Products</span>
            </button>

            {/* Category Pills */}
            {categories.map((cat) => {
              const isActive = filters.category_slug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateFilter('category_slug', cat.slug)}
                  className={`flex-shrink-0 flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#072d1e] text-white shadow-sm font-bold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                      {cat.name.charAt(0)}
                    </span>
                  )}
                  <span>{cat.name}</span>
                </button>
              );
            })}
            </div>

            {canScrollRight && (
              <button 
                onClick={() => scrollByAmount(200)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-30 w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#072d1e] hover:scale-110 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ========= MAIN LAYOUT: FILTERS + GRID ========= */}
        <div className="container-custom">
          <div className="flex gap-7 items-start">
            {/* Desktop Filters Sidebar */}
            <aside className="w-64 xl:w-72 flex-shrink-0 hidden lg:block sticky top-28">
              <FilterPanel
                filters={filters}
                categories={categories}
                onChange={updateFilter}
                onClear={clearFilters}
                hasActive={hasActiveFilters}
              />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Top Bar: Count & Sort */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="lg:hidden flex items-center gap-2 bg-[#072d1e] text-white rounded-xl px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#0c2a1d] transition-colors"
                  >
                    <SlidersHorizontal size={14} />
                    Filters {hasActiveFilters && <span className="w-2 h-2 bg-[#edd58c] rounded-full" />}
                  </button>

                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Showing <span className="text-gray-900 font-extrabold">{pagination.total}</span> products
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Sort by:</span>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => updateFilter('sort_by', e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#072d1e] shadow-2xs cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile Filter Drawer */}
              {filtersOpen && (
                <div className="lg:hidden mb-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100 animate-slide-down">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Filter size={16} className="text-[#072d1e]" /> Filter Products
                    </h4>
                    <button onClick={() => setFiltersOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X size={18} />
                    </button>
                  </div>
                  <FilterPanel
                    filters={filters}
                    categories={categories}
                    onChange={updateFilter}
                    onClear={clearFilters}
                    hasActive={hasActiveFilters}
                  />
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="w-full bg-[#072d1e] text-white py-2.5 rounded-xl font-bold text-xs mt-4 shadow-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              )}

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-5 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Active:</span>
                  {filters.category_slug && (
                    <FilterTag label={`Category: ${filters.category_slug}`} onRemove={() => updateFilter('category_slug', '')} />
                  )}
                  {filters.min_price && (
                    <FilterTag label={`Min: Rs. ${filters.min_price}`} onRemove={() => updateFilter('min_price', '')} />
                  )}
                  {filters.max_price && (
                    <FilterTag label={`Max: Rs. ${filters.max_price}`} onRemove={() => updateFilter('max_price', '')} />
                  )}
                  {filters.min_discount && (
                    <FilterTag label={`${filters.min_discount}%+ OFF`} onRemove={() => updateFilter('min_discount', '')} />
                  )}
                  {filters.in_stock && (
                    <FilterTag label="In Stock" onRemove={() => updateFilter('in_stock', false)} />
                  )}
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-bold ml-auto hover:underline">
                    Clear all
                  </button>
                </div>
              )}

              {/* Product Grid: 3 on laptop, 4 on desktop */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <div className="text-5xl mb-3">🔍</div>
                  <h3 className="font-serif text-xl font-bold text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">Try clearing your filters or changing your search criteria.</p>
                  <button onClick={clearFilters} className="bg-[#072d1e] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#0c2a1d] transition-colors shadow-sm">
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                    {products.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>

                  {/* Circular Numbered Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <button
                        disabled={filters.page <= 1}
                        onClick={() => updateFilter('page', filters.page - 1)}
                        className="w-9 h-9 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center bg-white shadow-2xs"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {[...Array(pagination.total_pages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        // Limit pagination numbers shown
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.total_pages ||
                          (pageNum >= filters.page - 1 && pageNum <= filters.page + 1)
                        ) {
                          const isActive = pageNum === filters.page;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => updateFilter('page', pageNum)}
                              className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-[#072d1e] text-white shadow-sm'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        if (pageNum === filters.page - 2 || pageNum === filters.page + 2) {
                          return <span key={pageNum} className="text-gray-400 text-xs px-1">...</span>;
                        }
                        return null;
                      })}

                      <button
                        disabled={filters.page >= pagination.total_pages}
                        onClick={() => updateFilter('page', filters.page + 1)}
                        className="w-9 h-9 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center bg-white shadow-2xs"
                        aria-label="Next page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ========= TRUST BADGES BANNER (BOTTOM OF PAGE) ========= */}
          <div className="bg-[#072d1e] rounded-3xl shadow-xl p-8 sm:p-10 mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 relative overflow-hidden border border-[#0a3a27]">
            {/* Subtle botanical illustration background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="absolute -top-16 -right-16 w-64 h-64 text-[#c59a3f] stroke-current fill-none stroke-[1]" viewBox="0 0 100 100">
                <path d="M10 90 Q 30 50, 70 30 Q 50 70, 10 90 Z M30 50 Q 50 20, 90 10 Q 70 40, 30 50 Z" />
              </svg>
              <svg className="absolute -bottom-16 -left-16 w-64 h-64 text-[#c59a3f] stroke-current fill-none stroke-[1]" viewBox="0 0 100 100">
                <path d="M0 100 C 30 70, 70 70, 100 0 C 70 30, 70 70, 0 100 Z" />
              </svg>
            </div>

            <div className="flex flex-col items-center text-center gap-4 relative z-10 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#0a3a27] group-hover:bg-[#edd58c] transition-colors duration-300 flex items-center justify-center flex-shrink-0 shadow-lg border border-white/5">
                <Sparkles size={28} className="text-[#edd58c] group-hover:text-[#072d1e] transition-colors duration-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base mb-1.5 tracking-wide">100% Authentic</h4>
                <p className="text-xs sm:text-sm text-green-200/70 font-medium">Direct from Trusted Sources</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-4 relative z-10 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#0a3a27] group-hover:bg-[#edd58c] transition-colors duration-300 flex items-center justify-center flex-shrink-0 shadow-lg border border-white/5">
                <ShieldCheck size={28} className="text-[#edd58c] group-hover:text-[#072d1e] transition-colors duration-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base mb-1.5 tracking-wide">Secure Payment</h4>
                <p className="text-xs sm:text-sm text-green-200/70 font-medium">Multiple Payment Options</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-4 relative z-10 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#0a3a27] group-hover:bg-[#edd58c] transition-colors duration-300 flex items-center justify-center flex-shrink-0 shadow-lg border border-white/5">
                <Truck size={28} className="text-[#edd58c] group-hover:text-[#072d1e] transition-colors duration-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base mb-1.5 tracking-wide">Fast Delivery</h4>
                <p className="text-xs sm:text-sm text-green-200/70 font-medium">Across Sri Lanka & Beyond</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-4 relative z-10 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#0a3a27] group-hover:bg-[#edd58c] transition-colors duration-300 flex items-center justify-center flex-shrink-0 shadow-lg border border-white/5">
                <Headphones size={28} className="text-[#edd58c] group-hover:text-[#072d1e] transition-colors duration-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base mb-1.5 tracking-wide">24/7 Support</h4>
                <p className="text-xs sm:text-sm text-green-200/70 font-medium">We're always here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterPanel({ filters, categories, onChange, onClear, hasActive }) {
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(true);
  const [availOpen, setAvailOpen] = useState(true);
  const [specialOpen, setSpecialOpen] = useState(true);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Filter size={16} className="text-[#072d1e]" /> Filter Products
        </h3>
        {hasActive && (
          <button
            onClick={onClear}
            className="text-[11px] font-semibold text-gray-500 hover:text-red-600 transition-colors underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-5 text-sm">
        {/* Category Checklist */}
        <div>
          <button
            className="flex justify-between items-center w-full font-bold text-xs uppercase tracking-wider text-gray-800 mb-3"
            onClick={() => setCatOpen(!catOpen)}
          >
            <span>Category</span>
            {catOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {catOpen && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
              {categories.map((cat) => {
                const isSelected = filters.category_slug === cat.slug;
                return (
                  <label
                    key={cat.id}
                    className="flex items-center justify-between cursor-pointer py-1 px-1 rounded-md hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        onClick={() => onChange('category_slug', isSelected ? '' : cat.slug)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#072d1e] border-[#072d1e] text-white'
                            : 'border-gray-300 bg-white group-hover:border-gray-400'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span
                        onClick={() => onChange('category_slug', isSelected ? '' : cat.slug)}
                        className={`text-xs truncate ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                      >
                        {cat.name}
                      </span>
                    </div>
                    {cat.product_count > 0 && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded font-medium flex-shrink-0">
                        {cat.product_count}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="pt-3 border-t border-gray-100">
          <button
            className="flex justify-between items-center w-full font-bold text-xs uppercase tracking-wider text-gray-800 mb-2.5"
            onClick={() => setPriceOpen(!priceOpen)}
          >
            <span>Price Range (Rs.)</span>
            {priceOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {priceOpen && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-600 flex justify-between">
                <span>Rs. {filters.min_price || 0}</span>
                <span>—</span>
                <span>Rs. {filters.max_price ? `${filters.max_price}` : '10,000+'}</span>
              </div>

              {/* Decorative Range Slider Indicator */}
              <div className="relative h-1.5 bg-gray-200 rounded-full my-2">
                <div className="absolute left-0 right-0 h-full bg-[#072d1e] rounded-full" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#072d1e] border-2 border-white rounded-full shadow-xs" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#072d1e] border-2 border-white rounded-full shadow-xs" />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(e) => onChange('min_price', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(e) => onChange('max_price', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#072d1e]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Discount Checklist */}
        <div className="pt-3 border-t border-gray-100">
          <button
            className="flex justify-between items-center w-full font-bold text-xs uppercase tracking-wider text-gray-800 mb-2.5"
            onClick={() => setDiscountOpen(!discountOpen)}
          >
            <span>Discount</span>
            {discountOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {discountOpen && (
            <div className="space-y-1.5">
              {[10, 20, 30, 50].map((d) => {
                const isSelected = filters.min_discount == d;
                return (
                  <label key={d} className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded-md hover:bg-gray-50 group">
                    <div
                      onClick={() => onChange('min_discount', isSelected ? '' : d)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#072d1e] border-[#072d1e] text-white'
                          : 'border-gray-300 bg-white group-hover:border-gray-400'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span onClick={() => onChange('min_discount', isSelected ? '' : d)} className="text-xs text-gray-700 font-medium">
                      {d}% or more
                    </span>
                  </label>
                );
              })}
              <label className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded-md hover:bg-gray-50 group">
                <div
                  onClick={() => onChange('min_discount', '')}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    !filters.min_discount
                      ? 'bg-[#072d1e] border-[#072d1e] text-white'
                      : 'border-gray-300 bg-white group-hover:border-gray-400'
                  }`}
                >
                  {!filters.min_discount && <Check size={12} strokeWidth={3} />}
                </div>
                <span onClick={() => onChange('min_discount', '')} className="text-xs text-gray-700 font-medium">
                  Any discount
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="pt-3 border-t border-gray-100">
          <button
            className="flex justify-between items-center w-full font-bold text-xs uppercase tracking-wider text-gray-800 mb-2.5"
            onClick={() => setAvailOpen(!availOpen)}
          >
            <span>Availability</span>
            {availOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {availOpen && (
            <label className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded-md hover:bg-gray-50 group">
              <div
                onClick={() => onChange('in_stock', !filters.in_stock)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  filters.in_stock
                    ? 'bg-[#072d1e] border-[#072d1e] text-white'
                    : 'border-gray-300 bg-white group-hover:border-gray-400'
                }`}
              >
                {filters.in_stock && <Check size={12} strokeWidth={3} />}
              </div>
              <span onClick={() => onChange('in_stock', !filters.in_stock)} className="text-xs text-gray-700 font-medium">
                In Stock Only
              </span>
            </label>
          )}
        </div>

        {/* Special Collections */}
        <div className="pt-3 border-t border-gray-100">
          <button
            className="flex justify-between items-center w-full font-bold text-xs uppercase tracking-wider text-gray-800 mb-2.5"
            onClick={() => setSpecialOpen(!specialOpen)}
          >
            <span>Special Collections</span>
            {specialOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {specialOpen && (
            <div className="space-y-1.5">
              {[
                { key: 'is_featured', label: 'Featured Items' },
                { key: 'is_new_arrival', label: 'New Arrivals' },
                { key: 'is_best_seller', label: 'Best Sellers' },
              ].map(({ key, label }) => {
                const isSelected = Boolean(filters[key]);
                return (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded-md hover:bg-gray-50 group">
                    <div
                      onClick={() => onChange(key, !isSelected)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#072d1e] border-[#072d1e] text-white'
                          : 'border-gray-300 bg-white group-hover:border-gray-400'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span onClick={() => onChange(key, !isSelected)} className="text-xs text-gray-700 font-medium">
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#072d1e] border border-green-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors"><X size={12} /></button>
    </span>
  );
}
