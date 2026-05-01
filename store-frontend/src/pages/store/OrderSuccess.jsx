import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Package, Truck, Home, X, HelpCircle, Phone, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import InvoiceGenerator from '../../components/InvoiceGenerator';

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let orderId = id;
        
        // If URL is /order-success/thank-you, fetch the latest order for the customer
        if (id === 'thank-you') {
          try {
            const savedCustomer = JSON.parse(localStorage.getItem('customer') || 'null');
            
            if (savedCustomer?.id) {
              const ordersRes = await api.get(`/orders/customer/${savedCustomer.id}`);
              const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);
              
              if (orders.length > 0) {
                // Get the most recent order
                const latestOrder = orders.reduce((latest, current) => {
                  return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
                });
                orderId = latestOrder.id;
              } else {
                console.error('No orders found for customer');
                navigate('/');
                return;
              }
            } else {
              console.error('Customer not found in localStorage');
              navigate('/');
              return;
            }
          } catch (err) {
            console.error('Error fetching orders:', err);
            navigate('/');
            return;
          }
        }
        
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
        
        // Try fetching shipment
        try {
           const shipRes = await api.get(`/shipping/order/${orderId}`);
           setShipment(shipRes.data.shipment);
        } catch {
           setShipment(null);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusStep = () => {
    const status = shipment?.status || order?.status;
    switch (status) {
      case 'DELIVERED': return 3;
      case 'OUT_FOR_DELIVERY':
      case 'SHIPPED': 
      case 'IN_TRANSIT': return 2;
      default: return 1;
    }
  };

  const steps = [
    { label: 'Placed', icon: Check, completed: getStatusStep() >= 1 },
    { label: 'Shipped', icon: Package, completed: getStatusStep() >= 2 },
    { label: 'Delivered', icon: Home, completed: getStatusStep() >= 3 }
  ];

  const shippingCharge = order?.paymentMethod === 'cod' ? 70 : 0;
  const originalItemsSubtotal =
    order?.items?.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    ) || 0;
  const paidTotal = Number(order?.totalAmount || 0);
  const paidItemsSubtotal = Math.max(0, paidTotal - shippingCharge);
  const discountAmount = Math.max(0, originalItemsSubtotal - paidItemsSubtotal);
  const hasDiscount = discountAmount > 0.01;

  return (
    <div className="min-h-screen bg-white pb-20 pt-10 px-4 md:px-0 font-sans selection:bg-black selection:text-white">
      <div className="max-w-[700px] mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-gray-100 gap-4 flex-wrap">
           <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order details</h1>
           <div className="flex items-center gap-2">
             {order && <InvoiceGenerator order={order} customer={order?.customer} responsive={true} />}
             <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
             >
               <X size={14} /> <span className="hidden sm:inline">Back to overview</span>
             </button>
           </div>
        </header>

        {/* Main Content Card */}
        <div className="space-y-12">
           
           {/* Confirmation Banner */}
           <div className="space-y-4">
              <p className="text-[0.95rem] text-gray-600 leading-relaxed">
                We have sent the order confirmation details to <span className="font-semibold text-gray-900">{order?.customer?.email || 'your email'}</span>.
              </p>
              <div className="space-y-1">
                <p className="text-[0.9rem] text-gray-500">
                  Order date: <span className="text-gray-900">{new Date(order?.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}</span>
                </p>
                <Link to={`/profile`} className="text-[0.9rem] text-blue-600 hover:underline">
                  Order number: {order?.invoiceNumber || order?.id}
                </Link>
              </div>
           </div>

           {/* Status Tracker */}
           <section className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-900 mb-8 tracking-wide">Order Status</p>
              <div className="relative flex items-center justify-between max-w-[400px]">
                 {/* Connecting Lines */}
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1.5px] bg-gray-200 -z-0"></div>
                 
                 {steps.map((step, idx) => (
                   <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-gray-400 border border-gray-200'}`}>
                         <step.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                   </div>
                 ))}
              </div>
           </section>

           {/* Estimated Delivery */}
           <div className="flex items-center gap-2">
              <span className="text-[0.95rem] text-gray-600 font-medium tracking-tight">Estimated Delivery:</span>
              <span className="text-[0.95rem] text-emerald-600 font-bold tracking-tight">
                {new Date(new Date(order?.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}
              </span>
           </div>

           {/* Status Badges */}
           <div className="space-y-4 pt-4 border-t border-gray-50">
              <div className="flex justify-between items-center">
                 <span className="text-[0.95rem] text-gray-500 font-medium">Order Status</span>
                 <span className={`text-[0.95rem] font-bold ${order?.status === 'DELIVERED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                   {order?.status === 'DELIVERED' ? 'Fulfilled' : 'Not fulfilled'}
                 </span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[0.95rem] text-gray-500 font-medium">Payment Status</span>
                 <span className="text-[0.95rem] text-gray-900 font-bold">
                   {order?.status === 'PAID' || order?.status === 'COD_CONFIRMED' ? 'Authorized' : order?.status || 'Pending'}
                 </span>
              </div>
           </div>
           {/* Items List */}
           <section className="space-y-6 pt-6 border-t border-gray-100">
              {order?.items?.map((item, idx) => (
                <div key={idx} className="flex gap-6 items-start py-2 group">
                   <div className="w-16 h-18 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 group-hover:shadow-md transition-shadow">
                      <img src={item.product?.thumbnailUrl} className="w-full h-full object-contain" alt={item.product?.name} />
                   </div>
                   <div className="flex-1 flex justify-between items-start">
                      <div className="space-y-1">
                         <h3 className="text-sm font-bold text-gray-900 group-hover:text-black">{item.product?.name}</h3>
                         <p className="text-[0.75rem] text-gray-400 font-medium">{item.variantTitle || 'Standard'}</p>
                     </div>
                      <div className="text-right space-y-1">
                         <p className="text-[0.8rem] text-gray-500 font-medium">{item.quantity}x ₹{item.price}.00</p>
                         <p className="text-[0.85rem] text-gray-900 font-bold">₹{item.price * item.quantity}.00</p>
                      </div>
                   </div>
                </div>
              ))}
           </section>

           {/* Delivery Section */}
           <section className="space-y-8 pt-12 border-t border-gray-100">
              <h2 className="text-4xl font-black text-gray-900 flex items-center gap-4">Delivery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Shipping Address</p>
                    <div className="text-[0.95rem] text-gray-700 space-y-1 font-medium leading-relaxed">
                       <p className="text-gray-900 font-black mb-1">{order?.shippingAddress?.firstName} {order?.shippingAddress?.lastName}</p>
                       <p>{order?.shippingAddress?.address}</p>
                       {order?.shippingAddress?.apartment && <p>{order?.shippingAddress?.apartment}</p>}
                       <p>{order?.shippingAddress?.city}, {order?.shippingAddress?.state} {order?.shippingAddress?.pinCode}</p>
                       <p>IN</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Contact</p>
                    <div className="text-[0.95rem] text-gray-700 space-y-2 font-medium">
                       <p>{order?.shippingAddress?.phone || '7771454788'}</p>
                       <p>{order?.customer?.email || 'chetan.novarsis@gmail.com'}</p>
                    </div>
                 </div>
              </div>
           </section>

            {/* Order Summary */}
            <section className="space-y-8 pt-12 border-t border-gray-100">
               <h2 className="text-[0.95rem] font-bold text-gray-900 uppercase tracking-widest">Order Summary</h2>
               <div className="space-y-4">
                  {hasDiscount && (
                    <div className="flex justify-between items-center text-[0.95rem] font-medium text-gray-600">
                      <span>Items Total</span>
                      <span className="text-gray-900 font-bold line-through opacity-70">
                        ₹{originalItemsSubtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {hasDiscount && (
                    <div className="flex justify-between items-center text-[0.95rem] font-medium text-gray-600">
                      <span>Discount</span>
                      <span className="text-emerald-600 font-bold">
                        -₹{discountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[0.95rem] font-medium text-gray-600">
                    <span>{hasDiscount ? 'Subtotal (After Discount)' : 'Subtotal'}</span>
                    <span className="text-gray-900 font-bold">₹{paidItemsSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[0.95rem] font-medium text-gray-600">
                    <span>Shipping</span>
                    <span className="text-gray-900 font-medium">{shippingCharge ? `₹${shippingCharge}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[0.95rem] font-medium text-gray-600">
                     <span>Taxes</span>
                     <span className="text-gray-900 font-medium">—</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-gray-100 text-[1.1rem]">
                     <span className="font-bold text-gray-900">Total</span>
                     <span className="font-black text-gray-900 text-2xl tracking-tighter">₹{paidTotal.toLocaleString('en-IN')}</span>
                  </div>
               </div>
            </section>

           {/* Help Section */}
           <section className="space-y-6 pt-12 border-t border-gray-100 mb-20">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Need help?</p>
              <div className="flex flex-col gap-4">
                 <button className="w-fit text-[0.95rem] text-gray-500 font-medium hover:text-black transition-colors flex items-center gap-2">
                    Contact
                 </button>
                 <button className="w-fit text-[0.95rem] text-gray-500 font-medium hover:text-black transition-colors flex items-center gap-2">
                    Returns & Exchanges
                 </button>
              </div>
           </section>

        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
