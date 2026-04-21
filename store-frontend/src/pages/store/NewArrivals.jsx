import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import ProductCard from '../../components/store/ProductCard';
import { ProductSkeleton } from '../../components/store/Skeleton';

import { motion, AnimatePresence } from 'framer-motion';

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await api.get('/products/new-arrivals');
        let productsData = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        // Fallback: if new-arrivals endpoint returns empty, fetch all products
        if (productsData.length === 0) {
          const allRes = await api.get('/products');
          const allData = Array.isArray(allRes.data)
            ? allRes.data
            : Array.isArray(allRes.data?.data)
            ? allRes.data.data
            : [];
          productsData = allData;
        }

        const sorted = [...productsData].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setProducts(sorted.slice(0, 12));
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
        // Try fallback on error too
        try {
          const allRes = await api.get('/products');
          const allData = Array.isArray(allRes.data)
            ? allRes.data
            : Array.isArray(allRes.data?.data)
            ? allRes.data.data
            : [];
          const sorted = [...allData].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setProducts(sorted.slice(0, 12));
        } catch (e2) {
          console.error('Fallback also failed:', e2);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  return (
    <div className="bg-white min-h-screen py-20 italic-none">
      <div className="max-w-[1400px] mx-auto px-10">
        <header className="text-center mb-20 space-y-4">
           <h1 className="text-6xl font-black uppercase tracking-tighter">New Arrivals</h1>
           <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-[6px]">The latest drops, curated for the modern wardrobe.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={product.id}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-gray-100 rounded-sm">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No new arrivals available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewArrivals;
