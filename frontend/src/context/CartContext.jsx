import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { getApiError } from '../services/api';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'trs_cart';

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Load cart
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await cartService.get();
      setCart(res.data);
      // Save to localStorage as backup
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(res.data));
    } catch (error) {
      // Load from localStorage if API fails
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        try { setCart(JSON.parse(saved)); } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1, variantId = null) => {
    try {
      const res = await cartService.addItem({ product_id: productId, quantity, variant_id: variantId });
      setCart(res.data);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(res.data));
      toast.success('Added to cart!', { icon: '🛒' });
      setCartOpen(true);
      return true;
    } catch (error) {
      toast.error(getApiError(error));
      return false;
    }
  }, []);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      const res = await cartService.updateItem(itemId, quantity);
      setCart(res.data);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(res.data));
    } catch (error) {
      toast.error(getApiError(error));
    }
  }, []);

  const removeItem = useCallback(async (itemId) => {
    try {
      const res = await cartService.removeItem(itemId);
      setCart(res.data);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(res.data));
      toast.success('Item removed');
    } catch (error) {
      toast.error(getApiError(error));
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await cartService.clear();
      setCart({ items: [], subtotal: 0, item_count: 0 });
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }, []);

  const cartCount = cart.item_count || cart.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartOpen,
        cartCount,
        setCartOpen,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
