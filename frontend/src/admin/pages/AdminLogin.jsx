import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');
    
    try {
      setLoading(true);
      const user = await login(email, password);
      
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        return;
      }
      
      toast.success('Welcome to Admin Dashboard');
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1a3c2e]/5 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#c9a227]/10 blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="TRS Products Logo"
            className="w-20 h-20 object-contain mx-auto mb-3 bg-white p-1 rounded-2xl shadow-lg border border-gold-400/30"
          />
          <h1 className="text-3xl font-bold tracking-wider text-[#1a3c2e] mb-1">
            TRS<span className="text-[#c9a227]">PRODUCTS</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm">Admin Control Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] focus:border-transparent transition-all"
                  placeholder="admin@trsimports.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1a3c2e] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#1a3c2e] hover:bg-[#153024] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3c2e] transition-all disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-sm text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} TRS Products. All rights reserved. Developed by{' '}
          <a
            href="https://inpand.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-200 hover:text-white transition-colors"
          >
            INPAND TECHNOLOGIES
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
