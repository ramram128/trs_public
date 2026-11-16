import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { searchService } from '../services';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import { Search, Frown } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setPage(1);
    searchService.search(query, 1)
      .then((res) => {
        setProducts(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    searchService.search(query, nextPage)
      .then((res) => setProducts((prev) => [...prev, ...(res.data.items || [])]))
      .catch(() => {});
  };

  return (
    <>
      <Helmet><title>Search: {query} — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb / Subheader */}
        <div className="bg-[#072d1e] text-white py-10 md:py-14 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,100 600,180 T 1250,50" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="container-custom relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#edd58c] mb-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-[#c59a3f]">/</span>
              <span className="text-white">Search</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
              Search Results
            </h1>
            <p className="text-[#edd58c] text-sm mt-1">
              {loading ? 'Searching...' : `Showing results for "${query}" — ${total} products found`}
            </p>
          </div>
        </div>
        <div className="container-custom py-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-card p-6">
              <Frown size={60} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">Try checking your spelling, use more general terms, or browse our categories</p>
              <Link to="/products" className="bg-[#072d1e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0c2a1d] transition-colors inline-block text-sm">
                Browse All Products
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {page < totalPages && (
                <div className="text-center mt-8">
                  <button onClick={loadMore} className="bg-white border-2 border-[#072d1e] text-[#072d1e] px-8 py-2.5 rounded-xl font-bold hover:bg-[#072d1e] hover:text-white transition-all text-sm">
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
