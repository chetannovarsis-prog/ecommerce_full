import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Package, MapPin, Settings, ChevronRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const Profile = () => {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    if (!savedCustomer) {
      navigate('/login');
    } else {
      const parsedCustomer = JSON.parse(savedCustomer);
      setCustomer(parsedCustomer);
      fetchOrders(parsedCustomer.id);
    }
  }, [navigate]);

  const fetchOrders = async (customerId) => {
    try {
      const res = await api.get(`/orders/customer/${customerId}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    navigate('/login');
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-32 px-6 italic-none">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start justify-between">
           <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-3xl font-black ring-8 ring-white shadow-xl">
                {customer.name?.charAt(0) || 'U'}
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">{customer.name}</h1>
                <p className="text-[0.7rem] text-gray-400 font-black uppercase tracking-[2px]">{customer.email}</p>
              </div>
           </div>
           <button 
            onClick={handleLogout}
            className="px-8 py-3 bg-white border border-gray-100 rounded-xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
           >
             <LogOut size={16} /> Logout
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
           {[
             { icon: <Package size={20} />, label: "Order History", count: `${orders.length} Orders` },
             { icon: <MapPin size={20} />, label: "Addresses", count: "1 Saved" },
             { icon: <Settings size={20} />, label: "Preferences", count: "Updated" }
           ].map((item, i) => (
             <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 cursor-pointer group"
             >
                <div className="p-3 bg-gray-50 rounded-2xl w-fit group-hover:bg-black group-hover:text-white transition-colors">{item.icon}</div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-tight">{item.label}</h3>
                  <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">{item.count}</p>
                </div>
             </motion.div>
           ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
           <div className="flex items-center justify-between p-10 pb-4 border-b">
              <h2 className="text-xl font-black uppercase tracking-tight">Recent Activity</h2>
           </div>
           
           <div className="divide-y divide-gray-50">
             {loading ? (
                <div className="p-20 text-center flex justify-center">
                   <div className="w-8 h-8 border-t-2 border-black rounded-full animate-spin"></div>
                </div>
             ) : orders.length > 0 ? (
                orders.map((order) => (
                   <Link
                     key={order.id}
                     to={`/orders/${order.id}`}
                     className="block p-8 hover:bg-gray-50/60 transition-colors group"
                   >
                     <div className="flex justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                             <ShoppingBag size={24} strokeWidth={1.5} />
                           </div>
                           <div>
                             <p className="text-sm font-black uppercase tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</p>
                             <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-sm font-black text-gray-900 tracking-tight italic">₹{order.totalAmount}</p>
                             <span className={`text-[0.6rem] px-2 py-1 rounded-md font-black uppercase tracking-widest ${
                               order.status === 'PAID' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                             }`}>
                               {order.status}
                             </span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                     </div>
                   </Link>
                 ))
             ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <Package size={24} className="text-gray-300" />
                  </div>
                  <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">No recent orders found</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
