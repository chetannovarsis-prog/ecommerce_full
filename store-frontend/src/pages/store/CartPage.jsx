import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ChevronLeft, Heart } from 'lucide-react';
import { useStore } from '../../services/useStore';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// --- Bulk Discount Tiers ---
const DISCOUNT_TIERS = [
  { minItems: 3, percent: 10, label: '3 Items' },
  { minItems: 6, percent: 15, label: '6 Items' },
  { minItems: 9, percent: 20, label: '9 Items' },
];

function getBulkDiscount(totalQty) {
  let activeTier = null;
  for (const tier of DISCOUNT_TIERS) {
    if (totalQty >= tier.minItems) activeTier = tier;
  }
  return activeTier;
}

function getNextTier(totalQty) {
  return DISCOUNT_TIERS.find(t => t.minItems > totalQty) || null;
}

// ─────────────────────────────────────────────
// Offer Banner
// ─────────────────────────────────────────────
const BulkOfferBanner = ({ totalQty }) => {
  const activeTier = getBulkDiscount(totalQty);
  const nextTier   = getNextTier(totalQty);
  const itemsNeeded = nextTier ? nextTier.minItems - totalQty : 0;

  return (
    <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 sm:p-8 space-y-6">



      {/* Tier Cards */}
      <div className="grid grid-cols-3 gap-3">
        {DISCOUNT_TIERS.map((tier) => {
          const isPassed = activeTier && tier.minItems <= activeTier.minItems;
          const isActive = activeTier?.minItems === tier.minItems;
          const isNext   = nextTier?.minItems === tier.minItems;

          return (
            <motion.div
              key={tier.minItems}
              animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`relative rounded-2xl p-4 text-center border-2 transition-all duration-300 ${
                isPassed
                  ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-100'
                  : isNext
                  ? 'bg-white border-amber-400 shadow-md shadow-amber-100'
                  : 'bg-white/60 border-gray-200'
              }`}
            >
              {/* Checkmark for passed tiers */}
              {isPassed && (
                <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-emerald-100">
                  <span className="text-emerald-500 text-xs font-black">✓</span>
                </div>
              )}

              <p className={`text-2xl font-black leading-none ${
                isPassed ? 'text-white' : isNext ? 'text-amber-500' : 'text-gray-300'
              }`}>
                {tier.percent}%
              </p>
              <p className={`text-[0.6rem] font-black uppercase tracking-widest mt-0.5 ${
                isPassed ? 'text-emerald-100' : isNext ? 'text-amber-400' : 'text-gray-300'
              }`}>
                OFF
              </p>
              <div className={`mt-2 text-[0.65rem] font-black uppercase tracking-widest ${
                isPassed ? 'text-white/80' : isNext ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {tier.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Bar (only shown if max tier not yet reached) */}
      {nextTier && (
        <div className="space-y-2">
          <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalQty / nextTier.minItems) * 100)}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[0.62rem] text-amber-600 font-bold uppercase tracking-widest text-right">
            {totalQty} / {nextTier.minItems} items
          </p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Cart Page
// ─────────────────────────────────────────────
const CartPage = () => {
  const { cart, removeFromCart, updateCartQuantity } = useStore();
  const navigate = useNavigate();
  const customer = localStorage.getItem('customer');

  // De-duplicate by product+variant
  const groupedCart = cart.reduce((acc, item) => {
    const key = `${item.id}-${item.variantId || ''}`;
    if (!acc[key]) acc[key] = { ...item };
    else acc[key].quantity += item.quantity;
    return acc;
  }, {});
  const displayCart = Object.values(groupedCart);

  const totalQty   = displayCart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal   = displayCart.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0);
  const activeTier = getBulkDiscount(totalQty);
  const discountAmount = activeTier ? Math.round(subtotal * activeTier.percent / 100 * 100) / 100 : 0;
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="min-h-screen pb-20 pt-12 sm:pt-20 italic-none">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">

        {/* Header */}
        <header className="flex flex-col gap-4 mb-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-semibold text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={16} /> Continue Shopping
          </button>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">Shopping Bag</h1>
        </header>

        {/* Not logged in */}
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

            {/* ── Cart Items ── */}
            <div className="lg:col-span-2 space-y-12">

              {/* Offer Banner */}
              <BulkOfferBanner totalQty={totalQty} />

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
                      className={`w-full h-full object-cover transition-all duration-700 ${item.hoverImage ? 'absolute inset-0 group-hover:opacity-0' : ''}`}
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
                            <Link to={`/products/${item.handle || item.id}`} className="hover:opacity-60 transition-opacity">
                              {item.name}
                            </Link>
                          </h3>
                          <div className="space-y-1 mt-3">
                            {item.variantTitle?.split(',').map((part, pIdx) => {
                              const [key, val] = part.split(':').map(s => s.trim());
                              if (!val) return <p key={pIdx} className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">{part}</p>;
                              return (
                                <p key={pIdx} className=" text-gray-800 text-sm font-semibold  leading-none">
                                  <span className="font-bold text-orange-600 mr-1">{key} : </span> {val}
                                </p>
                              );
                            })}
                            {!item.variantTitle && <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">Standard Piece</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          {/* Original price (always shown, struck through when discount applies) */}
                          <p className={`text-2xl font-black ${
                            activeTier ? 'line-through text-gray-300' : 'text-gray-900'
                          }`}>
                            ₹{(item.selectedPrice * item.quantity).toFixed(2)}
                          </p>
                          {/* Discounted price */}
                          {activeTier && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-2xl font-black text-gray-900 mt-1"
                            >
                              ₹{(item.selectedPrice * item.quantity * (1 - activeTier.percent / 100)).toFixed(2)}
                            </motion.p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-[0.65rem] text-gray-400 font-bold mt-1 uppercase">
                              ₹{item.selectedPrice} × {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-16">
                        <div className="space-y-3">
                          <p className="text-[0.6rem] text-gray-400 font-black uppercase tracking-widest">Quantity</p>
                          <div className="flex items-center gap-8 bg-gray-50 px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
                            <button onClick={() => updateCartQuantity(item.id, item.variantId, item.quantity - 1)} className="text-gray-400 hover:text-black transition-colors">
                              <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="text-md font-black w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, item.variantId, item.quantity + 1)} className="text-gray-400 hover:text-black transition-colors">
                              <Plus size={14} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center pt-10">
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

            {/* ── Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-gray-50 p-12 rounded-[2.5rem] space-y-10 border border-gray-100">
                <h2 className="text-2xl font-black text-center pb-8 border-b border-gray-200">Order Summary</h2>

                <div className="space-y-5">
                  <div className="flex justify-between  font-black text-gray-400">
                    <span>Subtotal ({totalQty} items)</span>
                    <span className={activeTier ? 'line-through text-gray-300' : 'text-gray-900'}>
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  {activeTier && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between text-[0.75rem] font-black tracking-widest"
                    >
                      <span className="text-emerald-600">Bulk Offer ({activeTier.percent}% Off)</span>
                      <span className="text-emerald-600">− ₹{discountAmount.toFixed(2)}</span>
                    </motion.div>
                  )}

                  <div className="flex justify-between font-semibold text-sm text-gray-400">
                    <span>Estimated Shipping</span>
                    <span className="text-emerald-500">Standard Rates</span>
                  </div>
                </div>

                <div className="pt-10 border-t border-gray-200 space-y-8">
                  <div className="flex justify-between text-2xl font-bold uppercase italic">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>

                  {activeTier && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-4 flex items-center justify-between"
                    >
                      <span className="text-[0.65rem] font-black uppercase tracking-widest text-emerald-700">🎉 You're saving</span>
                      <span className="text-lg font-black text-emerald-600">₹{discountAmount.toFixed(2)}</span>
                    </motion.div>
                  )}

                  <button
                    onClick={() => navigate('/checkout')}
                    className="px-4 mx-auto bg-black text-white py-4 rounded-full border border-orange-500 font-black  flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-2xl group active:scale-95"
                  >
                    Proceed to Checkout <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                  </button>

                  {/* <p className="text-sm text-center text-gray-400 font-bold  opacity-60">
                    Complimentary returns within 7 days.
                  </p> */}
                </div>
              </div>
            </div>
          </div>

        ) : (
          /* Empty cart */
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
