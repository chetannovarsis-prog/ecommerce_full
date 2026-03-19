import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  Clipboard
} from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/orders/${id}`, { status: newStatus });
      fetchOrder();
    } catch (error) {
      alert('Error updating order status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] space-y-4">
        <AlertCircle size={48} className="text-gray-300" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-500">Order not found</p>
        <button onClick={() => navigate('/orders')} className="text-xs font-black uppercase underline">Back to Orders</button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed': return 'text-emerald-500 bg-emerald-500/10';
      case 'pending':
      case 'processing': return 'text-amber-500 bg-amber-500/10';
      case 'cancelled':
      case 'failed': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Order Details</h1>
            <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Order #{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest border-none focus:ring-2 focus:ring-black dark:focus:ring-white/20 transition-all ${getStatusColor(order.status)}`}
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </header>

      <main className="p-10 max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column - Order Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Items Section */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Order Items</h3>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[0.6rem] font-black rounded-lg uppercase tracking-widest">Allocated</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-8 flex items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 rounded-2xl bg-gray-50 dark:bg-white/5 overflow-hidden ring-1 ring-black/5">
                      <img src={item.product?.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">{item.product?.name}</h4>
                      <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">₹{item.price} × {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black dark:text-white italic">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals Section */}
            <div className="p-8 bg-gray-50/50 dark:bg-white/2 border-t border-gray-100 dark:border-white/5 space-y-4">
              <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                <span>Subtotal</span>
                <span className="text-gray-900 dark:text-white">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                <span>Shipping</span>
                <span className="text-gray-900 dark:text-white">₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-black uppercase tracking-tighter border-t border-gray-100 dark:border-white/5 pt-4">
                <span className="dark:text-white">Total</span>
                <span className="dark:text-white italic">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
             <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Payments</h3>
                <span className={`px-2 py-1 rounded-md text-[0.55rem] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                   {order.status}
                </span>
             </div>
             <div className="p-8 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                   <div className="space-y-1">
                      <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Transaction ID</p>
                      <p className="font-black dark:text-white uppercase tracking-tighter">#{order.razorpayPaymentId || order.razorpayOrderId || 'N/A'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Payment Method</p>
                      <p className="font-black dark:text-white uppercase tracking-tighter">{order.paymentMethod || 'Manual'}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[0.65rem] font-black dark:text-white italic">₹{order.totalAmount}</p>
                   </div>
                </div>
                {order.status === 'PENDING' && (
                  <button className="w-full py-4 bg-black dark:bg-white dark:text-black text-white rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                    Capture Payment
                  </button>
                )}
             </div>
          </div>
        </div>

        {/* Right Column - Customer Info */}
        <div className="space-y-8">
          
          {/* Customer Card */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-8">
            <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4">Customer Info</h3>
            
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"><Mail size={18} className="text-gray-400" /></div>
                  <div className="flex-1">
                     <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Email Address</p>
                     <p className="text-sm font-bold dark:text-white break-all">{order.customer?.email}</p>
                  </div>
                  <button className="text-gray-300 hover:text-black dark:hover:text-white"><Clipboard size={14} /></button>
               </div>
               
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"><MapPin size={18} className="text-gray-400" /></div>
                  <div className="flex-1">
                     <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Shipping Address</p>
                     <div className="text-sm font-bold dark:text-white space-y-1 mt-1 leading-relaxed">
                        <p>{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                        <p>{order.shippingAddress?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pinCode}</p>
                        <p className="text-gray-400 text-[0.65rem] flex items-center gap-1"><Phone size={10} /> {order.shippingAddress?.phone}</p>
                     </div>
                  </div>
                  <button className="text-gray-300 hover:text-black dark:hover:text-white"><ExternalLink size={14} /></button>
               </div>

               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"><CreditCard size={18} className="text-gray-400" /></div>
                  <div className="flex-1">
                     <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Billing Address</p>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mt-1">Same as shipping address</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
             <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4 mb-8">Activity</h3>
             <div className="space-y-10 relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100 dark:bg-white/5"></div>
                
                <div className="relative flex gap-6">
                   <div className="w-8 h-8 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0 z-10">
                      <CheckCircle2 size={16} className="text-white" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-black dark:text-white uppercase tracking-tight">{order.status}</p>
                      <p className="text-[0.55rem] text-gray-400 font-bold uppercase tracking-widest">Recently updated</p>
                   </div>
                </div>

                <div className="relative flex gap-6">
                   <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 z-10">
                      <Clock size={16} className="text-gray-400" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-black dark:text-white uppercase tracking-tight">Order Placed</p>
                      <p className="text-[0.55rem] text-gray-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default OrderDetail;
