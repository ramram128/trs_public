import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';

const formatPrice = (p) => `Rs. ${(p || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeItem, clearCart } = useCart();
  const { items = [], subtotal = 0 } = cart;

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-70 animate-fade-in"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-80 shadow-2xl 
                      flex flex-col animate-slide-right"
           id="cart-drawer">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-green-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <h2 className="font-bold text-lg">Shopping Cart</h2>
            {items.length > 0 && (
              <span className="bg-gold-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-1.5 hover:bg-green-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-8">
              <ShoppingCart size={64} className="opacity-30" />
              <div className="text-center">
                <p className="font-semibold text-gray-500 text-lg">Your cart is empty</p>
                <p className="text-sm">Add some products to get started!</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="btn-primary btn-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <CartItem key={item.id} item={item} onUpdate={updateQuantity} onRemove={removeItem} />
              ))}
              <button
                onClick={clearCart}
                className="w-full text-red-400 hover:text-red-500 text-xs flex items-center justify-center gap-1 py-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={12} /> Clear all items
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-bold text-lg text-green-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Delivery charges calculated at checkout</p>
            <Link
              to="/checkout"
              onClick={() => setCartOpen(false)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-center"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => setCartOpen(false)}
              className="w-full mt-2 text-sm text-gray-500 hover:text-green-900 py-2 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CartItem({ item, onUpdate, onRemove }) {
  return (
    <div className="flex gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      {/* Image */}
      <img
        src={item.product_image || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=100'}
        alt={item.product_name}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-800 line-clamp-2 leading-tight">{item.product_name}</p>
        {item.variant_info && (
          <p className="text-xs text-gray-400 mt-0.5">{item.variant_info}</p>
        )}
        <p className="text-green-900 font-bold text-sm mt-1">
          {`Rs. ${item.final_price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdate(item.id, item.quantity - 1)}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            disabled={item.quantity <= 1}
          >
            <Minus size={10} />
          </button>
          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            disabled={item.quantity >= item.stock}
          >
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
