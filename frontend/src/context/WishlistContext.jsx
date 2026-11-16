import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await wishlistService.get();
      setWishlist(res.data);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  const toggle = useCallback(async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    const isInWishlist = wishlist.some((w) => w.product_id === productId);
    try {
      if (isInWishlist) {
        await wishlistService.remove(productId);
        setWishlist((prev) => prev.filter((w) => w.product_id !== productId));
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.add(productId);
        setWishlist((prev) => [...prev, { product_id: productId }]);
        toast.success('Added to wishlist! ❤️');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }, [isAuthenticated, wishlist]);

  const isInWishlist = useCallback(
    (productId) => wishlist.some((w) => w.product_id === productId),
    [wishlist]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, loading, toggle, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
