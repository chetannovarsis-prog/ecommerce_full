import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../services/useStore';
import { ChevronLeft, Info, Truck, CreditCard, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const { cart } = useStore();
  const navigate = useNavigate();
  const subtotal = cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0);
  const shipping = 70; // Hardcoded shipping for now, or match reference
  const total = subtotal + shipping;

  const [step, setStep] = useState(1);
  const customer = JSON.parse(localStorage.getItem('customer') || 'null');
  const [email, setEmail] = useState(customer?.email || '');

  if (cart.length === 0) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black uppercase mb-6">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-black text-white uppercase text-[0.7rem] font-black">Shop Now</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white italic-none pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column - Forms */}
        <div className="p-10 lg:p-20 lg:border-r border-gray-100 space-y-16">
           <header className="flex flex-col gap-6">
              <h1 className="text-2xl font-black tracking-tight">KnittingKnot</h1>
              <div className="flex items-center gap-2 text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">
                <span>Cart</span>
                <ChevronLeft size={10} className="rotate-180" />
                <span className="text-black">Information</span>
                <ChevronLeft size={10} className="rotate-180" />
                <span>Shipping</span>
                <ChevronLeft size={10} className="rotate-180" />
                <span>Payment</span>
              </div>
           </header>

           {/* Contact Section */}
           <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-black tracking-tight">Contact</h2>
                {!customer && (
                  <button onClick={() => navigate('/login')} className="text-[0.65rem] font-bold underline underline-offset-4">Sign in</button>
                )}
              </div>
              <input 
                type="text" 
                placeholder="Email or mobile phone number" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none transition-all"
              />
              <p className="text-[0.6rem] text-gray-400 leading-relaxed">
                You may receive text messages related to order confirmation and shipping updates. Reply STOP to unsubscribe.
              </p>
           </section>

           {/* Delivery Section */}
           <section className="space-y-6">
              <h2 className="text-lg font-black tracking-tight">Delivery</h2>
              <div className="space-y-4">
                <select className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none bg-white">
                  <option>Country/Region: India</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="First name" className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" />
                  <input placeholder="Last name" className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" />
                </div>
                <input placeholder="Address" className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" />
                <input placeholder="Apartment, suite, etc. (optional)" className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" />
                <div className="grid grid-cols-3 gap-4">
                   <input placeholder="City" className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" />
                   <select className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none bg-white">
                      <option>State</option>
                      <option>Madhya Pradesh</option>
                   </select>
                   <input placeholder="PIN code" className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" />
                </div>
                <input placeholder="Phone" className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" />
              </div>
           </section>

           {/* Shipping Section */}
           <section className="space-y-6">
              <h2 className="text-lg font-black tracking-tight">Shipping method</h2>
              <div className="border border-gray-200 rounded-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" id="standard" defaultChecked className="w-4 h-4 text-black focus:ring-black" />
                    <label htmlFor="standard" className="text-[0.7rem] font-bold">Standard</label>
                  </div>
                  <span className="text-[0.7rem] font-black uppercase">FREE</span>
                </div>
                <div className="p-4 flex items-center justify-between bg-blue-50/30 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" id="cod" className="w-4 h-4 text-black focus:ring-black" />
                    <label htmlFor="cod" className="text-[0.7rem] font-bold uppercase">Cash on Delivery (COD)</label>
                  </div>
                  <span className="text-[0.7rem] font-black">₹70.00</span>
                </div>
              </div>
           </section>

           {/* Payment Section */}
           <section className="space-y-6">
              <h2 className="text-lg font-black tracking-tight">Payment</h2>
              <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest">All transactions are secure and encrypted.</p>
              <div className="border border-gray-200 rounded-sm overflow-hidden">
                 <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <input type="radio" name="payment" id="phonepe" className="w-4 h-4 text-black focus:ring-black" />
                         <label htmlFor="phonepe" className="text-[0.7rem] font-bold uppercase">PhonePe Gateway (UPI/Cards)</label>
                       </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-sm text-center space-y-4">
                      <div className="inline-block p-4 bg-white rounded-full"><CreditCard size={32} strokeWidth={1} className="text-gray-300" /></div>
                      <p className="text-[0.65rem] text-gray-500 leading-relaxed font-medium">After clicking “Complete order”, you will be redirected to PhonePe Gateway to complete your purchase securely.</p>
                    </div>
                 </div>
                 <div className="p-6 border-t border-gray-100 bg-blue-50/10">
                    <div className="flex items-center gap-3">
                       <input type="radio" name="payment" id="cod_pay" defaultChecked className="w-4 h-4 text-black focus:ring-black" />
                       <label htmlFor="cod_pay" className="text-[0.7rem] font-bold uppercase">Cash on Delivery (COD)</label>
                    </div>
                 </div>
              </div>
           </section>

           <button className="w-full bg-blue-600 text-white py-5 rounded-md text-[0.75rem] font-black uppercase tracking-[2px] transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95">
             Complete order
           </button>

           <footer className="pt-10 border-t border-gray-50 flex flex-wrap gap-6 text-[0.65rem] text-blue-600 font-bold underline underline-offset-4">
              <a href="/returns">Refund policy</a>
              <a href="/privacy">Privacy policy</a>
              <a href="/terms">Terms of service</a>
              <a href="/contact">Contact information</a>
           </footer>
        </div>

        {/* Right Column - Order Summary (Sticky) */}
        <div className="bg-gray-50/50 p-10 lg:p-20 order-summary">
           <div className="sticky top-20 space-y-10">
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 relative">
                       <div className="w-16 h-20 bg-white border border-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                         <img src={item.selectedImage} className="w-full h-full object-cover" />
                         <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm z-10">{item.quantity}</span>
                       </div>
                       <div className="flex-1">
                          <p className="text-[0.75rem] font-black uppercase tracking-tight leading-tight">{item.name}</p>
                          <div className="space-y-0.5 mt-1">
                            {item.variantTitle?.split(',').map((part, pIdx) => {
                              const [key, val] = part.split(':').map(s => s.trim());
                              if (!val) return <p key={pIdx} className="text-[0.6rem] text-gray-400 font-bold uppercase">{part}</p>;
                              return (
                                <p key={pIdx} className="text-[0.6rem] text-gray-400 font-bold uppercase leading-none">
                                  <span className="text-gray-300">{key}:</span> {val}
                                </p>
                              );
                            })}
                            {!item.variantTitle && <p className="text-[0.6rem] text-gray-400 font-bold uppercase">Standard Piece</p>}
                          </div>
                       </div>
                    </div>
                    <p className="text-[0.7rem] font-black">₹{item.selectedPrice * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-10 border-t border-gray-100">
                <div className="flex justify-between text-[0.7rem] font-black uppercase tracking-widest text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-black">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-[0.7rem] font-black uppercase tracking-widest text-gray-500">
                  <span>Shipping</span>
                  <span className="text-black">₹{shipping}.00</span>
                </div>
                <div className="flex justify-between text-xl font-black uppercase pt-4">
                  <span className="tracking-tight">Total</span>
                  <div className="flex items-baseline gap-2">
                     <span className="text-[0.65rem] text-gray-400 font-black">INR</span>
                     <span>₹{total}</span>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
