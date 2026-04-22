import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ChevronLeft, Heart, TicketPercent, X } from 'lucide-react';
import { useStore } from '../../services/useStore';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const CartPage = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    appliedCoupon,
    applyCoupon,
    clearCoupon,
    showToast
  } = useStore();
  const navigate = useNavigate();
  const customer = localStorage.getItem('customer');
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const groupedCart = cart.reduce((acc, item) => {
    const key = `${item.id}-${item.variantId || ''}`;
    if (!acc[key]) acc[key] = { ...item };
    else acc[key].quantity += item.quantity;
    return acc;
  }, {});

  const displayCart = Object.values(groupedCart);
  const totalQty = displayCart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = displayCart.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0);
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.percentage) * 100) / 10000 : 0;
  const finalTotal = subtotal - discountAmount;

  const handleApplyCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError('Enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');

    try {
      const { data } = await api.post('/coupons/validate', { code: normalizedCode });
      applyCoupon({
        id: data.id,
        code: data.code,
        percentage: Number(data.percentage)
      });
      setCouponCode(data.code);
      showToast(`Coupon ${data.code} applied`, 'success');
    } catch (error) {
      clearCoupon();
      setCouponError(error.response?.data?.error || 'Invalid coupon code.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-12 sm:pt-20 italic-none">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
        <header className="flex flex-col gap-4 mb-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-semibold text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={16} /> Continue Shopping
          </button>
          <h1 className="md:text-5xl text-3xl font-black uppercase tracking-tighter italic">Shopping Bag</h1>
        </header>

        {!customer ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-12 text-center">
            <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
              <Heart size={80} strokeWidth={1} className="text-gray-200" />
            </div>
            <div>
              <p className="text-3xl font-black uppercase tracking-tighter">Login to see your bag</p>
              <p className="text-gray-400 font-medium mt-4 text-[0.9rem]">Sign in to view items you&apos;ve added to your cart.</p>
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
            <div className="lg:col-span-2 space-y-12">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <TicketPercent size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Apply Coupon</p>
                    <p className="text-sm font-bold text-gray-800">Enter coupon code to get discount</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (couponError) setCouponError('');
                    }}
                    className={`flex-1 px-5 py-4 border rounded-2xl text-sm font-bold uppercase tracking-wider outline-none ${couponError ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50'}`}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    type="button"
                    disabled={applyingCoupon}
                    className="px-6 py-4 bg-black text-white rounded-2xl text-[0.7rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>

                {couponError && <p className="text-[0.7rem] font-bold text-red-500">{couponError}</p>}

                {appliedCoupon && (
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4">
                    <div>
                      <p className="text-[0.65rem] font-black uppercase tracking-widest text-emerald-600">Applied Coupon</p>
                      <p className="text-sm font-bold text-emerald-700">{appliedCoupon.code} ({appliedCoupon.percentage}% OFF)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearCoupon();
                        setCouponCode('');
                        setCouponError('');
                      }}
                      className="p-2 text-emerald-700 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {displayCart.map((item, idx) => {
                const stockCount = item.variantId && item.variants
                  ? Number(item.variants.find(v => String(v.id) === String(item.variantId))?.stock ?? item.variants.find(v => String(v.id) === String(item.variantId))?.quantity ?? 0)
                  : Number(item.stock ?? item.quantity ?? 0);

                return (
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
                      className={`w-full h-full object-contain transition-all duration-700 ${item.hoverImage ? 'absolute inset-0 group-hover:opacity-0' : ''}`}
                      alt={item.name}
                    />
                    {item.hoverImage && (
                      <img
                        src={item.hoverImage}
                        className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-700"
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
                              const [key, val] = part.split(':').map((s) => s.trim());
                              if (!val) return <p key={pIdx} className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">{part}</p>;
                              return (
                                <p key={pIdx} className=" text-gray-800 text-sm font-semibold  leading-none">
                                  <span className="font-bold text-orange-600 mr-1">{key} :</span> {val}
                                </p>
                              );
                            })}
                            {!item.variantTitle && <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">Standard Piece</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${appliedCoupon ? 'line-through text-gray-300' : 'text-gray-900'}`}>
                            ₹{(item.selectedPrice * item.quantity).toFixed(2)}
                          </p>
                          {appliedCoupon && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-2xl font-black text-gray-900 mt-1"
                            >
                              ₹{(item.selectedPrice * item.quantity * (1 - appliedCoupon.percentage / 100)).toFixed(2)}
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
                          <div className="flex items-center gap-8 bg-gray-50 px-6 py-4 rounded-xl border border-gray-100 shadow-sm relative">
                            <button onClick={() => updateCartQuantity(item.id, item.variantId, item.quantity - 1)} className="text-gray-400 hover:text-black transition-colors disabled:opacity-40" disabled={item.quantity <= 1}>
                              <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="text-md font-black w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => {
                                if (item.quantity >= stockCount) {
                                  showToast(`Only ${stockCount} item(s) left in stock`, 'error');
                                } else {
                                  updateCartQuantity(item.id, item.variantId, item.quantity + 1);
                                }
                              }} 
                              className={`text-gray-400 hover:text-black transition-colors ${item.quantity >= stockCount ? 'opacity-40' : ''}`}
                            >
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
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-gray-50 p-12 rounded-[2.5rem] space-y-10 border border-gray-100">
                <h2 className="text-2xl font-black text-center pb-8 border-b border-gray-200">Order Summary</h2>

                <div className="space-y-5">
                  <div className="flex justify-between font-black text-gray-400">
                    <span>Subtotal ({totalQty} items)</span>
                    <span className={appliedCoupon ? 'line-through text-gray-300' : 'text-gray-900'}>
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between text-[0.75rem] font-black tracking-widest"
                    >
                      <span className="text-emerald-600">Coupon ({appliedCoupon.code})</span>
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

                  {appliedCoupon && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-4 flex items-center justify-between"
                    >
                      <span className="text-[0.65rem] font-black uppercase tracking-widest text-emerald-700">You&apos;re saving</span>
                      <span className="text-lg font-black text-emerald-600">₹{discountAmount.toFixed(2)}</span>
                    </motion.div>
                  )}

                  <button
                    onClick={() => navigate('/checkout')}
                    className="px-4 mx-auto bg-black text-white py-4 rounded-full border border-orange-500 font-black flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-2xl group active:scale-95"
                  >
                    Proceed to Checkout <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                  </button>
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
