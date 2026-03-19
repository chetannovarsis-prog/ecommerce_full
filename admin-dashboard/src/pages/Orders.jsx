import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ShoppingCart, Package, Clock, CheckCircle2, AlertCircle, Search, Filter, TrendingUp, DollarSign, CreditCard, RotateCcw } from 'lucide-react';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Orders</h1>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

          {[
            { label: 'Profit', value: '₹12,628', trend: '+72.8%', icon: TrendingUp, color: 'emerald' },
            { label: 'Sales', value: '₹4,679', trend: '+28.4%', icon: DollarSign, color: 'blue' },
            { label: 'Payments', value: '₹2,468', trend: '-14.8%', icon: CreditCard, color: 'amber' },
            { label: 'Transactions', value: '₹14,857', trend: '+28.1%', icon: RotateCcw, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <p className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</p>
                <span className={`text-[0.6rem] font-black uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                   {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-gray-50/50 dark:bg-white/5">
             <div className="flex items-center gap-3">
               <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[0.7rem] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                 <Filter size={14} /> Filter
               </button>
             </div>
             <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search orders..." 
                 className="pl-9 pr-4 py-1.5 w-full md:w-64 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
               />
             </div>
          </div>


          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <div className="p-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/30 dark:bg-white/2">
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Order ID</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Customer</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Date</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Total</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {orders.map((order) => (
                      <tr 
                        key={order.id} 
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover:bg-gray-50/80 dark:hover:bg-white/2 transition-colors cursor-pointer text-xs font-bold"
                      >
                        <td className="px-6 py-4 text-gray-900 dark:text-white uppercase tracking-tighter">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{order.customer?.name || 'Guest'}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-black">₹{order.total}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[0.6rem] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-32 text-center text-gray-400 flex flex-col items-center gap-4">
                <ShoppingCart size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">Currently don't have orders</p>
                  <p className="text-[0.6rem] font-bold uppercase tracking-tight">Your order history will appear here once customers start buying.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;
