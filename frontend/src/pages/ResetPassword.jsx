import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import api, { getApiError } from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <>
      <Helmet>
        <title>Reset Password - TRS Products</title>
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>

            {success ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h1 className="text-2xl font-bold text-green-900 mb-2">Password Reset!</h1>
                <p className="text-gray-600 mb-6">Your password has been updated successfully.</p>
                <Link
                  to="/login"
                  className="inline-block bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 transition font-medium"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-green-700" />
                  </div>
                  <h1 className="text-2xl font-bold text-green-900 mb-2">Reset Password</h1>
                  <p className="text-gray-600">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      required
                      minLength={8}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</> : 'Reset Password'}
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
