import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Package, MapPin, Settings, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const [customer, setCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    if (!savedCustomer) {
      navigate('/login');
    } else {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    navigate('/login');
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start justify-between">
           <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-3xl font-black">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { icon: <Package size={20} />, label: "Order History", count: "0 Orders" },
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

        <div className="bg-white rounded-[2rem] border border-gray-100 p-10 shadow-xl shadow-black/5">
           <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <h2 className="text-xl font-black uppercase tracking-tight">Recent Activity</h2>
              <button className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 hover:text-black">View All</button>
           </div>
           <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Package size={24} className="text-gray-300" />
              </div>
              <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">No recent orders found</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
