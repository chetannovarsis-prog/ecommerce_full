import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

import { useStore } from '../../services/useStore';
import { ChevronLeft, Info, Truck, CreditCard, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const { cart, clearCart } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
    shippingMethod: 'standard',
    paymentMethod: 'razorpay'
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0);
  const shipping = formData.shippingMethod === 'cod' ? 70 : 0;
  const total = subtotal + shipping;

  useEffect(() => {
    const savedCustomer = JSON.parse(localStorage.getItem('customer') || 'null');
    if (savedCustomer) {
      setCustomer(savedCustomer);
      setFormData(prev => ({
        ...prev,
        email: savedCustomer.email || '',
        firstName: savedCustomer.name?.split(' ')[0] || '',
        lastName: savedCustomer.name?.split(' ').slice(1).join(' ') || ''
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (formData.paymentMethod === 'cod') {
      setFormData(prev => ({ ...prev, shippingMethod: 'cod' }));
    }
  }, [formData.paymentMethod]);

  useEffect(() => {
    if (formData.shippingMethod === 'standard' && formData.paymentMethod === 'cod') {
      setFormData(prev => ({ ...prev, paymentMethod: 'razorpay' }));
    }
  }, [formData.shippingMethod]);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const orderData = {
        amount: total,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        items: cart.map(item => ({
          productId: item.id, // Corrected from item.productId
          quantity: item.quantity,
          price: item.selectedPrice
        })),
        customerId: customer?.id || null,
        paymentMethod: formData.paymentMethod,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
          phone: formData.phone
        }
      };

      console.log('Sending Order Data:', orderData);
      const { data: order } = await api.post('/payments/create', orderData);

      // If COD, we are done
      if (formData.paymentMethod === 'cod') {
        clearCart();
        navigate(`/order-success/${order.orderId}`);
        return;
      }

      // If Razorpay, load script and open
      const resScript = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!resScript) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RakpbWkq6HmsMg',
        amount: order.amount,
        currency: order.currency,
        name: 'KnittingKnot',
        description: 'Payment for your order',
        image: '/logo.png', // Replace with your logo
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.message === "Payment verified successfully") {
              // Clear cart and redirect
              clearCart();
              navigate(`/order-success/${order.orderId}`);
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim() || customer?.name || '',
          email: formData.email || customer?.email || '',
          contact: formData.phone || ''
        },
        theme: {
          color: '#000000',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Order creation error:', error);
      if (error.response?.data) {
        console.error('Backend Error Details:', error.response.data);
        alert(`Order creation failed: ${error.response.data.message || 'Server error'}`);
      } else {
        alert('Could not initiate payment. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

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
                name="email"
                placeholder="Email or mobile phone number" 
                value={formData.email}
                onChange={handleInputChange}
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
                  <input 
                    name="firstName"
                    placeholder="First name" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" 
                  />
                  <input 
                    name="lastName"
                    placeholder="Last name" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" 
                  />
                </div>
                <input 
                  name="address"
                  placeholder="Address" 
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" 
                />
                <input 
                  name="apartment"
                  placeholder="Apartment, suite, etc. (optional)" 
                  value={formData.apartment}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" 
                />
                <div className="grid grid-cols-3 gap-4">
                   <input 
                    name="city"
                    placeholder="City" 
                    value={formData.city}
                    onChange={handleInputChange}
                    className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" 
                   />
                   <select 
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none bg-white col-span-1"
                   >
                      <option value="">State</option>
                      {[
                        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
                        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
                      ].map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                   </select>
                   <input 
                    name="pinCode"
                    placeholder="PIN code" 
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    className="p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" 
                   />
                </div>
                <input 
                  name="phone"
                  placeholder="Phone" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-sm text-sm focus:ring-1 focus:ring-black outline-none" 
                />
              </div>
           </section>

           {/* Shipping Section */}
           <section className="space-y-6">
              <h2 className="text-lg font-black tracking-tight">Shipping method</h2>
              <div className="border border-gray-200 rounded-sm overflow-hidden">
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, shippingMethod: 'standard' }))}
                  className={`p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${formData.shippingMethod === 'standard' ? 'bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      id="standard" 
                      checked={formData.shippingMethod === 'standard'}
                      onChange={() => setFormData(prev => ({ ...prev, shippingMethod: 'standard' }))}
                      className="w-4 h-4 text-black focus:ring-black" 
                    />
                    <label htmlFor="standard" className="text-[0.7rem] font-bold">Standard</label>
                  </div>
                  <span className="text-[0.7rem] font-black uppercase">FREE</span>
                </div>
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, shippingMethod: 'cod' }))}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${formData.shippingMethod === 'cod' ? 'bg-blue-50/30 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      id="cod" 
                      checked={formData.shippingMethod === 'cod'}
                      onChange={() => setFormData(prev => ({ ...prev, shippingMethod: 'cod' }))}
                      className="w-4 h-4 text-black focus:ring-black" 
                    />
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
              {formData.shippingMethod !== 'cod' && (
                <div className="border border-gray-200 rounded-sm overflow-hidden">
                       <div 
                         onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'razorpay' }))}
                         className="p-6 space-y-4 cursor-pointer"
                       >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input 
                               type="radio" 
                               name="paymentMethod" 
                               id="razorpay" 
                               checked={formData.paymentMethod === 'razorpay'}
                               readOnly
                               className="w-4 h-4 text-black focus:ring-black" 
                              />
                              <label htmlFor="razorpay" className="text-[0.7rem] font-bold uppercase">Razorpay (UPI/Cards/Netbanking)</label>
                            </div>
                         </div>
                         <div className="bg-gray-50 p-6 rounded-sm text-center space-y-4">
                           <div className="inline-block p-4 bg-white rounded-full"><CreditCard size={32} strokeWidth={1} className="text-gray-300" /></div>
                           <p className="text-[0.65rem] text-gray-500 leading-relaxed font-medium">After clicking “Pay ₹{total}”, you will be redirected to Razorpay to complete your purchase securely.</p>
                         </div>
                       </div>
                </div>
              )}
           </section>

           <button 
             onClick={handlePayment}
             disabled={loading}
             className="w-full bg-blue-600 text-white py-5 rounded-md text-[0.75rem] font-black uppercase tracking-[2px] transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
           >
             {loading ? 'Processing...' : formData.paymentMethod === 'razorpay' ? `Pay ₹${total}` : 'Complete order'}
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
