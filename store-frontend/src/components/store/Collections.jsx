import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

// Lotus SVG motif matching the logo's orange/saffron lotus
const LotusMotif = ({ size = 16, color = '#e87825' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C10.5 5.5 9 8 9 10.5C9 12.5 10.3 14.2 12 14.8C13.7 14.2 15 12.5 15 10.5C15 8 13.5 5.5 12 3Z"/>
    <path d="M6.5 7C5.5 9 5 11 5.5 13C6 14.8 7.5 16 9.2 16.2C10.2 15 10.8 13.5 10.5 12C10.2 10 8.8 8 6.5 7Z"/>
    <path d="M17.5 7C15.2 8 13.8 10 13.5 12C13.2 13.5 13.8 15 14.8 16.2C16.5 16 18 14.8 18.5 13C19 11 18.5 9 17.5 7Z"/>
    <path d="M3.5 12C3 14.5 3.5 17 5 18.5C6.5 20 8.5 20.5 10.2 19.8C10.8 18.5 10.8 16.8 9.8 15.5C8.5 14 6 13 3.5 12Z"/>
    <path d="M20.5 12C18 13 15.5 14 14.2 15.5C13.2 16.8 13.2 18.5 13.8 19.8C15.5 20.5 17.5 20 19 18.5C20.5 17 21 14.5 20.5 12Z"/>
    <ellipse cx="12" cy="18" rx="3" ry="2" opacity="0.6"/>
  </svg>
);

const Collections = () => {
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

  if (loading) return null;

  if (!collections || collections.length === 0) {
    return (
      <section className="max-w-[1400px] mx-auto px-10 my-20 italic-none">
        <h2 className="text-center text-3xl font-black mb-16 uppercase tracking-tight">Shop by Collections</h2>
        <div className="text-center text-gray-500 font-bold">No collections available yet.</div>
      </section>
    );
  }

  return (
    // <section className="max-w-[1400px] mx-auto px-10 my-20 italic-none">
    //   <h2 className="text-center text-3xl font-black mb-16 uppercase tracking-tight">Shop by Collections</h2>

    //   {/* ── OPTION A · Colored Font Text (logo navy + orange) ── */}
    //   <div className="mb-2">
    //     <p className="text-[0.55rem] font-black uppercase tracking-[4px] text-center mb-6" style={{ color: '#e87825' }}>
    //       ✦ Option A — Accent Colors Matching Logo ✦
    //     </p>
    //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    //       {collections.map((c) => (
    //         <div
    //           key={`a-${c.id}`}
    //           onClick={() => navigate(`/collections/${c.id}`)}
    //           className="relative overflow-hidden cursor-pointer group rounded-sm"
    //         >
    //           {/* Corner bracket decorations */}
    //           <span className="absolute top-2 left-2 z-30 w-5 h-5 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: '#e87825' }} />
    //           <span className="absolute top-2 right-2 z-30 w-5 h-5 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: '#e87825' }} />
    //           <span className="absolute bottom-14 left-2 z-30 w-5 h-5 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: '#e87825' }} />
    //           <span className="absolute bottom-14 right-2 z-30 w-5 h-5 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: '#e87825' }} />

    //           {/* Image */}
    //           <div className="h-[360px] overflow-hidden">
    //             <img
    //               src={c.imageUrl || c.img || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'}
    //               alt={c.name}
    //               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
    //             />
    //           </div>

    //           {/* Text block — Option A: colored fonts, no bg */}
    //           <div className="pt-3 pb-1 px-1">
    //             <h3
    //               className="text-sm font-black uppercase tracking-widest"
    //               style={{ color: '#1a2d5a' }}
    //             >
    //               {c.name}
    //             </h3>
    //             <div className="flex items-center gap-1 mt-1">
    //               <span
    //                 className="text-[0.6rem] font-black uppercase tracking-[3px]"
    //                 style={{ color: '#e87825' }}
    //               >
    //                 View All
    //               </span>
    //               <LotusMotif size={13} color="#e87825" />
    //             </div>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //   </div>

    //   {/* Divider between options */}
    //   <div className="my-16 flex items-center gap-4">
    //     <div className="flex-1 h-px bg-gray-100" />
    //     <LotusMotif size={20} color="#e87825" />
    //     <span className="text-[0.55rem] font-black uppercase tracking-[4px] text-gray-300">vs</span>
    //     <LotusMotif size={20} color="#1a2d5a" />
    //     <div className="flex-1 h-px bg-gray-100" />
    //   </div>

    //   {/* ── OPTION B · Logo Watermark Background ── */}
    //   <div>
    //     <p className="text-[0.55rem] font-black uppercase tracking-[4px] text-center mb-6" style={{ color: '#1a2d5a' }}>
    //       ✦ Option B — Logo Watermark in Background ✦
    //     </p>
    //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    //       {collections.map((c) => (
    //         <div
    //           key={`b-${c.id}`}
    //           onClick={() => navigate(`/collections/${c.id}`)}
    //           className="relative overflow-hidden cursor-pointer group rounded-sm"
    //         >
    //           {/* Image */}
    //           <div className="h-[360px] overflow-hidden">
    //             <img
    //               src={c.imageUrl || c.img || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'}
    //               alt={c.name}
    //               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
    //             />
    //           </div>

    //           {/* Text block — Option B: logo watermark background */}
    //           <div
    //             className="pt-3 pb-1 px-1 relative overflow-hidden"
    //             style={{ backgroundColor: '#faf9f7' }}
    //           >
    //             {/* Logo watermark */}
    //             <img
    //               src="/images/logo3.png"
    //               alt=""
    //               aria-hidden="true"
    //               className="absolute right-0 bottom-0 w-16 h-16 object-contain pointer-events-none"
    //               style={{ opacity: 0.08 }}
    //             />
    //             <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 relative z-10">
    //               {c.name}
    //             </h3>
    //             <div className="flex items-center gap-1 mt-1 relative z-10">
    //               <span className="text-[0.6rem] font-black uppercase tracking-[3px] text-gray-500">
    //                 View All
    //               </span>
    //               <LotusMotif size={13} color="#e87825" />
    //             </div>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //   </div>
    // </section>
    <></>
  );
};

export default Collections;
