import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Check, Package, Home, ArrowLeft, ShoppingBag,
  MapPin, Phone, Mail, CreditCard, Truck, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const statusColors = {
  PAID: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
  COD: 'bg-blue-50 text-blue-600 border-blue-100',
  DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  SHIPPED: 'bg-blue-50 text-blue-600 border-blue-100',
  PROCESSING: 'bg-purple-50 text-purple-600 border-purple-100',
};

const getStatusStep = (status) => {
  switch (status) {
    case 'DELIVERED': return 3;
    case 'SHIPPED': return 2;
    default: return 1;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-black/10 border-t-black rounded-full animate-spin" />
          <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Package size={32} className="text-gray-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight">Order Not Found</h2>
            <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">{error || 'This order does not exist.'}</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[0.65rem] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all"
          >
            <ArrowLeft size={14} /> Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  const step = getStatusStep(order.status);
  const steps = [
    { label: 'Order Placed', icon: Check, completed: step >= 1 },
    { label: 'Shipped', icon: Truck, completed: step >= 2 },
    { label: 'Delivered', icon: Home, completed: step >= 3 },
  ];

  const estimatedDelivery = new Date(
    new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });

  const paymentStatusKey = order.status === 'PAID' || order.status === 'DELIVERED' || order.status === 'SHIPPED'
    ? 'PAID'
    : order.paymentMethod === 'cod' ? 'COD' : 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50/40 py-32 px-4 italic-none">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Link
            to="/profile"
            className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Link>
          <span className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-[3px]">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </motion.div>

        {/* Order Number Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 p-10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                <ShoppingBag size={28} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-[0.6rem] text-gray-400 font-black uppercase tracking-[3px]">Order</p>
                <h1 className="text-2xl font-black uppercase tracking-tighter"># {order.id.slice(-8).toUpperCase()}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`text-[0.6rem] px-4 py-2 rounded-xl font-black uppercase tracking-widest border ${statusColors[order.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                {order.status}
              </span>
              <span className={`text-[0.6rem] px-4 py-2 rounded-xl font-black uppercase tracking-widest border ${statusColors[paymentStatusKey]}`}>
                {paymentStatusKey === 'PAID' ? '✓ Paid' : paymentStatusKey === 'COD' ? 'Cash on Delivery' : 'Payment Pending'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Order Status Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 p-10 space-y-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-tight">Delivery Status</h2>
            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-emerald-600">
              <Clock size={12} />
              <span>Est. Delivery: {estimatedDelivery}</span>
            </div>
          </div>

          <div className="relative flex items-start justify-between gap-2">
            {/* Connecting Bar */}
            <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 z-0" />
            <div
              className="absolute top-5 left-10 h-[2px] bg-emerald-500 z-0 transition-all duration-700"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />

            {steps.map((s, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  s.completed
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : 'bg-white text-gray-300 border-2 border-gray-100'
                }`}>
                  <s.icon size={18} strokeWidth={2.5} />
                </div>
                <span className={`text-[0.6rem] font-black uppercase tracking-widest text-center ${s.completed ? 'text-gray-900' : 'text-gray-300'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden"
        >
          <div className="p-10 pb-4 border-b border-gray-50">
            <h2 className="text-sm font-black uppercase tracking-tight">Items Ordered</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-8 flex items-center gap-6 group hover:bg-gray-50/50 transition-colors">
                <div className="w-20 h-24 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 group-hover:shadow-md transition-shadow">
                  {item.product?.thumbnailUrl ? (
                    <img
                      src={item.product.thumbnailUrl}
                      className="w-full h-full object-cover"
                      alt={item.product?.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-tight group-hover:text-black">
                      {item.product?.name || 'Product'}
                    </h3>
                    {item.variantTitle && (
                      <div className="flex flex-wrap gap-1">
                        {item.variantTitle.split(',').map((part, pIdx) => {
                          const [key, val] = part.split(':').map(s => s.trim());
                          return (
                            <span key={pIdx} className="text-[0.55rem] px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg font-black uppercase tracking-wider text-gray-500">
                              {val ? `${key}: ${val}` : part}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right space-y-1 shrink-0">
                    <p className="text-[0.65rem] text-gray-400 font-bold">₹{item.price} × {item.quantity}</p>
                    <p className="text-base font-black tracking-tight">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Two-column: Delivery + Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 p-8 space-y-6"
          >
            <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" /> Shipping Address
            </h2>
            {order.shippingAddress ? (
              <div className="space-y-1.5 text-[0.85rem] font-medium text-gray-600 leading-relaxed">
                <p className="text-gray-900 font-black text-sm">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address}</p>
                {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pinCode}</p>
                <p className="text-gray-400">India</p>
                {order.shippingAddress.phone && (
                  <div className="flex items-center gap-2 pt-2">
                    <Phone size={12} className="text-gray-400" />
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                )}
                {order.customer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-gray-400" />
                    <span>{order.customer.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest">No address on file</p>
            )}
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 p-8 space-y-6"
          >
            <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" /> Order Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[0.8rem] font-medium text-gray-500">
                <span>Subtotal</span>
                <span className="text-gray-900 font-bold">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between items-center text-[0.8rem] font-medium text-gray-500">
                <span>Shipping</span>
                <span className="text-gray-900 font-medium">
                  {order.paymentMethod === 'cod' ? '₹70' : 'Free'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[0.8rem] font-medium text-gray-500">
                <span>Taxes</span>
                <span className="text-gray-900 font-medium">—</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className="text-sm font-black uppercase tracking-tight">Total</span>
                <span className="text-2xl font-black tracking-tighter">₹{order.totalAmount}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 space-y-2">
              <p className="text-[0.6rem] text-gray-400 font-black uppercase tracking-widest">Payment Method</p>
              <p className="text-[0.75rem] font-black uppercase text-gray-700">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (UPI / Card / Netbanking)'}
              </p>
              {order.razorpayPaymentId && (
                <p className="text-[0.6rem] text-gray-400 font-bold">
                  Payment ID: {order.razorpayPaymentId}
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-tight">Need Help?</h3>
            <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest">Our team is here for you</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="px-6 py-3 border border-gray-200 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all"
            >
              Contact Support
            </Link>
            <Link
              to="/returns"
              className="px-6 py-3 border border-gray-200 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all"
            >
              Returns & Exchanges
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default OrderDetail;
