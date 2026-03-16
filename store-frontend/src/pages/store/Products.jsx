import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../../components/store/ProductCard';
import FilterSidebar from '../../components/store/FilterSidebar';
import { 
  Filter, 
  Grid2X2, 
  Grid3X3, 
  LayoutGrid, 
  List, 
  ChevronDown,
  LayoutList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useParams } from 'react-router-dom';

const Products = () => {
  const { id: collectionId } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewCols, setViewCols] = useState(4); // Default 4 cols
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products and optionally collection info
        const [prodRes, collRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/products`),
          collectionId ? axios.get(`${import.meta.env.VITE_API_BASE_URL}/collections/${collectionId}`) : Promise.resolve({ data: null })
        ]);

        let allProducts = prodRes.data;
        if (collectionId) {
          allProducts = allProducts.filter(p => p.collectionId === collectionId || p.collections?.some(c => c.id === collectionId));
          setCollection(collRes.data);
        } else {
          setCollection(null);
        }

        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products/collection:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [collectionId]);

  const handleFilterChange = ({ categories, priceRange, availability }) => {
    let filtered = [...products];

    if (categories.length > 0) {
      filtered = filtered.filter(p => p.categories?.some(c => categories.includes(c.id)));
    }

    filtered = filtered.filter(p => {
      const price = p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (availability === 'in stock') {
      filtered = filtered.filter(p => (parseFloat(p.stock) || parseFloat(p.quantity) || 0) > 0);
    } else if (availability === 'out of stock') {
      filtered = filtered.filter(p => (parseFloat(p.stock) || parseFloat(p.quantity) || 0) === 0);
    }

    setFilteredProducts(filtered);
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'name-az') return a.name.localeCompare(b.name);
    if (sortBy === 'name-za') return b.name.localeCompare(a.name);
    return 0;
  });

  const getGridClass = () => {
    if (viewCols === 1) return 'grid-cols-1 md:grid-cols-1';
    if (viewCols === 2) return 'grid-cols-2 md:grid-cols-2';
    if (viewCols === 3) return 'grid-cols-2 lg:grid-cols-3';
    if (viewCols === 4) return 'grid-cols-2 lg:grid-cols-4';
    if (viewCols === 5) return 'grid-cols-2 lg:grid-cols-5';
    if (viewCols === 6) return 'grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 lg:grid-cols-4';
  };

  const ViewIcon = ({ cols, active, onClick }) => (
    <button 
      onClick={onClick}
      className={`p-1.5 rounded-sm transition-all ${active ? 'bg-black text-white' : 'text-gray-300 hover:text-black hover:bg-gray-100'}`}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="w-0.5 h-3 bg-current rounded-full" />
        ))}
      </div>
    </button>
  );

  return (
    <div className="bg-white min-h-screen italic-none">
      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        onFilterChange={handleFilterChange}
      />

      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <header className="flex flex-col gap-10 mb-20">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-3 px-6 py-3 border border-gray-100 rounded-sm text-[0.65rem] font-black uppercase tracking-[2px] hover:border-black transition-all group"
              >
                <Filter size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Filter
              </button>

              {/* View Switcher */}
              <div className="flex items-center gap-4 bg-gray-50/50 p-1.5 rounded-md border border-gray-100">
                 <button 
                    onClick={() => setViewCols(1)}
                    className={`p-1.5 rounded-sm transition-all ${viewCols === 1 ? 'bg-black text-white shadow-xl' : 'text-gray-300 hover:text-black'}`}
                  >
                   <List size={16} />
                 </button>
                 <ViewIcon cols={2} active={viewCols === 2} onClick={() => setViewCols(2)} />
                 <ViewIcon cols={3} active={viewCols === 3} onClick={() => setViewCols(3)} />
                 <ViewIcon cols={4} active={viewCols === 4} onClick={() => setViewCols(4)} />
                 <ViewIcon cols={5} active={viewCols === 5} onClick={() => setViewCols(5)} />
                 <ViewIcon cols={6} active={viewCols === 6} onClick={() => setViewCols(6)} />
              </div>

               <div className="relative group min-w-[200px]">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 px-6 py-3.5 pr-12 rounded-xl text-[0.7rem] font-black uppercase tracking-[1px] focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 cursor-pointer transition-all shadow-sm hover:border-gray-300"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                   <option value="name-az">A - Z</option>
                   <option value="name-za">Z - A</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
                    <ChevronDown size={16} />
                  </div>
               </div>
           </div>

           <div className="text-center space-y-4">
               <h1 className="text-5xl font-black uppercase tracking-tight">
                 {collection ? collection.name : 'Products'}
               </h1>
               <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-[4px]">
                 {collection ? `Showing pieces from ${collection.name}` : `Showing ${sortedProducts.length} unique pieces`}
               </p>
           </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-40">
            <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin"></div>
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className={`grid gap-x-8 gap-y-16 transition-all duration-500 ${getGridClass()}`}>
            <AnimatePresence mode="popLayout">
              {sortedProducts.map((product) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={product.id}
                >
                  <ProductCard product={product} isListView={viewCols === 1} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-gray-100 rounded-sm">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No products match your current filters</p>
            <button 
              onClick={() => handleFilterChange({ categories: [], priceRange: [0, 10000], availability: 'all' })}
              className="mt-8 text-[0.65rem] font-black uppercase tracking-widest underline underline-offset-8"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
