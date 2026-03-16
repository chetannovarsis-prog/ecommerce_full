import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Heart, Search, User, Grid } from 'lucide-react';
import { useStore } from '../../services/useStore';

const MobileNavbar = () => {
  const { cart, wishlist } = useStore();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-4 z-[100] flex justify-between items-center pb-8">
      <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-black scale-110' : 'text-gray-400'}`}>
        {({ isActive }) => (
          <>
            <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[0.6rem] font-black uppercase tracking-widest">Home</span>
          </>
        )}
      </NavLink>
      <NavLink to="/shop" className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-black scale-110' : 'text-gray-400'}`}>
        {({ isActive }) => (
          <>
            <Grid size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[0.6rem] font-black uppercase tracking-widest">Shop</span>
          </>
        )}
      </NavLink>
      <NavLink to="/cart" className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all relative ${isActive ? 'text-black scale-110' : 'text-gray-400'}`}>
        {({ isActive }) => (
          <>
            <div className="relative">
              <ShoppingBag size={22} strokeWidth={isActive ? 2.5 : 2} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[0.5rem] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[0.6rem] font-black uppercase tracking-widest">Cart</span>
          </>
        )}
      </NavLink>
      <NavLink to="/wishlist" className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all relative ${isActive ? 'text-black scale-110' : 'text-gray-400'}`}>
        {({ isActive }) => (
          <>
            <div className="relative">
              <Heart size={22} strokeWidth={isActive ? 2.5 : 2} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[0.5rem] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {wishlist.length}
                </span>
              )}
            </div>
            <span className="text-[0.6rem] font-black uppercase tracking-widest">List</span>
          </>
        )}
      </NavLink>
      <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-black scale-110' : 'text-gray-400'}`}>
        {({ isActive }) => (
          <>
            <User size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[0.6rem] font-black uppercase tracking-widest">Account</span>
          </>
        )}
      </NavLink>
    </div>
  );
};

export default MobileNavbar;
