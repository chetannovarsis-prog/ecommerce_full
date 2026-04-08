import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, User, Heart } from 'lucide-react';
import { useStore } from '../../services/useStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const Navbar = () => {
  const { cart, wishlist } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const searchInputRef = useRef(null);
  const autoCloseTimerRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setIsInputFocused(false);
        setSearchQuery('');
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get(`/products?search=${searchQuery}`);
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const rankedData = data
          .map(product => {
            let score = 0;
            const q = searchQuery.toLowerCase();
            const name = (product.name || '').toLowerCase();
            if (name === q) score += 100;
            else if (name.startsWith(q)) score += 80;
            else if (name.includes(q)) score += 60;
            return { ...product, score };
          })
          .sort((a, b) => b.score - a.score);

        setSuggestions(rankedData.slice(0, 6));
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    };

    const timer = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isSearchOpen && !isInputFocused && searchQuery === '') {
      autoCloseTimerRef.current = setTimeout(() => {
        setIsSearchOpen(false);
      }, 30000);
    } else if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }

    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isSearchOpen, isInputFocused, searchQuery]);

  const handleSuggestionClick = (product) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    navigate(`/products/${product.handle || product.id}`);
  };

  const shouldShowSuggestions = isSearchOpen && searchQuery.trim().length >= 2 && suggestions.length > 0;

  const navClasses = `${isHome ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-[100] transition-all duration-500 ${
    isHome
      ? isScrolled
        ? 'bg-white/90 backdrop-blur-md shadow-sm text-black border-b border-gray-100 py-4'
        : 'bg-transparent text-white py-6'
      : 'bg-white text-black border-b border-gray-100 py-4 shadow-sm'
  }`;

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-6 md:px-10 flex justify-between items-center relative gap-8">
        <div className="flex gap-4 md:gap-8 items-center flex-shrink-0 text-black">
          <Link to="/">
            <img className="w-[70px] md:w-[85px] transition-all duration-300" src="images/logo3.png" alt="" />
          </Link>
          <div className="hidden md:flex gap-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] ml-4">
            <Link to="/" className="hover:opacity-60 transition-opacity whitespace-nowrap">Home</Link>
            <Link to="/collections/all" className="hover:opacity-60 transition-opacity whitespace-nowrap">Catalog</Link>
            <Link to="/contact" className="hover:opacity-60 transition-opacity whitespace-nowrap">Contact</Link>
            <Link to="/collections" className="hover:opacity-60 transition-opacity whitespace-nowrap">Shop</Link>
          </div>
        </div>

        <div className="flex-1 flex justify-end gap-4 md:gap-6 items-center text-black">
          <div
            ref={searchContainerRef}
            className="relative flex items-center h-10"
            onMouseLeave={() => {
              if (!isInputFocused && searchQuery === '') setIsSearchOpen(false);
            }}
          >
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="absolute right-0 flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100 shadow-sm text-black"
                >
                  <Search size={16} className="text-gray-400 mr-2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none focus:ring-0 text-xs font-bold w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hover:opacity-50 transition-opacity p-2"
              >
                <Search size={20} />
              </button>
            )}
          </div>

          <Link to="/profile" className="hidden md:block hover:opacity-50 transition-opacity">
            <User size={20} />
          </Link>

          <Link to="/wishlist" className="hidden md:block relative group cursor-pointer transition-transform active:scale-95">
            <Heart size={20} className="group-hover:text-red-500 transition-colors" />
            {wishlist.length > 0 && localStorage.getItem('customer') && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[0.6rem] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link to="/cart" className="hidden md:block relative group cursor-pointer transition-transform active:scale-95">
            <ShoppingBag size={20} className="group-hover:opacity-50 transition-opacity" />
            {cart.length > 0 && localStorage.getItem('customer') && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[0.6rem] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </Link>
        </div>

        <AnimatePresence>
          {shouldShowSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute top-full right-0 md:right-10 mt-3 w-[92vw] max-w-[420px] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[110] text-black"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Suggestions</p>
              </div>
              <div className="py-1">
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSuggestionClick(product)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                      {(product.thumbnailUrl || product.images?.[0]) && (
                        <img src={product.thumbnailUrl || product.images[0]} className="w-full h-full object-cover" alt="" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[0.78rem] font-semibold tracking-tight truncate">{product.name}</h4>
                      <p className="text-[0.72rem] text-gray-500 mt-0.5">Rs {product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
