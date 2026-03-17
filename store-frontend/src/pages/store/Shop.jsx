import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import ProductCard from '../../components/store/ProductCard';

import FilterSidebar from '../../components/store/FilterSidebar';
import { Filter, ChevronDown, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);

        setFilteredProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFilterChange = ({ categories, priceRange, availability }) => {
    let filtered = [...products];
    if (categories.length > 0) filtered = filtered.filter(p => p.categories?.some(c => categories.includes(c.id)));
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (availability === 'in stock') filtered = filtered.filter(p => (parseFloat(p.stock) || parseFloat(p.quantity) || 0) > 0);
    else if (availability === 'out of stock') filtered = filtered.filter(p => (parseFloat(p.stock) || parseFloat(p.quantity) || 0) === 0);
    setFilteredProducts(filtered);
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name-az') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="bg-white min-h-screen py-20 italic-none">
      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        onFilterChange={handleFilterChange}
      />
      <div className="max-w-[1400px] mx-auto px-10">
        <header className="flex flex-col md:flex-row justify-between items-center gap-10 mb-20">
           <div>
              <h1 className="text-6xl font-black uppercase tracking-tighter">Shop All</h1>
              <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-[4px] mt-2">Browse our complete collection of handcrafted pieces.</p>
           </div>
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-3 px-8 py-3.5 border border-black rounded-full text-[0.65rem] font-black uppercase tracking-[2px] hover:bg-black hover:text-white transition-all"
              >
                <Filter size={14} /> Filter
              </button>
               <div className="relative group min-w-[200px]">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 px-6 py-3.5 pr-12 rounded-xl text-[0.7rem] font-black uppercase tracking-[1px] focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 cursor-pointer transition-all shadow-sm hover:border-gray-300"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low-High</option>
                    <option value="price-high">Price: High-Low</option>
                    <option value="name-az">A - Z</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                    <ChevronDown size={16} />
                  </div>
               </div>
           </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-40">
            <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            <AnimatePresence>
              {sortedProducts.map((product) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={product.id}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
