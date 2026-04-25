import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const toCollectionSlug = (name = '') =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

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
    <div className="min-h-screen py-24 overflow-hidden relative italic-none"
      style={{ background: 'linear-gradient(135deg, #fdf7f0 0%, #fef9f4 50%, #fdf0e8 100%)' }}
    >
      {/* Logo Watermark motifs */}
      <img src="/images/mandala_motif.png" alt="" className="absolute left-[-5%] top-[20%] w-[400px] opacity-[0.07] pointer-events-none scale-x-[-1]" />
      <img src="/images/mandala_motif.png" alt="" className="absolute right-[-5%] top-[10%] w-[450px] opacity-[0.08] pointer-events-none" />

      <div className="container mx-auto px-10 relative z-10">
        <header className="text-center mb-24 space-y-4">
           <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-[#1a2d5a]">Collections</h1>
           <div className="flex items-center justify-center gap-4">
             <div className="h-[2px] w-20 bg-[#e87825]"></div>
             <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[8px]">Curated Capsules</p>
             <div className="h-[2px] w-20 bg-[#e87825]"></div>
           </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-40">
            <div className="w-12 h-12 border-t-2 border-[#1a2d5a] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-9xl mx-auto">
            <AnimatePresence>
              {collections.map((c) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={c.id}
                  onClick={() => navigate(`/collections/${toCollectionSlug(c.name)}`)}
                  className="group relative cursor-pointer block mx-4 md:mx-0"
                >
                  {/* Decorative Premium Corner Bracket */}
                  <div className="absolute -top-[34px] -right-[38px] z-30 w-[80px] h-[80px] pointer-events-none transition-transform duration-500 overflow-hidden">
                    <img src="/images/corner_bracket.png" alt="" className="w-full h-full object-contain" />
                  </div>

                  <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white">
                    <img src={c.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={c.name} />
                    <div className="absolute inset-0" />
                  </div>
                  
                  <div className="mt-8 text-center space-y-2">
                    <h2 className="text-lg font-black uppercase tracking-tight text-[#1a2d5a] group-hover:text-[#e87825] transition-colors">{c.name}</h2>
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#e87825]">Explore Collection</span>
                      <ArrowRight size={14} className="text-[#e87825]" />
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
