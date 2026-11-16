import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productService, categoryService } from '../services';
import api from '../services/api';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import {
  ArrowRight, ShieldCheck, Truck, CreditCard, Headphones,
  Star, ChevronLeft, ChevronRight, Leaf, Award, Users, MapPin, Tag, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const HERO_SLIDES = [
  {
    subtitle: 'All Your Needs in One Place',
    title: 'Welcome to TRS',
    highlight: 'Special Offers',
    description: 'From fashion & electronics to authentic homemade foods. We bring you the best quality products.',
    cta: 'Shop Now',
    ctaLink: '/products',
    secondaryCta: 'Explore Categories',
    secondaryCtaLink: '/categories',
    image: '/hero-all.jpg',
    discountBadge: '30%',
  },
  {
    subtitle: 'Trendy • Stylish • Authentic',
    title: 'Fashion & Beauty',
    highlight: 'Premium Collection',
    description: 'Explore our latest collection of clothing, handbags, watches, shoes, and personal care items.',
    cta: 'Shop Fashion',
    ctaLink: '/products',
    secondaryCta: 'View Offers',
    secondaryCtaLink: '/products?min_discount=10',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    discountBadge: 'NEW',
  },
  {
    subtitle: 'Mobiles • Accessories • Electronics',
    title: 'Electronics & Tech',
    highlight: 'Premium Quality',
    description: 'Find the best mobile phones, mobile accessories, and electronic accessories for your daily needs.',
    cta: 'Explore Tech',
    ctaLink: '/products',
    secondaryCta: 'Track Order',
    secondaryCtaLink: '/track-order',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    discountBadge: 'HOT',
  },
  {
    subtitle: 'Kitchen • Toys • Backpacks',
    title: 'Home & Lifestyle',
    highlight: 'Everyday Essentials',
    description: 'Upgrade your living space with home & kitchen items, household products, toys, and bags & backpacks.',
    cta: 'Shop Home',
    ctaLink: '/products',
    secondaryCta: 'View Offers',
    secondaryCtaLink: '/products',
    image: '/hero-home.jpg',
    discountBadge: '25%',
  },
  {
    subtitle: 'Authentic • Fresh • Delicious',
    title: 'Homemade Foods',
    highlight: 'Sri Lankan Flavours',
    description: 'Discover traditional Sri Lankan meals, homemade snacks, sweets, dry fruits, and ready-to-eat packages.',
    cta: 'Taste It Now',
    ctaLink: '/products',
    secondaryCta: 'Explore Foods',
    secondaryCtaLink: '/products',
    image: '/hero-food.jpg',
    discountBadge: '20%',
  },
];

const FEATURES = [
  { icon: Leaf, title: 'Premium Quality', desc: '100% Genuine Products' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Island Wide Delivery' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: 'COD & Online' },
  { icon: Headphones, title: '24/7 Support', desc: 'We are always here' },
];

const PROMO_BANNERS = [
  {
    title: 'Fashion & Beauty',
    subtitle: 'Trending Styles',
    desc: 'Clothing, Bags & Accessories',
    cta: 'Shop Now →',
    to: '/products',
    bg: 'bg-gradient-to-br from-[#072d1e] to-[#114b34]',
    image: '/promo-fashion.jpg',
  },
  {
    title: 'Electronics & Home',
    subtitle: 'Modern Living',
    desc: 'Mobile Accessories & Kitchen Items',
    cta: 'Shop Now →',
    to: '/products',
    bg: 'bg-gradient-to-br from-[#051f14] to-[#0a3a27]',
    image: '/promo-electronics.jpg',
  },
  {
    title: 'Homemade Foods',
    subtitle: 'Authentic Taste',
    desc: 'Sri Lankan Meals & Sweets',
    cta: 'Shop Now →',
    to: '/products',
    bg: 'bg-gradient-to-br from-[#0c3321] to-[#155338]',
    image: '/promo-food.jpg',
  },
];

const WHY_US = [
  { icon: Leaf, title: '100% Natural', desc: 'No Preservatives' },
  { icon: ShieldCheck, title: 'Genuine Products', desc: 'Trusted Brand' },
  { icon: Truck, title: 'Island Wide Delivery', desc: 'Fast & Safe' },
  { icon: Headphones, title: '24/7 Support', desc: 'We are always here' },
];

const TESTIMONIALS = [
  {
    name: 'Ayesha Perera',
    location: 'Colombo',
    rating: 5,
    text: 'Absolutely love TRS Products! The dry fruits are fresh and the delivery was super fast. Will definitely order again.',
    avatar: 'A',
  },
  {
    name: 'Rajan Kumar',
    location: 'Kandy',
    rating: 5,
    text: 'Best quality products at great prices. The Medjool dates were exceptional. Highly recommended!',
    avatar: 'R',
  },
  {
    name: 'Dilnoza Silva',
    location: 'Galle',
    rating: 5,
    text: 'Excellent service and genuinely good products. The cashews and almonds are worth every rupee.',
    avatar: 'D',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [heroSlide, setHeroSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [coupons, setCoupons] = useState([]);

  // Auto-slide hero
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Load data
  useEffect(() => {
    categoryService.getAll(true)
      .then((res) => setCategories(res.data))
      .catch(() => { })
      .finally(() => setLoadingCats(false));

    api.get('/coupons/active').then((res) => setCoupons(res.data)).catch(() => { });

    Promise.all([
      productService.getAll({ is_featured: true, per_page: 8 }),
      productService.getAll({ is_new_arrival: true, per_page: 8 }),
      productService.getAll({ is_best_seller: true, per_page: 8 }),
    ]).then(([featured, newArr, best]) => {
      setFeaturedProducts(featured.data.items || []);
      setNewArrivals(newArr.data.items || []);
      setBestSellers(best.data.items || []);
    }).catch(() => { }).finally(() => setLoadingProducts(false));
  }, []);

  const slide = HERO_SLIDES[heroSlide];

  return (
    <>
      <Helmet>
        <title>TRS Products — Quality Products for a Better Life</title>
        <meta name="description" content="TRS Products brings you premium quality dry fruits, groceries, spices, and more. Island-wide delivery in Sri Lanka. COD & online payment available." />
        <meta property="og:title" content="TRS Products — Quality Products for a Better Life" />
        <meta property="og:description" content="Premium imported products delivered island-wide. Quality · Trust · Goodness." />
      </Helmet>

      {/* ========= HERO BANNER ========= */}
      <section className="relative overflow-hidden min-h-[500px] md:min-h-[640px] bg-gradient-to-br from-[#03150e] via-[#072d1e] to-[#051f14] flex items-center" aria-label="Hero banner">
        {/* Decorative Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-[#c59a3f]/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] rounded-full bg-[#c59a3f]/10 blur-[80px] pointer-events-none" />

        {/* Botanical Gold Leaf Vectors */}
        <svg className="absolute -top-6 -left-6 w-44 h-44 text-[#c59a3f]/20 pointer-events-none stroke-current fill-none stroke-[1.2]" viewBox="0 0 100 100">
          <path d="M10 90 Q 30 50, 70 30 Q 50 70, 10 90 Z M30 50 Q 50 20, 90 10 Q 70 40, 30 50 Z" />
        </svg>
        <svg className="absolute -bottom-8 -left-8 w-56 h-56 text-[#c59a3f]/15 pointer-events-none stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 100">
          <path d="M0 100 C 30 70, 70 70, 100 0 C 70 30, 70 70, 0 100 Z" />
        </svg>
        {/* Background Swooping Curves */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 600">
          <path d="M-50,550 Q 200,280 600,340 T 1250,40" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M-50,580 Q 200,320 620,370 T 1250,80" fill="none" stroke="#c59a3f" strokeWidth="1" opacity="0.6" />
        </svg>

        <div className="container-custom relative z-10 py-12 sm:py-16 md:py-24 w-full pb-20 md:pb-32">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            {/* Left Content */}
            <div className="animate-fade-in text-center md:text-left">
              <p className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#edd58c] to-[#c59a3f] text-lg sm:text-xl md:text-2xl font-light tracking-wide inline-block">
                {slide.subtitle}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-white tracking-tight leading-[1.05] mt-4 mb-2 drop-shadow-md">
                {slide.title}
              </h1>
              <p className="text-[#d8ad38] font-black text-3xl sm:text-4xl md:text-5xl lg:text-[56px] tracking-tight leading-tight mb-4 text-shadow-gold">
                {slide.highlight}
              </p>
              <p className="text-green-50 text-sm sm:text-base md:text-lg leading-relaxed max-w-lg mx-auto md:mx-0 font-light opacity-90">
                {slide.description}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8 md:mt-10">
                <Link
                  to={slide.ctaLink}
                  className="bg-gradient-to-r from-[#c59a3f] to-[#e0c370] hover:from-[#b08732] hover:to-[#c59a3f] text-[#051f14] font-bold text-sm md:text-base px-8 py-4 rounded-full shadow-[0_8px_25px_rgba(197,154,63,0.4)] hover:shadow-[0_12px_30px_rgba(197,154,63,0.6)] transition-all duration-300 inline-flex items-center gap-2 hover:-translate-y-1 group"
                >
                  {slide.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to={slide.secondaryCtaLink}
                  className="border-2 border-[#c59a3f]/40 hover:bg-[#c59a3f]/10 text-white font-bold text-sm md:text-base px-8 py-4 rounded-full backdrop-blur-md transition-all duration-300 inline-flex items-center justify-center hover:-translate-y-1 hover:border-[#c59a3f]"
                >
                  {slide.secondaryCta}
                </Link>
              </div>
            </div>

            {/* Right Arched Image Container */}
            <div className="relative flex justify-center md:justify-end items-center mt-6 md:mt-0">
              <div className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] h-[340px] sm:h-[420px] md:h-[500px] rounded-[40px] md:rounded-l-[250px] md:rounded-r-[40px] overflow-hidden border-[6px] border-[#c59a3f]/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-[#061f14] group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-60" />
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 group-hover:rotate-1 transition-all duration-[1200ms] ease-out"
                  fetchPriority="high"
                />
              </div>

              {/* Floating circular Discount Badge */}
              <div className="absolute -bottom-4 sm:-bottom-6 right-2 sm:right-6 md:right-10 bg-gradient-to-br from-[#faeec5] to-[#e0c370] text-[#072d1e] rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.4)] border-4 border-white/40 backdrop-blur-xl animate-float z-20">
                <Leaf size={18} className="text-[#072d1e] fill-[#072d1e] mb-1 opacity-80" />
                <span className="text-3xl sm:text-4xl md:text-5xl font-black leading-none tracking-tighter drop-shadow-sm">{slide.discountBadge || '30%'}</span>
                <span className="text-[10px] sm:text-xs md:text-sm font-black tracking-widest uppercase mt-1 opacity-90">OFF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 pb-4 md:pb-0">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`rounded-full transition-all duration-500 ease-out ${i === heroSlide ? 'bg-[#c59a3f] w-10 h-2.5 shadow-[0_0_10px_rgba(197,154,63,0.8)]' : 'bg-white/30 hover:bg-white/60 w-2.5 h-2.5'
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => setHeroSlide((heroSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/20 hover:bg-[#c59a3f] backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:border-[#c59a3f] transition-all duration-300 shadow-lg group"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={() => setHeroSlide((heroSlide + 1) % HERO_SLIDES.length)}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/20 hover:bg-[#c59a3f] backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:border-[#c59a3f] transition-all duration-300 shadow-lg group"
          aria-label="Next slide"
        >
          <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* ========= FEATURES BAR ========= */}
      <section className="relative z-30 -mt-10 sm:-mt-12 mx-4 lg:mx-auto max-w-6xl container-custom">
        <div className="bg-gradient-to-r from-[#03150e]/95 via-[#051f14]/95 to-[#03150e]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 group cursor-default">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#c59a3f]/20 to-transparent border border-[#c59a3f]/30 flex items-center justify-center flex-shrink-0 text-[#c59a3f] group-hover:scale-110 group-hover:border-[#c59a3f]/60 group-hover:shadow-[0_0_20px_rgba(197,154,63,0.2)] transition-all duration-300">
                  <Icon size={22} className="sm:w-[26px] sm:h-[26px] stroke-[1.5]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base text-white leading-tight truncate group-hover:text-[#edd58c] transition-colors">{title}</p>
                  <p className="text-[11px] sm:text-xs text-green-100/60 mt-1 font-medium truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= COUPONS & OFFERS ========= */}
      {coupons.length > 0 && (
        <section className="py-8 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Tag size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider">Exclusive Offers</p>
                  <h2 className="text-lg font-bold text-gray-900">Coupons & Deals</h2>
                </div>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {coupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========= CATEGORIES ========= */}
      <section className="py-10 md:py-12 bg-[#072d1e] overflow-hidden relative">
        {/* Subtle background pattern for extra premium feel */}
        <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />

        <div className="container-custom relative z-10">
          <div className="flex justify-between items-end mb-6 md:mb-8">
            <div>
              <p className="text-[#c59a3f] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1">Shop by Category</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Popular Categories</h2>
            </div>
            <Link
              to="/categories"
              onClick={() => window.scrollTo(0, 0)}
              className="text-[#edd58c] hover:text-[#c59a3f] font-semibold text-xs sm:text-sm flex items-center gap-1 group"
            >
              View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {loadingCats ? (
          <div className="container-custom relative z-10">
            <div className="flex gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-24 w-64 flex-shrink-0 opacity-20" />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Fade edges matching dark background */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-green-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-green-900 to-transparent z-10 pointer-events-none" />

            {/* Scrolling track */}
            <div className="flex gap-4 animate-scroll" style={{ width: 'max-content' }}>
              {[...categories, ...categories].map((cat, i) => (
                <Link
                  key={`${cat.id}-${i}`}
                  to={`/category/${cat.slug}`}
                  className="group flex items-center gap-4 p-3 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 w-64 flex-shrink-0"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-base font-bold text-gray-900 group-hover:text-green-900 transition-colors line-clamp-2 leading-tight">
                      {cat.name}
                    </p>
                    {cat.product_count > 0 && (
                      <p className="text-xs text-gray-500 font-medium mt-1">{cat.product_count} items</p>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-green-900 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========= PROMO BANNERS ========= */}
      <section className="py-12 md:py-16 bg-gray-50/50">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-6">
            {PROMO_BANNERS.map((banner, i) => (
              <Link
                key={i}
                to={banner.to}
                className={`relative rounded-[2rem] overflow-hidden ${banner.bg} p-8 
                             hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(7,45,30,0.15)] transition-all duration-500 group min-h-[220px] flex items-center border border-white/10`}
              >
                <div className="flex-1 z-10 relative">
                  <p className="text-[#edd58c] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 drop-shadow-sm">{banner.subtitle}</p>
                  <h3 className="text-white font-bold text-xl sm:text-2xl mb-2 group-hover:scale-105 transform origin-left transition-transform duration-300">{banner.title}</h3>
                  <p className="text-green-50/80 text-xs sm:text-sm mb-6 max-w-[85%] leading-relaxed">{banner.desc}</p>
                  <span className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm">
                    {banner.cta}
                  </span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 h-full w-3/4 bg-gradient-to-l from-transparent via-[#072d1e]/40 to-[#072d1e]/90 z-0 pointer-events-none" />
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute right-0 top-0 bottom-0 h-full w-1/2 object-cover opacity-40 mix-blend-overlay group-hover:opacity-60 group-hover:scale-110 group-hover:-rotate-2 transition-all duration-700"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========= FEATURED PRODUCTS ========= */}
      <ProductSection
        title="Featured Products"
        subtitle="SHOP"
        products={featuredProducts}
        loading={loadingProducts}
        viewAllLink="/products?is_featured=true"
      />

      {/* ========= NEW ARRIVALS ========= */}
      <ProductSection
        title="New Arrivals"
        subtitle="FRESH"
        products={newArrivals}
        loading={loadingProducts}
        viewAllLink="/products?is_new_arrival=true"
        bgLight
      />

      {/* ========= BEST SELLERS ========= */}
      <ProductSection
        title="Best Selling Products"
        subtitle="POPULAR"
        products={bestSellers}
        loading={loadingProducts}
        viewAllLink="/products?is_best_seller=true"
      />

      {/* ========= WHY CHOOSE US ========= */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#072d1e] to-[#041910] text-white relative overflow-hidden">
        {/* Subtle glowing background orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#c59a3f]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#0a3a27]/40 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container-custom relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#c59a3f] to-[#edd58c] text-xs sm:text-sm font-bold uppercase tracking-widest mb-3">Why TRS Products</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Why Choose Us?</h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-[#c59a3f] to-transparent mx-auto mt-6 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {WHY_US.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center group p-6 sm:p-8 rounded-[2rem] bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-[#c59a3f]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#0a3a27] to-[#051f14] group-hover:from-[#c59a3f] group-hover:to-[#b08732] rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-500 shadow-lg rotate-3 group-hover:-rotate-3 group-hover:scale-110">
                  <Icon size={32} className="text-[#c59a3f] group-hover:text-white transition-colors duration-500" />
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-2 text-white group-hover:text-[#edd58c] transition-colors">{title}</h3>
                <p className="text-green-100/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= TESTIMONIALS ========= */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-gold-500 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">What Our Customers Say</p>
            <h2 className="section-heading text-2xl sm:text-3xl md:text-4xl">Customer Testimonials</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card p-6 hover:-translate-y-1 transition-transform duration-300 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.rating)].map((_, s) => (
                    <Star key={s} size={14} className="text-gold-500 fill-gold-500" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#072d1e] text-[#edd58c] rounded-full flex items-center justify-center font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{t.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={11} /> {t.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= NEWSLETTER ========= */}
      <NewsletterSection />
    </>
  );
}

function ProductSection({ title, subtitle, products, loading, viewAllLink, bgLight = false }) {
  return (
    <section className={`py-10 md:py-14 ${bgLight ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="container-custom">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[#c59a3f] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1">{subtitle}</p>
            <h2 className="section-heading text-2xl sm:text-3xl font-bold">{title}</h2>
            <div className="w-12 h-1 bg-[#c59a3f] rounded mt-2" />
          </div>
          <Link
            to={viewAllLink}
            onClick={() => window.scrollTo(0, 0)}
            className="text-[#072d1e] hover:text-[#c59a3f] font-semibold text-xs sm:text-sm flex items-center gap-1 group"
          >
            View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {loading
            ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>

        {!loading && products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No products found</p>
          </div>
        )}
      </div>
    </section>
  );
}

function CouponCard({ coupon }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(`Coupon "${coupon.code}" copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const discountText = coupon.coupon_type === 'percentage'
    ? `${coupon.discount_value}% OFF`
    : `Rs. ${coupon.discount_value} OFF`;

  return (
    <div className="relative flex-shrink-0 w-72 bg-white rounded-2xl border-2 border-dashed border-amber-300 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Top accent */}
      <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />

      <div className="p-5">
        {/* Discount badge */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg">
              {discountText}
            </span>
            {coupon.min_order_amount > 0 && (
              <p className="text-[10px] text-gray-400 mt-1.5">Min. order Rs. {coupon.min_order_amount.toLocaleString()}</p>
            )}
          </div>
          <Tag size={18} className="text-amber-300 group-hover:text-amber-500 transition-colors" />
        </div>

        {/* Code */}
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between mb-2 border border-gray-100">
          <span className="font-mono font-bold text-gray-800 tracking-wider text-sm">{coupon.code}</span>
          <button
            onClick={handleCopy}
            className="text-amber-600 hover:text-amber-700 p-1 rounded-lg hover:bg-amber-50 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Description */}
        {coupon.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{coupon.description}</p>
        )}

        {/* Expiry */}
        {coupon.end_date && (
          <p className="text-[10px] text-red-400 mt-2">
            Expires: {new Date(coupon.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Dashed circle cutouts */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-amber-50 rounded-full" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-amber-50 rounded-full" />
    </div>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success('Subscribed! Check your inbox for offers.');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to subscribe');
    } finally { setLoading(false); }
  };

  return (
    <section className="py-10 md:py-14 bg-[#0a3825]">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold mb-1">Subscribe to Our Newsletter</h3>
            <p className="text-green-200/80 text-sm">Get exclusive offers, new arrivals, and more delivered to your inbox.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto max-w-md">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
              className="flex-1 md:w-72 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c59a3f] text-sm text-gray-800" required />
            <button type="submit" disabled={loading}
              className="bg-[#c59a3f] hover:bg-[#b08732] text-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-50 text-sm flex-shrink-0">
              {loading ? '...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

