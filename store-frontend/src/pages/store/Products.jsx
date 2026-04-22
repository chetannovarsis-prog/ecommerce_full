import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import ProductCard from '../../components/store/ProductCard';
import { useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import FilterSidebar from '../../components/store/FilterSidebar';
import { Filter, List, ChevronDown } from 'lucide-react';
import { useStore } from '../../services/useStore';
import { ProductSkeleton } from '../../components/store/Skeleton';

// ─── Helpers ────────────────────────────────────────────────────────────────
const isUuid = (value = '') =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const formatCollectionTitle = (value = '') =>
  value
    .split('-')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

// ─── Module-level cache (survives re-renders, clears on refresh) ─────────────
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const getCached = (key) => {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data;
};
const setCache = (key, data) => _cache.set(key, { data, ts: Date.now() });

// ─── Sort options (stable reference, no re-creation) ────────────────────────
const SORT_OPTIONS = [
  { val: 'newest',     label: 'Newest First' },
  { val: 'price-low',  label: 'Price, low to high' },
  { val: 'price-high', label: 'Price, high to low' },
  { val: 'name-az',    label: 'Alphabetically, A–Z' },
  { val: 'name-za',    label: 'Alphabetically, Z–A' },
];

const SORT_LABELS = Object.fromEntries(SORT_OPTIONS.map(o => [o.val, o.label]));

// ─── View-column grid classes ────────────────────────────────────────────────
const GRID_CLASSES = {
  1: 'grid-cols-1 md:grid-cols-1',
  2: 'grid-cols-2 md:grid-cols-2',
  3: 'grid-cols-3 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-3 lg:grid-cols-6',
};

// ─── Sub-components (defined outside to avoid re-creation on each render) ───
const ViewIcon = ({ cols, active, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-sm transition-all ${
      active ? 'bg-black text-white' : 'text-gray-300 hover:text-black hover:bg-gray-100'
    } ${className}`}
    aria-label={`${cols} column view`}
  >
    <div className="flex gap-0.5">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="w-0.5 h-3 bg-current rounded-full" />
      ))}
    </div>
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const Products = () => {
  const { id: collectionId } = useParams();
  // Persist sort + cols in URL so users can share/bookmark filtered views
  const [searchParams, setSearchParams] = useSearchParams();

  const { getCachedProducts, cacheProducts } = useStore();

  const [products, setProducts]               = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [collection, setCollection]           = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [isFilterOpen, setIsFilterOpen]       = useState(false);
  const [isSortOpen, setIsSortOpen]           = useState(false);

  // Read initial state from URL params — falls back to defaults
  const [viewCols, setViewCols] = useState(() => Number(searchParams.get('cols')) || 4);
  const [sortBy,   setSortBy]   = useState(() => searchParams.get('sort') || 'newest');

  const sortRef = useRef(null);

  // ── Sync cols + sort to URL ──────────────────────────────────────────────
  useEffect(() => {
    setSearchParams(
      (prev) => {
        prev.set('sort', sortBy);
        prev.set('cols', viewCols);
        return prev;
      },
      { replace: true }
    );
  }, [sortBy, viewCols]);

  // ── Close sort dropdown on outside click ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    const cacheKey = collectionId || 'all';
    let cancelled = false; // prevent state updates after unmount / route change

    const applyResult = (result) => {
      if (cancelled) return;
      setCollection(result.collection);
      setProducts(result.products);
      setFilteredProducts(result.products);
      setLoading(false);
    };

    const fetchFresh = async () => {
      try {
        const [prodRes, collRes] = await Promise.allSettled([
          api.get('/products', {
            params: {
              limit: 100,
              ...(collectionId && collectionId !== 'all' ? { collectionId } : {}),
            },
          }),
          collectionId && collectionId !== 'all'
            ? api.get(`/collections/${collectionId}`)
            : Promise.resolve({ data: null }),
        ]);

        const rawProducts = prodRes.status === 'fulfilled' ? prodRes.value.data : [];
        const allProducts = Array.isArray(rawProducts)
          ? rawProducts
          : Array.isArray(rawProducts?.data)
          ? rawProducts.data
          : [];

        cacheProducts(allProducts);

        let collectionData = collRes.status === 'fulfilled' ? collRes.value.data : null;

        // Fallback: derive collection from embedded product data
        if (!collectionData?.name && collectionId && collectionId !== 'all') {
          collectionData =
            allProducts
              .flatMap((p) => p.collections || [])
              .find((c) => c?.id === collectionId) || null;
        }

        // Fallback: humanize slug
        if (!collectionData?.name && collectionId && collectionId !== 'all' && !isUuid(collectionId)) {
          collectionData = { id: collectionId, name: formatCollectionTitle(collectionId) };
        }

        const result = {
          products: allProducts,
          collection: collectionId && collectionId !== 'all' ? collectionData : null,
        };

        setCache(cacheKey, result);
        applyResult(result);
      } catch (err) {
        console.error('Error fetching products/collection:', err);
        if (!cancelled) setLoading(false);
      }
    };

    const cached = getCached(cacheKey);
    if (cached) {
      // Serve stale-while-revalidate: show cache instantly, refresh silently
      applyResult(cached);
      fetchFresh(); // background refresh — no loading spinner
    } else {
      // Try store cache for instant first paint
      const storeCached = getCachedProducts?.();
      if (storeCached) {
        const storeProducts = Array.isArray(storeCached)
          ? storeCached
          : Array.isArray(storeCached?.data)
          ? storeCached.data
          : [];
        if (!cancelled) {
          setProducts(storeProducts);
          setFilteredProducts(storeProducts);
          setLoading(false);
        }
      }
      fetchFresh();
    }

    return () => { cancelled = true; };
  }, [collectionId]);

  // ── Filter handler (stable reference) ───────────────────────────────────
  const handleFilterChange = useCallback(
    ({ categories, priceRange, availability }) => {
      let result = [...products];

      if (categories.length > 0) {
        result = result.filter((p) => p.categories?.some((c) => categories.includes(c.id)));
      }

      result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

      if (availability === 'in stock') {
        result = result.filter((p) => (parseFloat(p.stock) || parseFloat(p.quantity) || 0) > 0);
      } else if (availability === 'out of stock') {
        result = result.filter((p) => (parseFloat(p.stock) || parseFloat(p.quantity) || 0) === 0);
      }

      setFilteredProducts(result);
    },
    [products]
  );

  // ── Sorting (memoized — only recalculates when deps change) ─────────────
  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    switch (sortBy) {
      case 'price-low':  return arr.sort((a, b) => a.price - b.price);
      case 'price-high': return arr.sort((a, b) => b.price - a.price);
      case 'newest':     return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'name-az':    return arr.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-za':    return arr.sort((a, b) => b.name.localeCompare(a.name));
      default:           return arr;
    }
  }, [filteredProducts, sortBy]);

  const gridClass = GRID_CLASSES[viewCols] || GRID_CLASSES[4];
  const skeletonCount = viewCols === 1 ? 4 : 8;

  return (
    <div
      className="min-h-screen italic-none relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fdf7f0 0%, #fef9f4 50%, #fdf0e8 100%)' }}
    >
      {/* Brand Mandalas */}
      <img
        src="/images/mandala_motif.png"
        className="absolute -left-20 top-40 w-80 h-80 opacity-[0.05] pointer-events-none select-none"
        alt=""
        aria-hidden="true"
        loading="lazy"
      />
      <img
        src="/images/mandala_motif.png"
        className="absolute -right-20 bottom-40 w-96 h-96 opacity-[0.05] pointer-events-none select-none scale-x-[-1]"
        aria-hidden="true"
        loading="lazy"
      />

      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onFilterChange={handleFilterChange}
      />

      <div className="max-w-[1400px] mx-auto px-10 py-10 relative z-10">
        {/* ── Header ── */}
        <header className="flex flex-col gap-10 mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Filter button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-3 px-6 py-3 border border-gray-100 rounded-sm text-[0.65rem] font-black uppercase tracking-[2px] hover:border-black transition-all group"
            >
              <Filter size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Filter
            </button>

            {/* View switcher */}
            <div className="flex items-center gap-4 bg-gray-50/50 p-1.5 rounded-md border border-gray-100">
              <button
                onClick={() => setViewCols(1)}
                className={`p-1.5 rounded-sm transition-all ${
                  viewCols === 1 ? 'bg-black text-white shadow-xl' : 'text-gray-300 hover:text-black'
                }`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
              {[2, 3, 4, 5, 6].map((n) => (
                <ViewIcon
                  key={n}
                  cols={n}
                  active={viewCols === n}
                  onClick={() => setViewCols(n)}
                  className={n >= 4 ? 'hidden lg:block' : ''}
                />
              ))}
            </div>

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative min-w-[240px] z-50">
              <button
                onClick={() => setIsSortOpen((v) => !v)}
                className="w-full flex items-center justify-between bg-white border border-gray-100 px-6 py-3.5 rounded-sm text-[0.65rem] font-black uppercase tracking-[2px] transition-all hover:border-black shadow-sm"
              >
                <span>{SORT_LABELS[sortBy]}</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-sm shadow-2xl py-2 overflow-hidden"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => { setSortBy(opt.val); setIsSortOpen(false); }}
                        className={`w-full text-left px-6 py-3 text-[0.7rem] font-bold transition-all relative group/item flex items-center ${
                          sortBy === opt.val
                            ? 'bg-gray-50 text-black'
                            : 'text-gray-400 hover:bg-gray-50 hover:text-black'
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 bg-black transition-opacity ${
                            sortBy === opt.val ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
                          }`}
                        />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="md:text-5xl text-3xl font-black uppercase tracking-tight">
              {collection ? collection.name : 'Products'}
            </h1>
            <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-[4px]">
              {collection
                ? `Showing pieces from ${collection.name}`
                : `Showing ${sortedProducts.length} unique pieces`}
            </p>
          </div>
        </header>

        {/* ── Product Grid ── */}
        {loading ? (
          <div className={`grid gap-x-8 gap-y-16 ${gridClass}`}>
            {Array.from({ length: skeletonCount }).map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className={`grid gap-x-8 gap-y-16 transition-all duration-500 ${gridClass}`}>
            <AnimatePresence mode="popLayout">
              {sortedProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <ProductCard product={product} isListView={viewCols === 1} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-gray-100 rounded-sm">
            <p className="text-gray-400 font-bold uppercase tracking-widest">
              No products match your current filters
            </p>
            <button
              onClick={() =>
                handleFilterChange({ categories: [], priceRange: [0, 10000], availability: 'all' })
              }
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