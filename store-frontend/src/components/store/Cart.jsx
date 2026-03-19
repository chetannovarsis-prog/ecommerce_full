import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, Heart, ArrowRight } from 'lucide-react';
import { useStore } from '../../services/useStore';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cart, isCartOpen, setCartOpen, removeFromCart, updateCartQuantity } = useStore();
  const navigate = useNavigate();
  const customer = localStorage.getItem('customer');

  // Grouping logic for display
  const groupedCart = cart.reduce((acc, item) => {
    const key = `${item.id}-${item.variantId || ''}`;
    if (!acc[key]) {
      acc[key] = { ...item };
    } else {
      acc[key].quantity += item.quantity;
    }
    return acc;
  }, {});
  const displayCart = Object.values(groupedCart);

  const subtotal = displayCart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Cart Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] flex flex-col italic-none"
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Your Bag</h2>
                <span className="bg-black text-white text-[0.65rem] px-3 py-1 rounded-full font-black">
                  {displayCart.length}
                </span>
              </div>
              <button 
                onClick={() => setCartOpen(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 no-scrollbar">
              {!customer ? (
                <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
                    <Heart size={40} strokeWidth={1} className="text-gray-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[0.8rem] font-black uppercase tracking-[3px]">Login to see your bag</p>
                    <button 
                      onClick={() => {
                        setCartOpen(false);
                        navigate('/login');
                      }}
                      className="text-[0.65rem] font-bold text-black bg-gray-100 px-6 py-3 rounded-full uppercase tracking-widest mt-6 hover:bg-black hover:text-white transition-all"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              ) : displayCart.length > 0 ? (
                displayCart.map((item, idx) => (
                  <div key={`${item.id}-${item.variantId || idx}`} className="flex gap-6 group">
                    <Link 
                      to={`/products/${item.handle || item.id}`} 
                      onClick={() => setCartOpen(false)}
                      className="w-24 aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative shadow-sm block"
                    >
                      <img 
                        src={item.selectedImage} 
                        className={`w-full h-full object-cover transition-all duration-700 ${item.hoverImage ? 'absolute inset-0 group-hover:opacity-0' : 'group-hover:scale-110'}`}
                        alt={item.name} 
                      />
                      {item.hoverImage && (
                        <img 
                          src={item.hoverImage} 
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
                          alt={`${item.name} hover`} 
                        />
                      )}
                    </Link>
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="max-w-[160px]">
                          <h3 className="text-[0.75rem] font-black uppercase tracking-tight text-gray-900 leading-tight">
                            <Link to={`/products/${item.handle || item.id}`} onClick={() => setCartOpen(false)} className="hover:opacity-60 transition-opacity">
                              {item.name}
                            </Link>
                          </h3>
                          <div className="space-y-1 mt-1">
                            {item.variantTitle?.split(',').map((part, pIdx) => {
                              const [key, val] = part.split(':').map(s => s.trim());
                              if (!val) return <p key={pIdx} className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">{part}</p>;
                              return (
                                <p key={pIdx} className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest leading-none">
                                  <span className="text-gray-300">{key}:</span> {val}
                                </p>
                              );
                            })}
                            {!item.variantTitle && <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">Standard Piece</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[0.8rem] font-black text-gray-900">₹{item.selectedPrice * item.quantity}</p>
                          {item.quantity > 1 && (
                            <p className="text-[0.55rem] text-gray-400 font-bold mt-1 uppercase">₹{item.selectedPrice} x {item.quantity}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                          <button 
                            onClick={() => updateCartQuantity(item.id, item.variantId, item.quantity - 1)}
                            className="text-gray-400 hover:text-black transition-colors"
                          >
                            <Minus size={12} strokeWidth={3} />
                          </button>
                          <span className="text-[0.8rem] font-black w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, item.variantId, item.quantity + 1)}
                            className="text-gray-400 hover:text-black transition-colors"
                          >
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id, item.variantId)}
                          className="text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
                    <ShoppingBag size={40} strokeWidth={1} className="text-gray-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[0.8rem] font-black uppercase tracking-[3px]">Your bag is empty</p>
                    <button 
                      onClick={() => setCartOpen(false)}
                      className="text-[0.65rem] font-bold text-blue-600 uppercase tracking-widest mt-4 underline underline-offset-4"
                    >
                      Browse our collections
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {customer && displayCart.length > 0 && (
              <div className="p-10 bg-gray-50 space-y-8 shrink-0 border-t border-gray-100 rounded-t-[2.5rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)]">
                <div className="space-y-3">
                  <div className="flex justify-between text-[0.7rem] font-black uppercase tracking-widest text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-gray-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[0.7rem] font-black uppercase tracking-widest text-gray-400">
                    <span>Shipping</span>
                    <span className="text-emerald-500 font-bold uppercase">Calculated in next step</span>
                  </div>
                </div>
                <div className="pt-8 border-t border-gray-200">
                  <div className="flex justify-between text-2xl font-black uppercase tracking-tighter mb-8 italic">
                    <span>Total</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <button 
                    onClick={() => {
                        setCartOpen(false);
                        navigate('/checkout');
                    }}
                    className="w-full bg-black text-white py-5 rounded-2xl text-[0.75rem] font-black uppercase flex items-center justify-center gap-1 hover:bg-zinc-800 transition-all group active:scale-95 shadow-2xl shadow-black/20"
                  >
                    Proceed to Checkout <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
