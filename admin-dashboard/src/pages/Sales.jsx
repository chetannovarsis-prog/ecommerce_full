import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { TrendingUp, Globe, Store, Package, DollarSign, Plus, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [products, setProducts] = useState([]);
  
  // Sale Form State
  const [saleForm, setSaleForm] = useState({
    productId: '',
    quantity: 1,
    price: 0
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales'); // Assuming this endpoint exists or will be added
      setSales(res.data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      // Dummy data for visualization if endpoint fails
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleRegisterSale = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sales/store', saleForm);
      setShowSaleModal(false);
      fetchSales();
      fetchProducts();
    } catch (error) {
      alert('Error registering sale');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Sales</h1>
        <button 
          onClick={() => setShowSaleModal(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.6rem] md:text-[0.7rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10"
        >
          <Plus size={16} /> <span className="hidden xs:inline">Register Sale</span><span className="xs:hidden">New</span>
        </button>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

          {[
            { label: 'Total Sales', value: '₹54,230', trend: '+12.5%', icon: TrendingUp, color: 'emerald' },
            { label: 'Website Sales', value: '₹32,100', trend: '+8.2%', icon: Globe, color: 'blue' },
            { label: 'Store Sales', value: '₹22,130', trend: '+18.4%', icon: Store, color: 'amber' },
            { label: 'Inventory Value', value: '₹142,000', trend: '-2.1%', icon: Package, color: 'purple' },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 p-6 rounded-3xl shadow-sm group hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                  <stat.icon size={24} />
                </div>
                <span className={`text-[0.65rem] font-black uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trend}
                </span>
              </div>
              <p className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Transactions Table */}
         <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-4 md:py-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
               <h3 className="text-[0.7rem] font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Sales</h3>
               <div className="flex gap-2">
                  <button className="flex-1 md:flex-none flex items-center justify-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400"><Filter size={16} /></button>
                  <button className="flex-1 md:flex-none flex items-center justify-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400"><Search size={16} /></button>
               </div>
            </div>
           
           <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/2">
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Source</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {sales.length > 0 ? sales.map((sale, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl" />
                          <span className="text-xs font-black uppercase tracking-tight">{sale.productName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[0.55rem] font-black uppercase tracking-widest ${sale.source === 'Website' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {sale.source}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs font-bold">{sale.quantity}x</td>
                      <td className="px-8 py-4 text-xs font-black tracking-tighter">₹{sale.price}</td>
                      <td className="px-8 py-4 text-[0.65rem] text-gray-400 font-bold uppercase">{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <Package size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                        <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">No sales recorded yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </main>

      {/* Register Store Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/10">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md space-y-8"
           >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">Register Sale</h2>
                <button onClick={() => setShowSaleModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"><Plus className="rotate-45" /></button>
              </div>
              
              <form onSubmit={handleRegisterSale} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Select Product</label>
                  <select 
                    required
                    className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 ring-black/5"
                    value={saleForm.productId}
                    onChange={e => {
                      const p = products.find(x => x.id === e.target.value);
                      setSaleForm({ ...saleForm, productId: e.target.value, price: p?.price || 0 });
                    }}
                  >
                    <option value="">Choose product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.inventory || 0})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                      value={saleForm.quantity}
                      onChange={e => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                      value={saleForm.price}
                      onChange={e => setSaleForm({ ...saleForm, price: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-[1.02] transition-all active:scale-95">
                    Save Sale & Update Stock
                  </button>
                </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Sales;
