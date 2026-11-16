import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { searchService, categoryService } from '../../services';
import api from '../../services/api';
import {
  ShoppingCart, Heart, Search, User, Menu, X, ChevronDown, ChevronRight,
  LogOut, Package, LayoutDashboard, Phone, Tag, Copy, Check, Mail, Truck, ShieldCheck,
  Flame, TrendingUp, Sparkles, Clock, ArrowRight, Loader2
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const SEARCH_PLACEHOLDERS = [
  'Search "Ceylon BOPF Tea & Beverages"...',
  'Search "Pure Black Pepper & Spices"...',
  'Search "Organic Virgin Coconut Oil"...',
  'Search "Premium Roasted Cashews & Nuts"...',
  'Search "Wholesale & Bulk Orders"...',
  'Search "Basmati Rice & Grains"...',
  'Search "Ceylon Cinnamon Quills"...',
];

const TRENDING_SEARCHES = [
  'Ceylon Tea',
  'Black Pepper',
  'Virgin Coconut Oil',
  'Cashews',
  'Cinnamon',
  'Basmati Rice',
  'Bulk Wholesale',
  'Cardamom',
];

function SearchDropdownContent({
  query,
  loading,
  suggestions,
  recentSearches,
  categories,
  onSelectProduct,
  onSelectQuery,
  onClearRecent,
  onBrowseAll,
  onClose,
}) {
  const isTyping = query.trim().length >= 1;
  const matchingCategories = (categories || []).filter((category) =>
    category.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  ).slice(0, 5);

  if (isTyping) {
    if (loading) {
      return (
        <div className="py-8 px-4 text-center">
          <Loader2 size={24} className="animate-spin text-[#0c2a1d] mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Searching products for &ldquo;{query}&rdquo;...</p>
        </div>
      );
    }

    if (suggestions.length === 0 && matchingCategories.length === 0) {
      return (
        <div className="py-8 px-5 text-center">
          <div className="w-12 h-12 bg-amber-50 text-[#c59a3f] rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={22} />
          </div>
          <p className="text-sm font-bold text-gray-800">No products found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Try checking for typos or searching general terms like tea, spices, cashews, or oil.
          </p>
          <button
            type="button"
            onClick={onBrowseAll}
            className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0c2a1d] hover:bg-[#15422f] px-4 py-2 rounded-full transition-colors shadow-sm"
          >
            Browse All Products <ArrowRight size={13} />
          </button>
        </div>
      );
    }

    return (
      <div>
        {matchingCategories.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Categories ({matchingCategories.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {matchingCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                >
                  {category.name}<ChevronRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <>
            <div className="px-4 py-2.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#c59a3f]" />
                Products ({suggestions.length})
              </span>
              <span className="text-[10px] text-gray-400">Press Enter to view all</span>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
          {suggestions.map((p) => {
            const hasDiscount = p.discount_percent && p.discount_percent > 0;
            const inStock = (p.stock ?? 0) > 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProduct(p)}
                className="w-full text-left p-2.5 sm:p-3 hover:bg-emerald-50/60 transition-colors flex items-center gap-3 group"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200/70 overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200';
                      }}
                    />
                  ) : (
                    <Package size={20} className="text-gray-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {p.category_name && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {p.category_name}
                      </span>
                    )}
                    {inStock ? (
                      <span className="text-[9px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                        In Stock
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-[#0c2a1d] line-clamp-1 transition-colors">
                    {p.name}
                  </h4>
                </div>

                {/* Pricing */}
                <div className="text-right flex-shrink-0 pl-2">
                  <div className="text-xs sm:text-sm font-bold text-[#0c2a1d]">
                    Rs. {Number(p.price || 0).toLocaleString()}
                    {p.unit && <span className="text-[10px] font-normal text-gray-400">/{p.unit}</span>}
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center justify-end gap-1 text-[10px]">
                      <span className="line-through text-gray-400">
                        Rs. {Number(p.original_price).toLocaleString()}
                      </span>
                      <span className="font-bold text-red-600 bg-red-50 px-1 rounded">
                        -{Math.round(p.discount_percent)}%
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
            </div>
          </>
        )}

        {/* Bottom Bar: View All Results */}
        <button
          type="button"
          onClick={() => onSelectQuery(query)}
          className="w-full py-2.5 px-4 bg-gray-50 hover:bg-[#0c2a1d] text-gray-700 hover:text-white text-xs font-bold flex items-center justify-between border-t border-gray-100 transition-colors group"
        >
          <span className="flex items-center gap-1.5">
            <Search size={13} className="text-[#c59a3f]" />
            View all results for &ldquo;{query}&rdquo;
          </span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  // Not typing: Show Recent + Trending + Top Categories
  return (
    <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
      {/* Recent Searches */}
      {recentSearches && recentSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Clock size={12} className="text-gray-400" />
              Recent Searches
            </span>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectQuery(term)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 px-3 py-1.5 rounded-full border border-gray-200 transition-all font-medium"
              >
                <Clock size={11} className="text-gray-400" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Searches */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Flame size={13} className="text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Trending Searches
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING_SEARCHES.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectQuery(item)}
              className="inline-flex items-center gap-1.5 text-xs text-amber-950 bg-amber-50/70 hover:bg-amber-100 border border-amber-200/70 hover:border-amber-300 px-3 py-1.5 rounded-full transition-all font-medium group"
            >
              <TrendingUp size={11} className="text-amber-600 group-hover:scale-110 transition-transform" />
              <span>{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Categories */}
      {categories && categories.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#c59a3f]" />
              Popular Categories
            </span>
            <Link
              to="/categories"
              onClick={onClose}
              className="text-[10px] font-bold text-green-900 hover:text-gold-600 flex items-center gap-0.5"
            >
              View All <ChevronRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 text-xs font-semibold text-gray-700 hover:text-[#0c2a1d] transition-all group"
              >
                <span className="truncate">{cat.name}</span>
                <ChevronRight size={12} className="text-gray-400 group-hover:text-[#0c2a1d] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('trs_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 250);

  useEffect(() => {
    api.get('/coupons/active').then((res) => setCoupons(res.data)).catch(() => { });
    categoryService.getAll(true).then((res) => setCategories(res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setCategoryDropdownOpen(false);
    setSearchFocused(false);
  }, [location.pathname]);

  // Dynamic rotating animated placeholder ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = searchRef.current && searchRef.current.contains(e.target);
      const inMobile = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Search suggestions query
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length >= 1) {
      setSearchLoading(true);
      searchService.suggestions(q)
        .then((res) => {
          setSuggestions(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setSearchLoading(false));
    } else {
      setSuggestions([]);
      setSearchLoading(false);
    }
  }, [debouncedSearch]);

  const saveSearchToRecent = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem('trs_recent_searches', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const handleClearRecent = (e) => {
    e?.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('trs_recent_searches');
    } catch { }
  };

  const handleSearch = (e, overrideQuery) => {
    if (e) e.preventDefault();
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (q) {
      saveSearchToRecent(q);
      setSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleSelectProduct = (product) => {
    saveSearchToRecent(product.name);
    setSearchFocused(false);
    navigate(`/products/${product.slug}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleBrowseAll = () => {
    setSearchFocused(false);
    navigate('/products');
  };

  return (
    <>
      {/* Scrolling Coupon Bar */}
      {coupons.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-xs py-1.5 hidden md:block overflow-hidden relative shadow-inner">
          <div className="flex animate-marquee-rtl whitespace-nowrap cursor-default" style={{ width: 'max-content' }}>
            {[...coupons, ...coupons, ...coupons, ...coupons, ...coupons, ...coupons].map((c, i) => (
              <span key={`${c.id}-${i}`} className="inline-flex items-center gap-2 mx-6">
                <Tag size={12} className="text-amber-100" />
                <span className="font-bold tracking-wider font-mono bg-white/20 px-2 py-0.5 rounded text-white">{c.code}</span>
                <span className="opacity-75">—</span>
                <span className="font-semibold">{c.coupon_type === 'percentage' ? `${c.discount_value}% OFF` : `Rs. ${c.discount_value} OFF`}</span>
                {c.min_order_amount > 0 && <span className="opacity-80 text-[11px]">(Min. Rs. {c.min_order_amount.toLocaleString()})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-[#061a12] text-white text-xs py-2 hidden md:block border-b border-white/10 font-medium">
        <div className="container-custom flex justify-between items-center">
          <div className="flex items-center gap-4 text-green-100">
            <span className="flex items-center gap-1.5">
              <Truck size={13} className="text-[#c59a3f]" />
              <span>Free Delivery on Orders Above <span className="text-[#c59a3f] font-bold">Rs. 5,000</span></span>
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#c59a3f]" />
              <span>Secure Payment <span className="text-white/30">|</span> COD Available</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-green-100">
            <a href="tel:+94742975043" className="flex items-center gap-1.5 hover:text-[#c59a3f] transition-colors">
              <Phone size={12} className="text-[#c59a3f]" />
              <span>+94 742 975 043</span>
            </a>
            <span className="text-white/20">|</span>
            <a href="mailto:support@trsimports.com" className="flex items-center gap-1.5 hover:text-[#c59a3f] transition-colors">
              <Mail size={12} className="text-[#c59a3f]" />
              <span>support@trsimports.com</span>
            </a>
          </div>
        </div>
      </div>      {/* Main navbar */}
      <header className={`sticky top-0 z-50 transition-all duration-300 bg-white ${scrolled ? 'shadow-lg border-b border-gray-100' : 'border-b border-gray-100'
        }`}>
        <nav className="container-custom">
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-2.5 sm:py-3">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0 group" title="TRS Products Home">
              <img
                src="/logo.png"
                alt="TRS Products"
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain rounded-full bg-white p-0.5 shadow-md border-2 border-[#c59a3f]/40 group-hover:scale-105 group-hover:border-[#c59a3f] transition-all duration-300"
              />
              <span className="flex flex-col items-start gap-1 sm:gap-1.5">
                <span className="text-[#0c2a1d] font-serif font-bold text-xl sm:text-2xl md:text-[32px] leading-none tracking-tight whitespace-nowrap">
                  TRS Products
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 text-[#c59a3f] text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.28em] whitespace-nowrap">
                  <span className="w-3 sm:w-4 h-px bg-[#c59a3f]" />
                  QUALITY · TRUST · GOODNESS
                  <span className="w-3 sm:w-4 h-px bg-[#c59a3f]" />
                </span>
              </span>
            </Link>

            {/* Desktop / Tablet Search bar */}
            <div className="hidden md:block flex-1 relative max-w-2xl mx-4 lg:mx-8" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <div className="relative flex items-center bg-gray-50/80 hover:bg-white focus-within:bg-white rounded-full border border-gray-300/80 focus-within:border-[#0c2a1d] focus-within:ring-4 focus-within:ring-[#0c2a1d]/10 transition-all shadow-sm px-3.5 py-1">
                  <Search size={17} className="text-gray-400 flex-shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setSearchFocused(false);
                    }}
                    placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                    className="w-full py-1.5 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/70 transition-colors mr-1 flex-shrink-0"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="w-8 h-8 bg-gradient-to-r from-[#0c2a1d] to-[#15422f] hover:from-[#15422f] hover:to-[#0c2a1d] text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:scale-105"
                    title="Search"
                  >
                    {searchLoading ? <Loader2 size={14} className="animate-spin text-[#c59a3f]" /> : <Search size={14} />}
                  </button>
                </div>
              </form>

              {/* Dynamic Suggestions & Overlay Dropdown */}
              {searchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden animate-slide-down">
                  <SearchDropdownContent
                    query={searchQuery}
                    loading={searchLoading}
                    suggestions={suggestions}
                    recentSearches={recentSearches}
                    categories={categories}
                    onSelectProduct={handleSelectProduct}
                    onSelectQuery={(term) => {
                      setSearchQuery(term);
                      handleSearch(null, term);
                    }}
                    onClearRecent={handleClearRecent}
                    onBrowseAll={handleBrowseAll}
                    onClose={() => setSearchFocused(false)}
                  />
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Login/User */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-gray-800 hover:text-[#0c2a1d] transition-colors px-1.5 sm:px-2 py-1.5 rounded-xl hover:bg-gray-50"
                    id="user-menu-btn"
                  >
                    <div className="w-8 h-8 bg-[#0c2a1d] text-[#e0c370] rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden lg:block text-sm font-semibold">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className="hidden lg:block text-gray-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden animate-slide-down">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                        <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                      </div>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900">
                          <LayoutDashboard size={15} /> Admin Panel
                        </Link>
                      )}
                      <Link to="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900">
                        <User size={15} /> My Account
                      </Link>
                      <Link to="/account/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900">
                        <Package size={15} /> My Orders
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1.5 text-gray-800 hover:text-[#0c2a1d] transition-colors text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  <User size={18} className="text-gray-700" />
                  <span className="font-medium">Login</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                to="/account/wishlist"
                className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-gray-800 hover:text-[#0c2a1d] hover:bg-gray-50 rounded-full transition-colors"
                title="Wishlist"
              >
                <Heart size={19} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {wishlist.length > 9 ? '9+' : wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-gray-800 hover:text-[#0c2a1d] hover:bg-gray-50 rounded-full transition-colors"
                title="Cart"
                id="cart-btn"
              >
                <ShoppingCart size={19} />
                <span className="absolute -top-1 -right-1 bg-[#c59a3f] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Dedicated Mobile Search Bar Row (Visible only on <md) */}
          <div className="md:hidden pb-3 pt-1 px-1 relative" ref={mobileSearchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative flex items-center bg-gray-50/90 hover:bg-white focus-within:bg-white rounded-full border border-gray-300/80 focus-within:border-[#0c2a1d] focus-within:ring-2 focus-within:ring-[#0c2a1d]/15 transition-all shadow-sm px-3 py-1">
                <Search size={15} className="text-gray-400 flex-shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchFocused(false);
                  }}
                  placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                  className="w-full py-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-xs sm:text-sm font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/70 transition-colors mr-1 flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
                <button
                  type="submit"
                  className="w-7 h-7 bg-[#0c2a1d] text-white rounded-full flex items-center justify-center flex-shrink-0"
                >
                  {searchLoading ? <Loader2 size={13} className="animate-spin text-[#c59a3f]" /> : <Search size={13} />}
                </button>
              </div>
            </form>

            {/* Mobile Dynamic Search Dropdown */}
            {searchFocused && (
              <div className="absolute top-full left-1 right-1 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden max-h-[75vh] overflow-y-auto">
                <SearchDropdownContent
                  query={searchQuery}
                  loading={searchLoading}
                  suggestions={suggestions}
                  recentSearches={recentSearches}
                  categories={categories}
                  onSelectProduct={handleSelectProduct}
                  onSelectQuery={(term) => {
                    setSearchQuery(term);
                    handleSearch(null, term);
                  }}
                  onClearRecent={handleClearRecent}
                  onBrowseAll={handleBrowseAll}
                  onClose={() => setSearchFocused(false)}
                />
              </div>
            )}
          </div>

          {/* Desktop/Tablet Bottom nav bar */}
          <div className="hidden md:flex items-center py-2.5 border-t border-gray-100">
            {/* Left spacer for perfect centering */}
            <div className="flex-1"></div>

            {/* Centered links */}
            <div className="flex items-center justify-center gap-1.5 lg:gap-3 xl:gap-4">
              <Link
                to="/"
                className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${location.pathname === '/' ? 'text-white font-bold bg-[#0c2a1d] shadow-md' : 'text-gray-700 hover:text-[#0c2a1d] hover:bg-gray-50'
                  }`}
              >
                Home
              </Link>



              {/* Categories Dropdown & Link */}
              <div
                className="relative group"
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                onMouseLeave={() => setCategoryDropdownOpen(false)}
              >
                <Link
                  to="/categories"
                  className={`text-sm font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1 transition-all ${location.pathname.startsWith('/categor') ? 'text-white font-bold bg-[#0c2a1d] shadow-md' : 'text-gray-700 hover:text-[#0c2a1d] hover:bg-gray-50'
                    }`}
                  onClick={() => setCategoryDropdownOpen(false)}
                >
                  <span>Categories</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 text-gray-500 group-hover:text-[#0c2a1d] ${categoryDropdownOpen ? 'rotate-180 text-[#0c2a1d]' : ''}`} />
                </Link>

                {/* Hover Dropdown */}
                {categoryDropdownOpen && (
                  <div className="absolute top-full left-0 pt-2 w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden text-gray-800">
                      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">All Categories</span>
                        <Link
                          to="/categories"
                          onClick={() => setCategoryDropdownOpen(false)}
                          className="text-xs font-bold text-green-900 hover:text-gold-600 flex items-center gap-0.5"
                        >
                          View All <ChevronRight size={12} />
                        </Link>
                      </div>

                      <div className="max-h-[380px] overflow-y-auto py-1 divide-y divide-gray-50">
                        {categories.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-gray-400 text-center">Loading categories...</div>
                        ) : (
                          categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/category/${cat.slug}`}
                              onClick={() => setCategoryDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-gray-700 hover:text-green-950 group/item"
                            >
                              {cat.image ? (
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {cat.name.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate group-hover/item:font-semibold">{cat.name}</p>
                                {cat.product_count > 0 && (
                                  <p className="text-xs text-gray-400">{cat.product_count} products</p>
                                )}
                              </div>
                              <ChevronRight size={14} className="text-gray-300 group-hover/item:text-green-800 group-hover/item:translate-x-0.5 transition-all" />
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Products Link */}
              <Link
                to="/products"
                className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${location.pathname === '/products' ? 'text-white font-bold bg-[#0c2a1d] shadow-md' : 'text-gray-700 hover:text-[#0c2a1d] hover:bg-gray-50'
                  }`}
              >
                Products
              </Link>
              <Link to="/offers" className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${location.pathname === '/offers' ? 'text-white font-bold bg-[#0c2a1d] shadow-md' : 'text-gray-700 hover:text-[#0c2a1d] hover:bg-gray-50'}`}>Offers</Link>
              <Link to="/about" className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${location.pathname === '/about' ? 'text-white font-bold bg-[#0c2a1d] shadow-md' : 'text-gray-700 hover:text-[#0c2a1d] hover:bg-gray-50'}`}>About Us</Link>
              <Link to="/contact" className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${location.pathname === '/contact' ? 'text-white font-bold bg-[#0c2a1d] shadow-md' : 'text-gray-700 hover:text-[#0c2a1d] hover:bg-gray-50'}`}>Contact</Link>
              <Link to="/track-order" className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${location.pathname === '/track-order' ? 'text-white font-bold bg-[#0c2a1d] shadow-md' : 'text-gray-700 hover:text-[#0c2a1d] hover:bg-gray-50'}`}>Track Order</Link>
            </div>

            {/* Right side (WhatsApp) */}
            <div className="flex-1 flex justify-end">
              <a
                href={`https://wa.me/94742975043?text=${encodeURIComponent('Hello, I would like to know more about your products.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white text-xs md:text-sm px-5 py-2 rounded-full transition-all duration-300 font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-2xl animate-slide-down">
            <div className="container-custom py-4 space-y-1">
              <Link to="/" className="block text-gray-800 font-medium py-3 px-3 rounded-xl hover:bg-green-50 hover:text-green-900" onClick={() => setMobileOpen(false)}>Home</Link>

              {/* Mobile Categories Accordion */}
              <div>
                <div className="flex items-center justify-between text-gray-800 py-3 px-3 rounded-xl hover:bg-green-50 hover:text-green-900">
                  <Link to="/categories" className="flex-1 font-medium" onClick={() => setMobileOpen(false)}>
                    Categories
                  </Link>
                  {categories.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileCategoriesOpen(!mobileCategoriesOpen);
                      }}
                      className="p-1 text-gray-500 hover:text-green-900"
                    >
                      <ChevronDown size={16} className={`transition-transform duration-200 ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {mobileCategoriesOpen && categories.length > 0 && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-gray-50 rounded-xl my-1 border border-gray-100">
                    <Link
                      to="/categories"
                      onClick={() => setMobileOpen(false)}
                      className="block text-[#072d1e] font-bold py-2.5 px-3 text-sm rounded-lg hover:bg-white"
                    >
                      Explore All Categories →
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block text-gray-700 hover:text-green-900 py-2.5 px-3 text-sm rounded-lg hover:bg-white font-medium"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/products" className="block text-gray-800 font-medium py-3 px-3 rounded-xl hover:bg-green-50 hover:text-green-900" onClick={() => setMobileOpen(false)}>Products</Link>

              <Link to="/offers" className="block text-gray-800 font-medium py-3 px-3 rounded-xl hover:bg-green-50 hover:text-green-900" onClick={() => setMobileOpen(false)}>Offers</Link>
              <Link to="/about" className="block text-gray-800 font-medium py-3 px-3 rounded-xl hover:bg-green-50 hover:text-green-900" onClick={() => setMobileOpen(false)}>About Us</Link>
              <Link to="/contact" className="block text-gray-800 font-medium py-3 px-3 rounded-xl hover:bg-green-50 hover:text-green-900" onClick={() => setMobileOpen(false)}>Contact</Link>
              <Link to="/track-order" className="block text-gray-800 font-medium py-3 px-3 rounded-xl hover:bg-green-50 hover:text-green-900" onClick={() => setMobileOpen(false)}>Track Order</Link>

              {/* Mobile WhatsApp Button */}
              <div className="pt-3 pb-2">
                <a
                  href={`https://wa.me/94742975043?text=${encodeURIComponent('Hello, I would like to know more about your products.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white py-3 px-4 rounded-xl font-bold text-sm w-full transition-all duration-300 shadow-md hover:shadow-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              <div className="border-t border-gray-100 pt-2 mt-2">
                {!isAuthenticated ? (
                  <Link to="/login" className="block text-green-900 py-2.5 px-3 rounded-xl hover:bg-green-50 font-bold" onClick={() => setMobileOpen(false)}>
                    Login / Register
                  </Link>
                ) : (
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left text-red-600 py-2.5 px-3 rounded-xl hover:bg-red-50 font-medium">
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

