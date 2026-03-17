import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';


const FilterSidebar = ({ isOpen, onClose, onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [availability, setAvailability] = useState('all');
  const [openSections, setOpenSections] = useState({
    categories: true,
    availability: true,
    price: true
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);

      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      const next = prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId];
      onFilterChange({ categories: next, priceRange, availability });
      return next;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-[320px] bg-white z-[160] shadow-2xl overflow-y-auto italic-none"
          >
            <div className="p-8 space-y-12">
              <header className="flex justify-between items-center pb-6 border-b border-gray-100">
                <h2 className="text-xl font-black uppercase tracking-tight">Filters</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </header>

              {/* Categories */}
              <div className="space-y-6">
                <button 
                  onClick={() => toggleSection('categories')}
                  className="w-full flex justify-between items-center text-[0.7rem] font-black uppercase tracking-[2px]"
                >
                  Product Categories
                  {openSections.categories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {openSections.categories && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3 pl-1"
                    >
                      {categories.map(cat => (
                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                          <div 
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`w-4 h-4 border-2 rounded-sm transition-all flex items-center justify-center ${selectedCategories.includes(cat.id) ? 'border-black bg-black text-white' : 'border-gray-200 group-hover:border-black'}`}
                          >
                            {selectedCategories.includes(cat.id) && <Check size={10} strokeWidth={4} />}
                          </div>
                          <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${selectedCategories.includes(cat.id) ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>{cat.name}</span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Availability */}
              <div className="space-y-6">
                <button 
                  onClick={() => toggleSection('availability')}
                  className="w-full flex justify-between items-center text-[0.7rem] font-black uppercase tracking-[2px]"
                >
                  Availability
                  {openSections.availability ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {openSections.availability && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3"
                    >
                      {['All', 'In Stock', 'Out of Stock'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="availability" 
                            className="hidden" 
                            onChange={() => {
                              setAvailability(opt.toLowerCase());
                              onFilterChange({ categories: selectedCategories, priceRange, availability: opt.toLowerCase() });
                            }}
                          />
                          <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${availability === opt.toLowerCase() ? 'border-black bg-black' : 'border-gray-200 group-hover:border-black'}`}>
                            {availability === opt.toLowerCase() && <div className="w-1 h-1 bg-white rounded-full" />}
                          </div>
                          <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${availability === opt.toLowerCase() ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>{opt}</span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Range */}
              <div className="space-y-6">
                <button 
                  onClick={() => toggleSection('price')}
                  className="w-full flex justify-between items-center text-[0.7rem] font-black uppercase tracking-[2px]"
                >
                  Price
                  {openSections.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {openSections.price && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-6 px-1"
                    >
                      <input 
                        type="range" 
                        min="0" 
                        max="10000" 
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setPriceRange([0, val]);
                          onFilterChange({ categories: selectedCategories, priceRange: [0, val], availability });
                        }}
                        className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between items-center">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded text-[0.6rem] font-black">₹0</div>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded text-[0.6rem] font-black">₹{priceRange[1]}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-10 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setSelectedCategories([]);
                    setPriceRange([0, 10000]);
                    setAvailability('all');
                    onFilterChange({ categories: [], priceRange: [0, 10000], availability: 'all' });
                  }}
                  className="w-full py-4 text-[0.6rem] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterSidebar;
