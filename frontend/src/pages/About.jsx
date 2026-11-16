import { Helmet } from 'react-helmet-async';
import { Shield, Truck, Heart, Award, Leaf, Headphones } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Helmet><title>About Us — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero */}
        <div className="bg-[#072d1e] text-white py-14 md:py-18 relative overflow-hidden">
          {/* Background curves */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <path d="M-50,350 Q 300,80 600,200 T 1250,30" fill="none" stroke="#c59a3f" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="container-custom text-center relative z-10">
            <img
              src="/logo.png"
              alt="TRS Products Logo"
              className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto mb-4 bg-white p-1.5 rounded-full shadow-xl border-2 border-[#c59a3f]"
            />
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-2 tracking-tight text-white">About TRS Products</h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="h-[1px] w-6 bg-[#c59a3f]"></span>
              <p className="text-[#d8ad38] text-xs md:text-sm font-bold uppercase tracking-[0.25em]">Quality · Trust · Goodness</p>
              <span className="h-[1px] w-6 bg-[#c59a3f]"></span>
            </div>
            <p className="text-green-100/90 text-sm md:text-base max-w-xl mx-auto font-normal">Trading & Retail Solutions — Good Product, Trusted Brand</p>
          </div>
        </div>

        <div className="container-custom py-12 space-y-16">
          {/* Story */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-gold-500 font-semibold text-sm uppercase tracking-wider mb-2">Our Story</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quality Products for a Better Life</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                TRS Products was founded with a simple mission — to bring premium quality products directly to your doorstep.
                From everyday essentials to premium imported items, we carefully source and deliver products that meet the highest standards of quality.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe everyone deserves access to genuine, high-quality products at fair prices. That's why we work directly with trusted suppliers worldwide to bring you the best.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-100 hover:border-[#c59a3f]/30 transition-all duration-500 transform hover:-translate-y-2 group relative overflow-hidden">
              {/* Decorative animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#072d1e]/[0.02] via-transparent to-[#c59a3f]/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className="grid grid-cols-2 gap-6 text-center relative z-10">
                {[
                  { value: '500+', label: 'Products' },
                  { value: '10K+', label: 'Happy Customers' },
                  { value: '50+', label: 'Categories' },
                  { value: '4.8★', label: 'Average Rating' },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-2xl bg-green-50 hover:bg-[#072d1e] transition-all duration-500 cursor-default hover:scale-110 transform group/stat border border-transparent hover:border-[#c59a3f]/30 hover:shadow-lg hover:shadow-[#072d1e]/20">
                    <p className="text-3xl sm:text-4xl font-extrabold text-[#072d1e] mb-1.5 group-hover/stat:text-[#edd58c] transition-colors duration-300">{s.value}</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 group-hover/stat:text-green-100/90 transition-colors duration-300 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Values */}
          <div>
            <div className="text-center mb-10">
              <p className="text-gold-500 font-semibold text-sm uppercase tracking-wider mb-2">Our Values</p>
              <h2 className="text-3xl font-bold text-gray-900">What We Stand For</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: '100% Genuine', desc: 'Every product we sell is authentic and sourced from trusted suppliers.' },
                { icon: Leaf, title: 'Quality Promise', desc: 'We never compromise on quality. Every item passes strict quality checks.' },
                { icon: Truck, title: 'Fast Delivery', desc: 'Island-wide delivery with care. Free delivery on orders above Rs. 5,000.' },
                { icon: Heart, title: 'Customer First', desc: 'Your satisfaction is our priority. Easy returns and dedicated support.' },
                { icon: Award, title: 'Best Prices', desc: 'Premium products at competitive prices. Great value for your money.' },
                { icon: Headphones, title: '24/7 Support', desc: 'We are always here to help. Reach us anytime via phone, email, or WhatsApp.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl shadow-card p-6 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={22} className="text-green-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 hover:bg-[#072d1e] rounded-2xl p-8 border border-green-100 hover:border-[#c59a3f]/40 shadow-sm hover:shadow-xl hover:shadow-[#072d1e]/20 transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer relative overflow-hidden">
              {/* Decorative subtle background icon */}
              <Award size={100} className="absolute -bottom-4 -right-4 text-[#072d1e]/5 group-hover:text-[#edd58c]/10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3 text-[#072d1e] group-hover:text-[#edd58c] group-hover:tracking-wider transition-all duration-300 flex items-center gap-2">
                  Our Mission
                </h3>
                <p className="text-gray-700 leading-relaxed group-hover:text-green-100/90 transition-colors duration-300">To provide premium quality products at affordable prices while delivering exceptional customer service and building lasting relationships with our customers.</p>
              </div>
            </div>

            <div className="bg-green-50 hover:bg-[#072d1e] rounded-2xl shadow-sm hover:shadow-xl hover:shadow-[#072d1e]/20 p-8 border border-green-100 hover:border-[#c59a3f]/40 transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer relative overflow-hidden">
              {/* Decorative subtle background icon */}
              <Shield size={100} className="absolute -bottom-4 -right-4 text-[#072d1e]/5 group-hover:text-[#edd58c]/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-[#072d1e] group-hover:text-[#edd58c] mb-3 group-hover:tracking-wider transition-all duration-300 flex items-center gap-2">
                  Our Vision
                </h3>
                <p className="text-gray-700 group-hover:text-green-100/90 leading-relaxed transition-colors duration-300">To become Sri Lanka's most trusted online destination for quality imported products, known for our commitment to authenticity, affordability, and customer satisfaction.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
