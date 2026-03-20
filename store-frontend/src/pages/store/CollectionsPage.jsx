import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await api.get('/collections');
        const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setCollections(list.sort((a, b) => (a.order || 0) - (b.order || 0)));

      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  return (
    <div className="bg-white min-h-screen py-20 italic-none">
      <div className="container mx-auto px-10">
        <header className="text-center mb-20 space-y-4">
           <h1 className="text-6xl font-black uppercase tracking-tighter">Collections</h1>
           <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-[6px]">Discover our curated capsules</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-40">
            <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {collections.map((c, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={c.id}
                  onClick={() => navigate(`/collections/${c.id}`)}
                  className="group relative h-[500px] overflow-hidden rounded-2xl cursor-pointer bg-gray-50"
                >
                  <img src={c.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={c.name} />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
                  <div className="absolute bottom-10 left-0 right-0 p-6 flex justify-center">
                     <div className="bg-white text-black px-10 py-3 rounded-[0.5rem] shadow-2xl transform group-hover:translate-y-[-10px] transition-transform duration-500">
                        <h2 className="text-sm font-black uppercase tracking-widest">{c.name}</h2>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;
