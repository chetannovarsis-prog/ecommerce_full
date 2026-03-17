import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import ProductCard from '../../components/store/ProductCard';

import { motion, AnimatePresence } from 'framer-motion';

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await api.get('/products');
        // Sort by id descending (assuming newer IDs are higher) or createdAt if available

        const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProducts(sorted.slice(0, 12)); // Show first 12
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
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
          <div className="flex justify-center py-40">
            <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin"></div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default NewArrivals;
