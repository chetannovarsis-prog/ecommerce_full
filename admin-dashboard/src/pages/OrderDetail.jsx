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
  const [shipment, setShipment] = useState(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchShipment();
  }, [id]);

  const fetchShipment = async () => {
    try {
      const res = await api.get(`/shipping/order/${id}`);
      setShipment(res.data.shipment);
    } catch {
      setShipment(null);
    }
  };

  const createShipment = async () => {
    setShipLoading(true);
    try {
      const res = await api.post('/shipping/create', {
        orderId: id,
        address: {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          phone: order.shippingAddress.phone,
          line1: order.shippingAddress.address,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pinCode,
          country: 'IN'
        },
        items: order.items.map(i => ({ productId: i.productId, name: i.product?.name, quantity: i.quantity, price: i.price })),
        totalAmount: order.totalAmount
      });
      setShipment(res.data.shipment);
      alert('Shipment created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating shipment');
    } finally {
      setShipLoading(false);
    }
  };

  const openLabel = async () => {
    if (!shipment) return;

    if (shipment.labelUrl) {
      window.open(shipment.labelUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setLabelLoading(true);
    try {
      const res = await api.get(`/shipping/label/${id}`);
      const labelUrl = res.data.label_url || res.data.shipment?.labelUrl;

      if (!labelUrl) {
        throw new Error('Label URL is not available for this shipment');
      }

      setShipment(res.data.shipment || shipment);
      window.open(labelUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Error downloading label');
    } finally {
      setLabelLoading(false);
    }
  };

  const schedulePickup = async () => {
    if (!shipment) return;

    setPickupLoading(true);
    try {
      const res = await api.post('/shipping/schedule-pickup', {
        orderId: id,
        shipmentId: shipment.shipment_id,
      });
      setShipment(res.data.shipment || shipment);
      alert('Pickup scheduled successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error scheduling pickup');
    } finally {
      setPickupLoading(false);
    }
  };

  const cancelShipment = async () => {
    if (!shipment) return;

    const confirmed = window.confirm('Cancel this shipment? This should only be used before pickup or dispatch.');
    if (!confirmed) return;

    setCancelLoading(true);
    try {
      await api.post('/shipping/cancel', {
        shipmentId: shipment.shipment_id,
      });
      await fetchShipment();
      alert('Shipment cancelled successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling shipment');
    } finally {
      setCancelLoading(false);
    }
  };

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
      case 'awb_assigned':
      case 'pickup_scheduled':
      case 'picked':
      case 'shipped': return 'text-blue-500 bg-blue-500/10';
      case 'pending':
      case 'processing': return 'text-amber-500 bg-amber-500/10';
      case 'cancelled':
      case 'failed': return 'text-red-500 bg-red-500/10';
      case 'delivered': return 'text-emerald-600 bg-emerald-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const shipmentStatus = shipment?.status?.toUpperCase?.() || '';
  const cancelDisabled =
    !shipment ||
    ['PICKED', 'SHIPPED', 'DELIVERED'].some((status) => shipmentStatus.includes(status)) ||
    cancelLoading;
  const orderStatusLabel = order?.status || 'PENDING';
  const shippingStatusLabel = shipment?.status || 'NOT_CREATED';

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
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest ${getStatusColor(orderStatusLabel)}`}>
              {orderStatusLabel}
            </span>
            <span className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest ${getStatusColor(shippingStatusLabel)}`}>
              {shippingStatusLabel.replace(/_/g, ' ')}
            </span>
          </div>
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
                      {item.variantTitle && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variantTitle.split(',').map((part, pIdx) => {
                            const [key, val] = part.split(':').map(s => s.trim());
                            return (
                              <span key={pIdx} className="text-[0.5rem] px-2 py-0.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg font-black uppercase tracking-wider text-gray-400">
                                {val ? `${key}: ${val}` : part}
                              </span>
                            );
                          })}
                        </div>
                      )}
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

          {/* Shipment Management Card */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b dark:border-white/5 pb-4">
              <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Shipping Management</h3>
              <Truck size={16} className="text-gray-400" />
            </div>

            {shipment ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                  <div>
                    <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">AWB / Tracking Number</p>
                    <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{shipment.awb}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[0.6rem] font-black rounded-lg uppercase tracking-widest">
                    {shipment.status}
                  </span>
                </div>
                <div className="space-y-1">
                   <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest ml-1">Courier Partner</p>
                   <p className="text-xs font-bold dark:text-white ml-1">{shipment.courier || 'Standard Delivery'}</p>
                </div>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={openLabel}
                    disabled={labelLoading}
                    className="block text-center py-3 bg-gray-100 dark:bg-white/5 dark:text-white rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all underline decoration-dotted underline-offset-4 disabled:opacity-50"
                  >
                    {labelLoading ? 'Preparing Label...' : 'Download Label'}
                  </button>
                  <button
                    type="button"
                    onClick={schedulePickup}
                    disabled={pickupLoading}
                    className="block text-center py-3 bg-blue-50 text-blue-600 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-50"
                  >
                    {pickupLoading ? 'Scheduling Pickup...' : 'Schedule Pickup'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelShipment}
                    disabled={cancelDisabled}
                    className="block text-center py-3 bg-red-50 text-red-600 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelLoading ? 'Cancelling Shipment...' : 'Cancel Shipment'}
                  </button>
                  {cancelDisabled && shipment && (
                    <p className="text-[0.55rem] font-bold uppercase tracking-widest text-gray-400">
                      Cancellation disabled after pickup, shipment, or delivery.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl">
                   <p className="text-[0.6rem] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tight leading-relaxed">
                     No shipment manifest found for this order. Generate a shipment to start tracking.
                   </p>
                </div>
                <button 
                  onClick={createShipment}
                  disabled={shipLoading}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                  {shipLoading ? 'Manifesting...' : 'Create Shipment'}
                </button>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
             <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4 mb-8">Activity Log</h3>
             <div className="space-y-10 relative">
                {(order.activities && order.activities.length > 0) ? (
                  <>
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100 dark:bg-white/5"></div>
                    {order.activities.map((activity, idx) => (
                      <div key={activity.id} className="relative flex gap-6">
                        <div className={`w-8 h-8 rounded-full ${idx === 0 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-100 dark:bg-white/5'} flex items-center justify-center shrink-0 z-10 transition-transform hover:scale-110`}>
                          {idx === 0 ? (
                            <CheckCircle2 size={16} className="text-white" />
                          ) : (
                            <Clock size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black dark:text-white uppercase tracking-tight">{activity.status.replace(/_/g, ' ')}</p>
                          <p className="text-[0.6rem] text-gray-500 dark:text-gray-400 leading-relaxed font-bold">{activity.message}</p>
                          <p className="text-[0.5rem] text-gray-400 font-bold uppercase tracking-widest">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">No detailed activity found</p>
                  </div>
                )}
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default OrderDetail;
