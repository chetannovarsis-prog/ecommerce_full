import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import ProductCard from '../../components/store/ProductCard';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

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
import { useStore } from '../../services/useStore';

const isUuid = (value = '') => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const formatCollectionTitle = (value = '') =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

// Module-level cache — survives re-renders, clears on page refresh
const _productsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const getCached = (key) => {
  const entry = _productsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _productsCache.delete(key); return null; }
  return entry.data;
};
const setCache = (key, data) => _productsCache.set(key, { data, ts: Date.now() });

const Products = () => {
  const { id: collectionId } = useParams();
  const { getCachedProducts, cacheProducts } = useStore();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewCols, setViewCols] = useState(4); // Default 4 cols
  const [sortBy, setSortBy] = useState('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const cacheKey = collectionId || 'all';
    const cached = getCached(cacheKey);

    const fetchData = async () => {
      // Check store cache first
      const storeCached = getCachedProducts();
      if (storeCached && !cached) {
        const allProducts = Array.isArray(storeCached)
          ? storeCached
          : Array.isArray(storeCached?.data)
          ? storeCached.data
          : [];
        // Filter for collection if needed
        let filtered = allProducts;
        if (collectionId && collectionId !== 'all') {
          filtered = allProducts.filter(p => p.collections?.some(c => c.id === collectionId));
        }
        setProducts(filtered);
        setFilteredProducts(filtered);
        setLoading(false);
        // Still refresh in background
        fetchFreshData();
        return;
      }

      // Show cached data instantly if available, still refresh in background
      if (!cached) setLoading(true);

      fetchFreshData();
    };

    const fetchFreshData = async () => {
      try {
        const [prodRes, collRes] = await Promise.allSettled([
          api.get('/products', {
            params: {
              limit: 100,
              ...(collectionId && collectionId !== 'all' ? { collectionId } : {})
            }
          }),
          collectionId && collectionId !== 'all' ? api.get(`/collections/${collectionId}`) : Promise.resolve({ data: null })
        ]);

        const prodData = prodRes.status === 'fulfilled' ? prodRes.value.data : [];
        const allProducts = Array.isArray(prodData)
          ? prodData
          : Array.isArray(prodData?.data)
          ? prodData.data
          : [];

        // Cache all products in store
        cacheProducts(allProducts);

        let filtered = allProducts;
        let collectionData = null;

        if (collectionId && collectionId !== 'all') {
          if (collRes.status === 'fulfilled') {
            collectionData = collRes.value.data;
          }

          if (!collectionData?.name) {
            const fallbackCollection = allProducts
              .flatMap((product) => product.collections || [])
              .find((item) => item?.id === collectionId);

            if (fallbackCollection) {
              collectionData = fallbackCollection;
              collectionData = fallbackCollection;
            }
          }
        }

        if (!collectionData?.name && collectionId && collectionId !== 'all' && !isUuid(collectionId)) {
          collectionData = { id: collectionId, name: formatCollectionTitle(collectionId) };
        }

        const result = {
          products: filtered,
          collection: collectionId && collectionId !== 'all' ? collectionData : null,
        };

        // Save to cache
        setCache(cacheKey, result);

        setCollection(result.collection);
        setProducts(result.products);
        setFilteredProducts(result.products);
      } catch (error) {
        console.error('Error fetching products/collection:', error);
        if (!cached) {
          setProducts([]);
          setFilteredProducts([]);
          setCollection(null);
        }
      } finally {
        setLoading(false);
      }
    };

    // Serve cache immediately
    if (cached) {
      setCollection(cached.collection);
      setProducts(cached.products);
      setFilteredProducts(cached.products);
      setLoading(false);
      // Still refresh in background (silent)
      fetchData();
    } else {
      fetchData();
    }
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
    if (viewCols === 3) return 'grid-cols-3 lg:grid-cols-3';
    if (viewCols === 4) return 'grid-cols-2 lg:grid-cols-4';
    if (viewCols === 5) return 'grid-cols-2 lg:grid-cols-5';
    if (viewCols === 6) return 'grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 lg:grid-cols-4';
  };

  const ViewIcon = ({ cols, active, onClick, className = "" }) => (
    <button 
      onClick={onClick}
      className={`p-1.5 rounded-sm transition-all ${active ? 'bg-black text-white' : 'text-gray-300 hover:text-black hover:bg-gray-100'} ${className}`}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="w-0.5 h-3 bg-current rounded-full" />
        ))}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen italic-none relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fdf7f0 0%, #fef9f4 50%, #fdf0e8 100%)' }}
    >
      {/* Brand Mandalas */}
      <img src="/images/mandala_motif.png" className="absolute -left-20 top-40 w-80 h-80 opacity-[0.05] pointer-events-none" alt="" />
      <img src="/images/mandala_motif.png" className="absolute -right-20 bottom-40 w-96 h-96 opacity-[0.05] pointer-events-none scale-x-[-1]" />

      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        onFilterChange={handleFilterChange}
      />

      <div className="max-w-[1400px] mx-auto px-10 py-10 relative z-10">
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
                 <ViewIcon cols={4} active={viewCols === 4} onClick={() => setViewCols(4)} className="hidden lg:block" />
                 <ViewIcon cols={5} active={viewCols === 5} onClick={() => setViewCols(5)} className="hidden lg:block" />
                 <ViewIcon cols={6} active={viewCols === 6} onClick={() => setViewCols(6)} className="hidden lg:block" />
              </div>

               <div ref={sortRef} className="relative group min-w-[240px] z-50">
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full flex items-center justify-between bg-white border border-gray-100 px-6 py-3.5 rounded-sm text-[0.65rem] font-black uppercase tracking-[2px] transition-all hover:border-black shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                       {sortBy === 'newest' && 'Newest First'}
                       {sortBy === 'price-low' && 'Price: Low to High'}
                       {sortBy === 'price-high' && 'Price: High to Low'}
                       {sortBy === 'name-az' && 'Alphabetically, A-Z'}
                       {sortBy === 'name-za' && 'Alphabetically, Z-A'}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isSortOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-sm shadow-2xl py-2 overflow-hidden"
                      >
                        {[
                          { val: 'newest', label: 'Newest First' },
                          { val: 'price-low', label: 'Price, low to high' },
                          { val: 'price-high', label: 'Price, high to low' },
                          { val: 'name-az', label: 'Alphabetically, A-Z' },
                          { val: 'name-za', label: 'Alphabetically, Z-A' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            onClick={() => { setSortBy(opt.val); setIsSortOpen(false); }}
                            className={`w-full text-left px-6 py-3 text-[0.7rem] font-bold transition-all relative group/item flex items-center ${sortBy === opt.val ? 'bg-gray-50 text-black' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}`}
                          >
                            {/* Hover/Active indicator bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-black transition-opacity ${sortBy === opt.val ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`} />
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
