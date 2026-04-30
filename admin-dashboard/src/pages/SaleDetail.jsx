import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ChevronLeft, Package, User, CreditCard, Calendar, Globe, Store, AlertCircle } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const sourceIcon = (source) => {
  if (!source) return <Globe size={14} className="text-gray-400" />;
  if (source.toLowerCase().includes('dcr') || source.toLowerCase().includes('manual')) return <Store size={14} className="text-amber-500" />;
  return <Globe size={14} className="text-blue-400" />;
};

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const res = await api.get('/sales');
        const found = (res.data || []).find(s => s.id === id);
        setSale(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#0a0a0a]">
        <AlertCircle size={40} className="text-gray-300" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-500">Sale not found</p>
        <button onClick={() => navigate('/sales')} className="text-xs font-black uppercase underline">Back to Sales</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Sale Details</h1>
            <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">#{sale.id?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sourceIcon(sale.source)}
          <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">{sale.source || 'Unknown'}</span>
        </div>
      </header>

      <main className="p-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Product Info */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-5">
          <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4">Product</h3>
          <div className="flex items-center gap-5">
            {sale.thumbnail ? (
              <div className="w-16 h-20 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 flex-shrink-0 ring-1 ring-black/5">
                <img src={sale.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-20 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                <Package size={24} className="text-gray-300" />
              </div>
            )}
            <div>
              <p className="text-sm font-black dark:text-white uppercase tracking-tight">{sale.productName || '—'}</p>
              <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest mt-1">{sale.source || 'Store Sale'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-white/5">
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Date</p>
              <p className="text-xs font-bold dark:text-white mt-1">{formatDate(sale.date)}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Total Amount</p>
              <p className="text-base font-black dark:text-white mt-1">₹{sale.price?.toLocaleString()} <span className="text-gray-400 text-xs font-bold">({sale.quantity}×)</span></p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Payment Mode</p>
              <p className="text-xs font-bold dark:text-white mt-1">{sale.paymentMode || '—'}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Payment ID</p>
              <p className="text-xs font-bold dark:text-white mt-1 truncate">{sale.paymentId || '—'}</p>
            </div>
          </div>

          {sale.notes && (
            <div className="pt-4 border-t dark:border-white/5">
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest mb-1">Notes</p>
              <p className="text-xs font-bold dark:text-white">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-5">
          <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4">Customer Info</h3>

          <div className="space-y-5">
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Name</p>
              <p className="text-sm font-bold dark:text-white mt-1">{sale.customerName || '—'}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold dark:text-white mt-1 break-all">{sale.customerEmail || '—'}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Phone</p>
              <p className="text-sm font-bold dark:text-white mt-1">{sale.customerPhone || '—'}</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SaleDetail;
