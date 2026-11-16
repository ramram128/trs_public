import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';
import { getApiError } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('trs_token');
    const savedUser = localStorage.getItem('trs_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify token is still valid
        authService.getMe()
          .then((res) => setUser(res.data))
          .catch(() => {
            localStorage.removeItem('trs_token');
            localStorage.removeItem('trs_user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('trs_token', access_token);
    localStorage.setItem('trs_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('trs_token', access_token);
    localStorage.setItem('trs_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('trs_token');
    localStorage.removeItem('trs_user');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/';
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('trs_user', JSON.stringify(userData));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, isAdmin, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
