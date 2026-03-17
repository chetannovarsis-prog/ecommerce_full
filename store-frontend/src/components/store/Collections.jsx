import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await api.get('/collections');
        setCollections(response.data);


      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  if (loading || collections.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-10 my-20 italic-none">
      <h2 className="text-center text-3xl font-black mb-16 uppercase tracking-tight">Shop by Collections</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {collections.map((c) => (
          <div 
            key={c.id} 
            onClick={() => navigate(`/collections/${c.id}`)}
            className="relative h-[480px] overflow-hidden cursor-pointer group rounded-sm"
          >
            <img 
              src={c.img || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'} 
              alt={c.name} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <span className="text-white text-[0.6rem] font-black uppercase tracking-[4px] mb-2">{c.products.length} Products</span>
               <h3 className="text-white text-xl font-black uppercase tracking-tight mb-6">{c.name}</h3>
               <button className="bg-white text-black px-8 py-3 font-black text-[0.65rem] uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-300">
                 Explore
               </button>
            </div>
            {/* Static title for non-hover */}
            <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
               <h3 className="text-white text-2xl font-black uppercase tracking-tighter drop-shadow-2xl">{c.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Collections;
