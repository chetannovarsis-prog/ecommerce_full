import React from 'react';
import { useStore } from '../../services/useStore';
import ProductCard from '../../components/store/ProductCard';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wishlist = () => {
  const { wishlist, toggleWishlist } = useStore();
  const navigate = useNavigate();
  const customer = localStorage.getItem('customer');

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-[1400px] mx-auto px-10 pt-20">
        <div className="flex flex-col items-center mb-16 space-y-4">
          <div className="p-4 bg-red-50 rounded-full">
            <Heart size={32} className="text-red-500" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Your Wishlist</h1>
          <p className="text-gray-400 text-[0.7rem] font-bold uppercase tracking-[2px]">
            {wishlist.length} items saved for later
          </p>
        </div>

        {!customer ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">
            <div className="p-8 bg-gray-50 rounded-full">
              <ShoppingBag size={48} className="text-gray-200" strokeWidth={1} />
            </div>
            <div className="space-y-2">
               <p className="text-xl font-black uppercase tracking-[2px]">Login to see wishlist</p>
               <p className="text-gray-400 font-bold uppercase tracking-widest text-[0.7rem]">Save items you love and find them easily later</p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="bg-black text-white px-12 py-5 rounded-full text-[0.75rem] font-black uppercase tracking-[3px] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95"
            >
              Sign In Now
            </button>
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {wishlist.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-8 border-2 border-dashed border-gray-100 rounded-3xl">
            <div className="text-center space-y-2">
               <p className="text-gray-400 font-black uppercase tracking-[3px] text-xs">Nothing has been added</p>
               <p className="text-gray-300 font-bold uppercase tracking-widest text-[0.6rem]">Your aesthetic journey starts here</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 bg-black text-white px-10 py-5 rounded-sm text-[0.7rem] font-black uppercase tracking-[3px] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95"
            >
              Add Items <ArrowLeft size={16} className="rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
