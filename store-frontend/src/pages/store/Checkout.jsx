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

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email format').required('Email is required'),
  firstName: Yup.string().min(3, 'First name too short').required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  address: Yup.string().min(10, 'Address must be at least 10 characters').required('Address is required'),
  apartment: Yup.string(),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  pinCode: Yup.string()
    .matches(/^[1-9][0-9]{5}$/, 'Invalid Pincode format')
    .required('Pincode is required'),
  phone: Yup.string()
    .test('valid-indian-phone', 'Invalid Indian phone number', (value) => {
      if (!value) return false;
      return /^[6-9]\d{9}$/.test(normalizeIndianPhone(value));
    })
    .required('Phone is required'),
  paymentMethod: Yup.string().required(),
});

// ─── PincodeLookup Component ─────────────────────────────────────────────────
const PincodeLookup = ({ pinCode, setFieldValue, setFieldError, setFieldTouched }) => {
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!pinCode || pinCode.length !== 6 || !/^[1-9][0-9]{5}$/.test(pinCode)) return;

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

  const subtotal = cart.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0);
  const couponDiscount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percentage) * 100) / 10000
    : 0;
  const discountedSubtotal = subtotal - couponDiscount;

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
        setTimeout(() => navigate(`/order-success/${order.orderId}`), 1000);
        return;
      }

      const resScript = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!resScript) {
        alert('Razorpay SDK failed to load.');
        setLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RakpbWkq6HmsMg',
        amount: order.amount,
        currency: order.currency,
        name: 'Ghar of Ethnics',
        order_id: order.id,
        handler: async (response) => {
          setIsProcessing(true);
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            navigate(`/order-success/${order.orderId}`);
          } catch (error) {
            setIsProcessing(false);
            alert('Payment verification failed.');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            document.body.style.overflow = 'auto';
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
                <header className="flex flex-col gap-6">
                  <h1 className="text-2xl font-black tracking-tight">Ghar of Ethnics</h1>
                  <nav className="flex items-center gap-2 text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Cart</span>
                    <ChevronLeft size={10} className="rotate-180" />
                    <span className="text-black">Information</span>
                    <ChevronLeft size={10} className="rotate-180" />
                    <span>Shipping</span>
                    <ChevronLeft size={10} className="rotate-180" />
                    <span>Payment</span>
                  </nav>
                </header>

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
                      className={`w-full p-4 border rounded-sm text-sm outline-none ${
                        touched.email && errors.email
                          ? 'border-red-500 bg-red-50/40'
                          : 'border-gray-200'
                      }`}
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
                          className={`w-full p-4 border rounded-sm text-sm ${
                            touched.firstName && errors.firstName
                              ? 'border-red-500'
                              : 'border-gray-200'
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
                          className={`w-full p-4 border rounded-sm text-sm ${
                            touched.lastName && errors.lastName
                              ? 'border-red-500'
                              : 'border-gray-200'
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
                        className={`w-full p-4 border rounded-sm text-sm ${
                          touched.address && errors.address ? 'border-red-500' : 'border-gray-200'
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative col-span-1">
                        <Field
                          name="pinCode"
                          placeholder="Pincode"
                          maxLength={6}
                          className={`w-full p-4 border rounded-sm text-sm ${
                            touched.pinCode && errors.pinCode
                              ? 'border-red-500'
                              : 'border-gray-200'
                          }`}
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
                          className="w-full p-4 border border-gray-200 rounded-sm text-sm bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1">
                        <Field
                          name="state"
                          placeholder="State"
                          readOnly
                          className="w-full p-4 border border-gray-200 rounded-sm text-sm bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Field
                        name="phone"
                        placeholder="Phone (10 digits)"
                        className={`w-full p-4 border rounded-sm text-sm ${
                          touched.phone && errors.phone ? 'border-red-500' : 'border-gray-200'
                        }`}
                      />
                      <ErrorMessage
                        name="phone"
                        component="p"
                        className="text-[0.65rem] text-red-600 font-bold uppercase"
                      />
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section className="space-y-6">
                  <h2 className="text-lg font-black tracking-tight">Payment</h2>
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
                </section>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-md text-[0.75rem] font-black uppercase tracking-[2px] transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : values.paymentMethod === 'razorpay' ? (
                    `Pay ₹${discountedSubtotal}`
                  ) : (
                    `Complete Order — ₹${discountedSubtotal + 70}`
                  )}
                </button>

                <footer className="pt-10 border-t border-gray-50 flex flex-wrap gap-6 text-[0.65rem] text-blue-600 font-bold underline">
                  <a href="/returns">Refund policy</a>
                  <a href="/privacy">Privacy policy</a>
                  <a href="/terms">Terms of service</a>
                </footer>
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
                          ₹{item.selectedPrice * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-10 border-t border-gray-100">
                    <div className="flex justify-between text-[0.7rem] font-black uppercase text-gray-500">
                      <span>Subtotal</span>
                      <span className={appliedCoupon ? 'line-through text-gray-300' : ''}>
                        ₹{subtotal}
                      </span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-[0.7rem] font-black uppercase text-emerald-600">
                        <span>Coupon ({appliedCoupon.code})</span>
                        <span>- ₹{couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[0.7rem] font-black uppercase text-gray-500">
                      <span>Shipping</span>
                      <span>{values.paymentMethod === 'cod' ? '₹70.00' : 'FREE'}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black uppercase pt-4 border-t">
                      <span>Total</span>
                      <span>
                        ₹{discountedSubtotal + (values.paymentMethod === 'cod' ? 70 : 0)}
                      </span>
                    </div>
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