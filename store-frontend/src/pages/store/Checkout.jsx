import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';
import { useStore } from '../../services/useStore';
import { ChevronLeft, Loader2 } from 'lucide-react';

// ─── Pincode Cache (module-level, survives re-renders) ───────────────────────
const _pincodeCache = new Map();

const fetchPincode = async (pincode) => {
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) return null;
  if (_pincodeCache.has(pincode)) return _pincodeCache.get(pincode);

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    const result = data?.[0];
    if (result?.Status === 'Success') {
      _pincodeCache.set(pincode, result);
      return result;
    }
  } catch (err) {
    console.error('Pincode fetch failed:', err);
  }
  return null;
};

const isPincodeCached = (pincode) => _pincodeCache.has(pincode);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const normalizeIndianPhone = (value = '') => {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

const sanitizeNumberInput = (value) => {
  return String(value).replace(/\D/g, '');
};

const validationSchema = Yup.object({
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
  firstName: Yup.string().min(3, 'First name must be at least 3 characters').required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  address: Yup.string().min(10, 'Address must be at least 10 characters').required('Address is required'),
  apartment: Yup.string(),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  pinCode: Yup.string()
    .matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit PIN code')
    .required('PIN code is required'),
  phone: Yup.string()
    .test('valid-indian-phone', 'Please enter a valid 10-digit phone number starting with 6-9', (value) => {
      if (!value) return false;
      return /^[6-9]\d{9}$/.test(normalizeIndianPhone(value));
    })
    .required('Phone number is required'),
  paymentMethod: Yup.string().required(),
});

// ─── PincodeLookup Component ─────────────────────────────────────────────────
const PincodeLookup = ({ pinCode, setFieldValue, setFieldError, setFieldTouched }) => {
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // If pincode is empty or invalid format, clear city and state
    if (!pinCode || pinCode.length !== 6 || !/^[1-9][0-9]{5}$/.test(pinCode)) {
      if ( pinCode.length < 6) {
        // Only clear if pinCode is completely empty or too short, to avoid clearing on each keystroke during typing
        setFieldValue('city', '');
        setFieldValue('state', '');
        setFieldError('pinCode', undefined);
      }
      return;
    }

    // Already cached — apply instantly, no spinner, no delay
    if (isPincodeCached(pinCode)) {
      fetchPincode(pinCode).then((data) => {
        if (data?.PostOffice?.[0]) {
          setFieldValue('city', data.PostOffice[0].District);
          setFieldValue('state', data.PostOffice[0].State);
          setFieldError('pinCode', undefined);
          setFieldTouched('pinCode', true);
        }
      });
      return;
    }

    // Not cached — debounce then fetch
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const data = await fetchPincode(pinCode);
        if (data?.PostOffice?.[0]) {
          const { District, State } = data.PostOffice[0];
          setFieldValue('city', District);
          setFieldValue('state', State);
          setFieldError('pinCode', undefined);
          localStorage.setItem('last_pincode', pinCode);
        } else {
          setFieldError('pinCode', 'Pincode not serviceable');
          setFieldValue('city', '');
          setFieldValue('state', '');
        }
      } finally {
        setIsChecking(false);
        setFieldTouched('pinCode', true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [pinCode]);

  if (isChecking) {
    return (
      <span className="absolute right-4 top-4 animate-spin text-blue-500">
        <Loader2 size={16} />
      </span>
    );
  }
  return null;
};

// ─── Main Checkout Component ──────────────────────────────────────────────────
const Checkout = () => {
  const { cart, clearCart, appliedCoupon } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [codEnabled, setCodEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const subtotal = Math.round(cart.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0));
  const couponDiscount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percentage) / 100)
    : 0;
  const discountedSubtotal = Math.round(subtotal - couponDiscount);

  // ── On mount: load settings, customer, and prefetch last pincode ──────────
  useEffect(() => {
    // Fetch COD setting
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setCodEnabled(data.codEnabled);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();

    // Load customer
    const savedCustomer = JSON.parse(localStorage.getItem('customer') || 'null');
    if (savedCustomer) {
      setCustomer(savedCustomer);
      if (savedCustomer.id) fetchSavedAddresses(savedCustomer.id);
    }

    // Prefetch last used pincode silently in background
    const lastPincode =
      localStorage.getItem('last_pincode') || savedCustomer?.pincode;
    if (lastPincode) {
      fetchPincode(lastPincode); // fire and forget — just warms the cache
    }
  }, []);

  const fetchSavedAddresses = async (customerId) => {
    try {
      const res = await api.get(`/auth/customer/${customerId}/profile`);
      setSavedAddresses(res.data.customer.addresses || []);
    } catch (err) {
      console.error('Failed to load saved addresses:', err);
    }
  };

  const loadScript = (src) =>
    new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async (values) => {
    setLoading(true);
    try {
      const normalizedPhone = normalizeIndianPhone(values.phone);

      const backendVal = await api.post('/address/validate', {
        ...values,
        phone: normalizedPhone,
        pincode: values.pinCode,
        addressLine1: values.address,
        addressLine2: values.apartment,
        name: `${values.firstName} ${values.lastName}`,
      });

      if (!backendVal.data.success) {
        alert('Address validation failed. Please check your details.');
        setLoading(false);
        return;
      }

      const shippingCharge = values.paymentMethod === 'cod' ? 70 : 0;
      const totalAmount = discountedSubtotal + shippingCharge;

      const orderData = {
        amount: totalAmount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.selectedPrice,
          variantTitle: item.variantTitle,
        })),
        customerId: customer?.id || null,
        customerEmail: values.email || customer?.email || '',
        customerName: `${values.firstName} ${values.lastName}`.trim() || customer?.name || '',
        paymentMethod: values.paymentMethod,
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        shippingAddress: { ...values, phone: normalizedPhone },
      };

      const { data: order } = await api.post('/payments/create', orderData);

      if (values.paymentMethod === 'cod') {
        setIsProcessing(true);
        clearCart();
        setTimeout(() => navigate(`/order-success/${order.orderId}`), 1500);
        return;
      }

      const resScript = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!resScript) {
        alert('Razorpay SDK failed to load.');
        setLoading(false);
        return;
      }

      // Validate order data before proceeding
      if (!order?.id || !order?.amount || !order?.currency) {
        console.error('Invalid order data:', order);
        alert('Order creation failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Order data:', { id: order.id, amount: order.amount, currency: order.currency });

      const restoreScroll = () => {
  // Remove all possible scroll locks Razorpay adds
  document.body.style.overflow = '';
  document.body.style.overflowY = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.documentElement.style.overflow = '';
  document.documentElement.style.overflowY = '';

  // Razorpay sometimes adds a class to body
  document.body.classList.remove('razorpay-container');

  // Remove any leftover Razorpay iframe/backdrop that might block scroll
  document.querySelectorAll('.razorpay-container, .razorpay-backdrop').forEach(el => el.remove());
 };

  };


      let razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        console.warn('VITE_RAZORPAY_KEY_ID not set in environment variables. Falling back to backend config.');
        try {
          const { data } = await api.get('/payments/config');
          razorpayKey = data?.razorpayKeyId || null;
        } catch (err) {
          console.error('Failed to fetch Razorpay config from backend:', err);
        }
      }

      if (!razorpayKey) {
        alert('Payment configuration error. Please contact support.');
        setLoading(false);
        return;
      }

        const options = {
          key: razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: 'Ghar of Ethnics',
          order_id: order.id,
          handler: async (response) => {
            setIsProcessing(true);
            try {
              const verifyRes = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: orderData // Pass the full order data for creation
              });
              clearCart();
              restoreScroll();
              const finalOrderId = verifyRes.data?.order?.id || verifyRes.data?.orderId;
              navigate(`/order-success/${finalOrderId}`);
            } catch (error) {
              setIsProcessing(false);
              restoreScroll();
              alert('Payment verification failed.');
            }
          },

          modal: {
            ondismiss: () => {
              setLoading(false);
              restoreScroll();
            },
          },
          error: {
            onerror: () => {
              setLoading(false);
              restoreScroll();
            },
          },
          prefill: {
            name: `${values.firstName} ${values.lastName}`,
            email: values.email,
            contact: normalizedPhone,
          },
          theme: { color: '#1a2d5a' },
        };


        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', () => {
          setLoading(false);
          restoreScroll();
        });
        paymentObject.open();
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.message || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  };

  const initialValues = {
    email: customer?.email || '',
    firstName: customer?.name?.split(' ')[0] || '',
    lastName: customer?.name?.split(' ').slice(1).join(' ') || '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
    paymentMethod: 'razorpay',
  };

  if (cart.length === 0) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black uppercase mb-6">Your cart is empty</h2>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-black text-white uppercase text-[0.7rem] font-black"
        >
          Shop Now
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf7f0] space-y-8">
        <Loader2 className="w-20 h-20 text-[#1a2d5a] animate-spin" />
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#1a2d5a]">
            Finalizing Order...
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 text-xs">
            Please do not refresh
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen italic-none pt-32 pb-20 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fdf7f0 0%, #fef9f4 50%, #fdf0e8 100%)' }}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handlePayment}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, setFieldError, setFieldTouched }) => (
          <Form>
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">

              {/* ── Left: Form ── */}
              <div className="p-10 lg:p-20 lg:border-r border-gray-100 space-y-16">
                <div className="flex flex-col justify-between space-y-3 ">
                  <h1 className="text-2xl font-black tracking-tight">Ghar of Ethnics</h1>
                  <span className="flex items-center text-sm text-gray-400 font-bold  tracking-widest">
                    Checkout
                  </span>
                </div>
                
                {/* Contact */}
                <section className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-black tracking-tight">Contact</h2>
                    {!customer && (
                      <button
                        onClick={() => navigate('/login')}
                        className="text-[0.65rem] font-bold underline"
                      >
                        Sign in
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Field
                      name="email"
                      placeholder="Email"
                      className={`w-full p-4 border rounded-sm text-sm outline-none transition-colors ${
                        touched.email && errors.email
                          ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      onBlur={(e) => {
                        setFieldTouched('email', true);
                      }}
                    />
                    <ErrorMessage
                      name="email"
                      component="p"
                      className="text-[0.65rem] text-red-600 font-bold uppercase"
                    />
                  </div>
                </section>

                {/* Delivery */}
                <section className="space-y-6">
                  <h2 className="text-lg font-black tracking-tight">Delivery</h2>
                  <div className="space-y-4">

                    {/* Saved addresses */}
                    {savedAddresses.length > 0 && (
                      <select
                        onChange={(e) => {
                          const addr = savedAddresses.find((a) => a.id === e.target.value);
                          if (addr) {
                            setFieldValue('firstName', addr.name?.split(' ')[0] || '');
                            setFieldValue('lastName', addr.name?.split(' ').slice(1).join(' ') || '');
                            setFieldValue('address', addr.addressLine1);
                            setFieldValue('city', addr.city);
                            setFieldValue('state', addr.state);
                            setFieldValue('pinCode', addr.pincode);
                            setFieldValue('phone', addr.phone);
                            // Prefetch this address's pincode too
                            if (addr.pincode) fetchPincode(addr.pincode);
                          }
                        }}
                        className="w-full p-4 border border-gray-200 rounded-sm text-sm"
                      >
                        <option value="">Use a saved address</option>
                        {savedAddresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.addressLine1}, {a.city}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Field
                          name="firstName"
                          placeholder="First name"
                          className={`w-full p-4 border rounded-sm text-sm outline-none transition-colors ${
                            touched.firstName && errors.firstName
                              ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                              : 'border-gray-200 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage
                          name="firstName"
                          component="p"
                          className="text-[0.65rem] text-red-600 font-bold uppercase"
                        />
                      </div>
                      <div className="space-y-2">
                        <Field
                          name="lastName"
                          placeholder="Last name"
                          className={`w-full p-4 border rounded-sm text-sm outline-none transition-colors ${
                            touched.lastName && errors.lastName
                              ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                              : 'border-gray-200 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage
                          name="lastName"
                          component="p"
                          className="text-[0.65rem] text-red-600 font-bold uppercase"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Field
                        name="address"
                        placeholder="Address"
                        className={`w-full p-4 border rounded-sm text-sm outline-none transition-colors ${
                          touched.address && errors.address
                            ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                      <ErrorMessage
                        name="address"
                        component="p"
                        className="text-[0.65rem] text-red-600 font-bold uppercase"
                      />
                    </div>

                    <Field
                      name="apartment"
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full p-4 border border-gray-200 rounded-sm text-sm"
                    />

                    {/* Pincode / City / State */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="relative col-span-1">
                        <Field
                          name="pinCode"
                          placeholder="PIN code"
                          maxLength={6}
                          inputMode="numeric"
                          className={`w-full p-4 border rounded-sm text-sm outline-none transition-colors ${
                            touched.pinCode && errors.pinCode
                              ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                              : 'border-gray-200 focus:border-blue-500'
                          }`}
                          onChange={(e) => {
                            const cleaned = sanitizeNumberInput(e.target.value);
                            setFieldValue('pinCode', cleaned);
                          }}
                          onBlur={(e) => {
                            setFieldTouched('pinCode', true);
                          }}
                        />
                        <PincodeLookup
                          pinCode={values.pinCode}
                          setFieldValue={setFieldValue}
                          setFieldError={setFieldError}
                          setFieldTouched={setFieldTouched}
                        />
                        <ErrorMessage
                          name="pinCode"
                          component="p"
                          className="text-[0.65rem] text-red-600 font-bold uppercase mt-1"
                        />
                      </div>
                      <div className="col-span-1">
                        <Field
                          name="city"
                          placeholder="City"
                          readOnly
                          className="w-full p-4 border border-gray-200 rounded-sm text-sm bg-gray-50 truncate"
                          title={values.city}
                        />
                      </div>
                      <div className="col-span-1">
                        <Field
                          name="state"
                          placeholder="State"
                          readOnly
                          className="w-full p-4 border border-gray-200 rounded-sm text-sm bg-gray-50 truncate"
                          title={values.state}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Field
                        name="phone"
                        placeholder="Phone (10 digits)"
                        inputMode="numeric"
                        maxLength={10}
                        className={`w-full p-4 border rounded-sm text-sm outline-none transition-colors ${
                          touched.phone && errors.phone
                            ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                        onChange={(e) => {
                          const cleaned = sanitizeNumberInput(e.target.value);
                          setFieldValue('phone', cleaned);
                        }}
                        onBlur={(e) => {
                          setFieldTouched('phone', true);
                        }}
                      />
                      <ErrorMessage
                        name="phone"
                        component="p"
                        className="text-[0.65rem] text-red-600 font-bold uppercase flex items-center gap-1"
                      />
                    </div>
                  </div>
                </section>

                {/* <footer className="pt-10 border-t border-gray-50 flex flex-wrap gap-6 text-[0.65rem] text-blue-600 font-bold underline">
                  <a href="/returns">Refund policy</a>
                  <a href="/privacy">Privacy policy</a>
                  <a href="/terms">Terms of service</a>
                </footer> */}
              </div>

              {/* ── Right: Order Summary ── */}
              <div className="bg-gray-50/50 p-10 lg:p-20">
                <div className="sticky top-20 space-y-10">
                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-20 bg-white border border-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={item.selectedImage}
                              className="w-full h-full object-contain"
                              alt={item.name}
                              loading="lazy"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                          <p className="text-[0.75rem] font-black uppercase">{item.name}</p>
                        </div>
                        <p className="text-[0.7rem] font-black">
                          ₹{Math.round(item.selectedPrice * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-10 border-t border-gray-100">
                    <div className="flex justify-between text-[0.7rem] font-black uppercase text-gray-500">
                      <span>Subtotal</span>
                      <span className={appliedCoupon ? 'line-through text-gray-300' : ''}>
                        ₹{Math.round(subtotal)}
                      </span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-[0.7rem] font-black uppercase text-emerald-600">
                        <span>Coupon ({appliedCoupon.code})</span>
                        <span>- ₹{couponDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[0.7rem] font-black uppercase text-gray-500">
                      <span>Shipping</span>
                      <span>{values.paymentMethod === 'cod' ? (
                        <>
                          <span className="line-through text-gray-300 mr-2">₹100</span>
                          <span className="text-black">₹0</span>
                        </>
                      ) : (
                        <>
                          <span className="line-through text-gray-300 mr-2">₹100</span>
                          <span className="text-black">₹0</span>
                        </>
                      )}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black uppercase pt-4 border-t">
                      <span>Total</span>
                      <span>
                        ₹{Math.round(discountedSubtotal + (values.paymentMethod === 'cod' ? 70 : 0))}
                      </span>
                    </div>

                    {/* Payment Section */}
                    <div className="pt-8 space-y-6">
                      <h3 className="text-lg font-black tracking-tight">Payment Method</h3>
                      <div className="border border-gray-200 rounded-sm">
                        <div
                          className={`p-6 cursor-pointer ${
                            values.paymentMethod === 'razorpay' ? 'bg-blue-50/10' : ''
                          }`}
                          onClick={() => setFieldValue('paymentMethod', 'razorpay')}
                        >
                          <div className="flex items-center gap-3">
                            <Field type="radio" name="paymentMethod" value="razorpay" className="w-4 h-4" />
                            <label className="text-[0.7rem] font-bold uppercase">
                              Razorpay (Cards/UPI/Netbanking)
                            </label>
                          </div>
                        </div>
                        {codEnabled && (
                          <div
                            className={`p-6 border-t border-gray-100 cursor-pointer ${
                              values.paymentMethod === 'cod' ? 'bg-blue-50/10' : ''
                            }`}
                            onClick={() => setFieldValue('paymentMethod', 'cod')}
                          >
                            <div className="flex items-center gap-3">
                              <Field type="radio" name="paymentMethod" value="cod" className="w-4 h-4" />
                              <label className="text-[0.7rem] font-bold uppercase">
                                Cash on Delivery (₹70 Extra)
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-5 rounded-md text-[0.75rem] font-black uppercase tracking-[2px] transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 mt-8"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin mx-auto" />
                      ) : values.paymentMethod === 'razorpay' ? (
                        `Pay ₹${Math.round(discountedSubtotal)}`
                      ) : (
                        `Complete Order — ₹${Math.round(discountedSubtotal + 70)}`
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Checkout;
