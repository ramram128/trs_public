import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    setEmail('');
    // Would call newsletter API
  };

  return (
    <footer className="bg-green-950 text-white">
      {/* Main footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="TRS Products Logo"
                className="w-12 h-12 object-contain rounded-full bg-white p-0.5 shadow-md border border-gold-400/40"
              />
              <div>
                <div className="font-bold text-xl text-white">TRS Products</div>
                <div className="text-gold-400 text-xs">Trading & Retail Solutions</div>
              </div>
            </div>
            <p className="text-green-300 text-sm mb-4 leading-relaxed">
              Quality Products · Trusted Brand. From everyday essentials to premium imported items,
              we bring you the best — Fresh, Safe & Affordable.
            </p>
            <p className="text-gold-400 font-script text-lg">Good Product, Trusted Brand</p>
            
            {/* Social */}
            <div className="flex items-center gap-3 mt-4">
              {[
                { svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, href: '#', label: 'Facebook' },
                { svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>, href: '#', label: 'Instagram' },
                { svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, href: '#', label: 'YouTube' },
              ].map(({ svg, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-9 h-9 bg-green-800 hover:bg-gold-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  aria-label={label}
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gold-400 mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', to: '/' },
                { label: 'All Categories', to: '/products' },
                { label: 'Offers & Deals', to: '/products?offers=true' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact Us', to: '/contact' },
                { label: 'Track Order', to: '/track-order' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-green-300 hover:text-gold-300 text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 bg-gold-500 rounded-full group-hover:w-2 transition-all"></span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-gold-400 mb-4 text-sm uppercase tracking-wider">Customer Service</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Track Order', to: '/track-order' },
                { label: 'My Account', to: '/account' },
                { label: 'My Orders', to: '/account/orders' },
                { label: 'Shipping Policy', to: '/shipping-policy' },
                { label: 'Return Policy', to: '/return-policy' },
                { label: 'Privacy Policy', to: '/privacy-policy' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-green-300 hover:text-gold-300 text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 bg-gold-500 rounded-full group-hover:w-2 transition-all"></span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <h3 className="font-semibold text-gold-400 mb-4 text-sm uppercase tracking-wider">Stay Connected</h3>
            
            <div className="space-y-3 mb-6">
              <a href="tel:+94742975043" className="flex items-center gap-2.5 text-green-300 hover:text-gold-300 text-sm transition-colors">
                <Phone size={15} className="text-gold-400 flex-shrink-0" />
                +94 742 975 043
              </a>
              <a href="mailto:support@trsimports.com" className="flex items-center gap-2.5 text-green-300 hover:text-gold-300 text-sm transition-colors">
                <Mail size={15} className="text-gold-400 flex-shrink-0" />
                support@trsimports.com
              </a>
              <div className="flex items-start gap-2.5 text-green-300 text-sm">
                <MapPin size={15} className="text-gold-400 flex-shrink-0 mt-0.5" />
                Sri Lanka
              </div>
            </div>

            {/* Newsletter */}
            <p className="text-green-300 text-sm mb-3">Subscribe for exclusive offers:</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-green-900 text-white placeholder-green-400 border border-green-700 
                           rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500"
                required
              />
              <button
                type="submit"
                className="bg-gold-500 hover:bg-gold-400 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-green-800">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-green-400 text-xs text-center sm:text-left">
              &copy; {new Date().getFullYear()} TRS Products. All rights reserved. Developed by{' '}
              <a
                href="https://inpand.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gold-400 transition-colors"
              >
                INPAND TECHNOLOGIES
              </a>
              .
            </p>
            <div className="flex items-center gap-3">
              {/* Payment icons */}
              <div className="flex items-center gap-2 opacity-70">
                {['VISA', 'MC', 'PayPal', 'COD'].map((p) => (
                  <span key={p} className="bg-white text-gray-800 text-xs px-2 py-0.5 rounded font-bold">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
