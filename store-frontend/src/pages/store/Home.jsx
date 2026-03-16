import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, Star, MapPin, Phone, Instagram, Facebook } from 'lucide-react';
import Hero from '../../components/store/Hero';
import Testimonials from '../../components/store/Testimonials';
import Benefits from '../../components/store/Benefits';

const Home = () => {
  const [collections, setCollections] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collRes, prodRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/collections`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/products?limit=8`)
        ]);
        setCollections(collRes.data.filter(c => c.imageUrl).slice(0, 4));
        setFeaturedProducts(prodRes.data.slice(0, 8));
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white font-['Albert_Sans']">
      <Hero />
      
      {/* SHOP BY COLLECTIONS */}
      <section className="py-24 container mx-auto px-10">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Shop By Collections</h2>
            <div className="w-20 h-1 bg-black mt-2"></div>
          </div>
          <Link to="/collections" className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-70 transition-opacity">View All</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {collections.map((collection) => (
            <Link 
              key={collection.id} 
              to={`/collections/${collection.id}`}
              className="group relative h-[450px] overflow-hidden rounded-2xl bg-gray-100"
            >
              <img 
                src={collection.imageUrl} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                alt={collection.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-10 left-0 right-0 p-6 text-center">
                 <div className="inline-block bg-white text-black px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl">
                    {collection.name}
                 </div>
              </div>
            </Link>
          ))}
          {/* Fallback if no collections with images */}
          {collections.length === 0 && Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-[450px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-10 text-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-gray-300">
                 <ImageIcon size={24} />
               </div>
               <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-gray-400 leading-tight">Admin: Add collection image to show here</p>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals / Featured Products */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">Latest Drops</h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fresh styles just landed in our store</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featuredProducts.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group space-y-4">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-white relative">
                  <img 
                    src={product.thumbnailUrl || product.images?.[0]} 
                    className={`w-full h-full object-cover transition-all duration-700 ${product.hoverThumbnailUrl || product.images?.[1] ? 'absolute inset-0 group-hover:opacity-0' : 'group-hover:scale-105'}`} 
                    alt={product.name} 
                  />
                  {(product.hoverThumbnailUrl || product.images?.[1]) && (
                    <img 
                      src={product.hoverThumbnailUrl || product.images?.[1]} 
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
                      alt={`${product.name} hover`} 
                    />
                  )}
                  {product.isDiscountable && (
                    <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest shadow-lg">Sale</div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>
                </div>
                <div>
                  <h4 className="text-[0.7rem] font-black uppercase tracking-tight text-gray-900">{product.name}</h4>
                  <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">{product.subtitle || 'Essential Piece'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-black">₹{product.price}</span>
                    {product.isDiscountable && <span className="text-[0.65rem] text-gray-300 line-through">₹{product.price + (product.discountPrice || 0)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-20">
            <Link to="/collections/all" className="inline-flex items-center gap-3 bg-white text-black border border-black px-12 py-4 rounded-full text-[0.65rem] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl active:scale-95">
              Shop All Products <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Shop The Style - Lookbook Grid */}
      <section className="py-24">
        <div className="container mx-auto px-10">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic italic">Shop The Style</h2>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Curated looks for every occasion</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[600px]">
              <div className="lg:col-span-1 h-full rounded-2xl overflow-hidden shadow-2xl transform rotate-1">
                 <img src="https://images.unsplash.com/photo-1539109132374-3484594a2829?q=80&w=1920&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="" />
              </div>
              <div className="lg:col-span-1 mt-12 h-full rounded-2xl overflow-hidden shadow-2xl transform -rotate-1">
                 <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="" />
              </div>
              <div className="lg:col-span-1 h-full rounded-2xl overflow-hidden shadow-2xl transform rotate-2">
                 <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="" />
              </div>
              <div className="lg:col-span-1 mt-12 h-full rounded-2xl overflow-hidden shadow-2xl transform -rotate-2">
                 <img src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1920&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="" />
              </div>
           </div>
        </div>
      </section>

      {/* Testimonials - Happy Clients */}
      <Testimonials />

      {/* Benefits Section */}
      <Benefits />

      {/* Love Section - Banner */}
      <section className="py-24 relative overflow-hidden flex items-center justify-center">
         <img src="/images/love.png" className="w-full h-full object-cover" alt="" />
         {/* <div className="absolute inset-0 bg-black/40"></div> */}
         {/* <div className="relative z-10 text-center">
            <h2 className="text-[12rem] font-black text-white leading-none tracking-tighter mix-blend-overlay">LOVE</h2>
            <p className="text-xs font-black text-white/80 uppercase tracking-[1em] mt-[-2rem]">In Every Thread</p>
         </div> */}
      </section>

      {/* Store Section - Indore Store */}
      <section className="py-24 container mx-auto px-10">
         <div className="bg-gray-50 rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl ring-1 ring-black/5">
            <div className="flex-1 p-16 flex flex-col justify-center">
               <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic italic">Our First Store in Indore</h2>
               <p className="text-sm text-gray-600 leading-relaxed max-w-md mb-10">
                  Experience our collection in person. Visit our standalone store in the heart of Indore for a personalized styling session and exclusive in-store designs.
               </p>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-4 group">
                     <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all shadow-lg">
                        <MapPin size={18} />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-tight">C-21 Mall, AB Road, Indore</span>
                  </div>
                  <div className="flex items-center gap-4 group">
                     <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all shadow-lg">
                        <Phone size={18} />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-tight">+91 98765 43210</span>
                  </div>
               </div>

               <div className="mt-12 flex gap-4">
                  <Link to="/contact" className="bg-black text-white px-8 py-4 rounded-full text-[0.65rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Get Directions</Link>
                  <div className="flex gap-2">
                     <a href="#" className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"><Instagram size={18} /></a>
                     <a href="#" className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"><Facebook size={18} /></a>
                  </div>
               </div>
            </div>
            <div className="flex-1 h-[500px] lg:h-auto overflow-hidden">
               <img src="https://images.unsplash.com/photo-1441996632159-fd207905d992?q=80&w=1920&auto=format&fit=crop" className="w-full h-full object-cover" alt="Indore Store" />
            </div>
         </div>
      </section>

      

    </div>
  );
};

// Help helper icon component (placeholder)
const ImageIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default Home;
