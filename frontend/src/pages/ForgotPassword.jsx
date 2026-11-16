import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import api, { getApiError } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - TRS Products</title>
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>

            {sent ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h1 className="text-2xl font-bold text-green-900 mb-2">Check Your Email</h1>
                <p className="text-gray-600 mb-6">
                  If an account exists with <strong>{email}</strong>, we've sent a password reset link.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 transition font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-700" />
                  </div>
                  <h1 className="text-2xl font-bold text-green-900 mb-2">Forgot Password?</h1>
                  <p className="text-gray-600">Enter your email and we'll send you a reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
