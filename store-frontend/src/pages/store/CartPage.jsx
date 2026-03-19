import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ChevronLeft, Heart } from 'lucide-react';
import { useStore } from '../../services/useStore';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const { cart, removeFromCart, updateCartQuantity } = useStore();
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
    <div className="bg-white min-h-screen pb-20 pt-24 sm:pt-32 italic-none">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
        <header className="flex flex-col gap-4 mb-16">
           <button 
             onClick={() => navigate('/')} 
             className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
           >
             <ChevronLeft size={16} /> Continue Shopping
           </button>
           <h1 className="text-5xl font-black uppercase tracking-tighter italic">Shopping Bag</h1>
        </header>

        {!customer ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-12 text-center">
             <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
               <Heart size={80} strokeWidth={1} className="text-gray-200" />
             </div>
             <div>
                <p className="text-3xl font-black uppercase tracking-tighter">Login to see your bag</p>
                <p className="text-gray-400 font-medium mt-4 text-[0.9rem]">Sign in to view items you've added to your cart.</p>
             </div>
             <button 
               onClick={() => navigate('/login')}
               className="bg-black text-white px-12 py-6 rounded-2xl text-[0.8rem] font-black uppercase tracking-[3px] hover:scale-105 transition-all shadow-2xl shadow-black/10"
             >
               Sign In Now
             </button>
          </div>
        ) : displayCart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
            {/* List */}
            <div className="lg:col-span-2 space-y-12">
              {displayCart.map((item, idx) => (
                <motion.div 
                  layout
                  key={`${item.id}-${item.variantId || idx}`} 
                  className="flex flex-col sm:flex-row gap-8 sm:gap-12 group pb-12 border-b border-gray-100 last:border-0"
                >
                  <Link 
                    to={`/products/${item.handle || item.id}`}
                    className="w-full sm:w-48 aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-md block"
                  >
                    <img 
                      src={item.selectedImage} 
                      className={`w-full h-full object-cover transition-all duration-700 ${item.hoverImage ? 'absolute inset-0 group-hover:opacity-0' : 'group-hover:scale-105'}`} 
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
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-tight">
                            <Link to={`/products/${item.handle || item.id}`} className="hover:opacity-60 transition-opacity">{item.name}</Link>
                          </h3>
                          <div className="space-y-1 mt-3">
                            {item.variantTitle?.split(',').map((part, pIdx) => {
                              const [key, val] = part.split(':').map(s => s.trim());
                              if (!val) return <p key={pIdx} className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">{part}</p>;
                              return (
                                <p key={pIdx} className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest leading-none">
                                  <span className="text-gray-300">{key}:</span> {val}
                                </p>
                              );
                            })}
                            {!item.variantTitle && <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">Standard Piece</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900">₹{item.selectedPrice * item.quantity}</p>
                          {item.quantity > 1 && (
                            <p className="text-[0.65rem] text-gray-400 font-bold mt-1 uppercase">₹{item.selectedPrice} x {item.quantity}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-16">
                         <div className="space-y-3">
                            <p className="text-[0.6rem] text-gray-400 font-black uppercase tracking-widest">Quantity</p>
                            <div className="flex items-center gap-8 bg-gray-50 px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
                              <button onClick={() => updateCartQuantity(item.id, item.variantId, item.quantity - 1)} className="text-gray-400 hover:text-black transition-colors"><Minus size={14} strokeWidth={3} /></button>
                              <span className="text-md font-black w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, item.variantId, item.quantity + 1)} className="text-gray-400 hover:text-black transition-colors"><Plus size={14} strokeWidth={3} /></button>
                            </div>
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 pt-10">
                       <button 
                         onClick={() => removeFromCart(item.id, item.variantId)}
                         className="flex items-center gap-3 text-[0.65rem] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                       >
                         <Trash2 size={16} /> Remove Item
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-gray-50 p-12 rounded-[2.5rem] space-y-10 border border-gray-100">
                <h2 className="text-2xl font-black uppercase tracking-tighter pb-8 border-b border-gray-200">Order Summary</h2>
                
                <div className="space-y-5">
                   <div className="flex justify-between text-[0.75rem] font-black uppercase tracking-widest text-gray-400">
                     <span>Subtotal</span>
                     <span className="text-gray-900">₹{subtotal}</span>
                   </div>
                   <div className="flex justify-between text-[0.75rem] font-black uppercase tracking-widest text-gray-400">
                     <span>Estimated Shipping</span>
                     <span className="text-emerald-500 font-bold">Standard Rates</span>
                   </div>
                </div>

                <div className="pt-10 border-t border-gray-200">
                  <div className="flex justify-between text-3xl font-black uppercase tracking-tighter mb-10 italic">
                    <span>Total</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-black text-white py-6 rounded-2xl text-[0.75rem] font-black uppercase tracking-[4px] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-2xl shadow-black/20 group active:scale-95"
                  >
                    Proceed to Checkout <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                  </button>
                  <p className="text-[0.6rem] text-center text-gray-400 font-bold uppercase tracking-widest mt-8 leading-relaxed opacity-60">
                    Complimentary returns within 7 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center space-y-12 text-center">
             <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
               <ShoppingBag size={80} strokeWidth={1} className="text-gray-200" />
             </div>
             <div>
                <p className="text-3xl font-black uppercase tracking-tighter">Your bag is empty</p>
                <p className="text-gray-400 font-medium mt-4 text-[0.9rem]">Discover our latest collections and find your next style statement.</p>
             </div>
             <button 
               onClick={() => navigate('/')}
               className="bg-black text-white px-12 py-6 rounded-2xl text-[0.8rem] font-black uppercase tracking-[3px] hover:scale-105 transition-all shadow-2xl shadow-black/10"
             >
               Explore Collections
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
