import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { ChevronRight, Star, MapPin, Phone, Instagram, Facebook } from 'lucide-react';
import Hero from '../../components/store/Hero';
import Testimonials from '../../components/store/Testimonials';
import Benefits from '../../components/store/Benefits';
import ShoppableVideo from '../../components/store/ShoppableVideo';
import { ProductSkeleton, CircularCollectionSkeleton } from '../../components/store/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const [collections, setCollections] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [activeTab, setActiveTab] = useState('best-sellers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collRes, bestRes, newRes] = await Promise.allSettled([
          api.get('/collections'),
          api.get('/products/best-sellers'),
          api.get('/products/new-arrivals')
        ]);

        if (collRes.status === 'fulfilled') {
          const collectionsData = Array.isArray(collRes.value.data)
            ? collRes.value.data
            : collRes.value.data?.data || [];
          setCollections(collectionsData.sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
        if (bestRes.status === 'fulfilled') {
          setBestSellers(bestRes.value.data);
        }
        if (newRes.status === 'fulfilled') {
          setNewArrivals(newRes.value.data);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayProducts = activeTab === 'best-sellers' ? bestSellers : newArrivals;

  return (
    <div className="bg-white font-['Albert_Sans']">
      <Hero />

      {/* SHOP BY COLLECTIONS (Circular Style) */}
      <section className="py-24 container mx-auto px-6 overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black uppercase tracking-tight italic">Shop By Collections</h2>
          <div className="w-16 h-1 bg-black mx-auto mt-4"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-10 md:gap-16">
          {loading ? (
            Array(6).fill(0).map((_, i) => <CircularCollectionSkeleton key={i} />)
          ) : (
            <>
              {collections.slice(0, 6).map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className="flex flex-col items-center gap-4 group"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-black transition-all duration-500 p-1 shadow-xl">
                    <img
                      src={collection.imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400'}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-700"
                      alt={collection.name}
                    />
                  </div>
                  <span className="text-[0.65rem] md:text-[0.7rem] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">{collection.name}</span>
                </Link>
              ))}

              {/* Discover More Circle */}
              <Link
                to="/collections"
                className="flex flex-col items-center gap-4 group"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-gray-100 flex items-center justify-center group-hover:border-black transition-all duration-500 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gray-50 group-hover:bg-black transition-colors duration-500"></div>
                  <ChevronRight size={32} className="relative z-10 text-gray-400 group-hover:text-white transition-colors duration-500" />
                </div>
                <span className="text-[0.65rem] md:text-[0.7rem] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">Discover All</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Featured Products Tabs */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-10">
          <div className="flex flex-col items-center mb-16">
            <div className="flex gap-10 md:gap-16 border-b border-gray-100 w-full justify-center mb-12">
              <button
                onClick={() => setActiveTab('best-sellers')}
                className={`pb-4 text-[0.7rem] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'best-sellers' ? 'text-black' : 'text-gray-300 hover:text-gray-500'}`}
              >
                Best Sellers
                {activeTab === 'best-sellers' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
              </button>
              <button
                onClick={() => setActiveTab('new-arrivals')}
                className={`pb-4 text-[0.7rem] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'new-arrivals' ? 'text-black' : 'text-gray-300 hover:text-gray-500'}`}
              >
                New Arrival
                {activeTab === 'new-arrivals' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
              </button>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">
              {activeTab === 'best-sellers' ? 'Popular Picks' : 'Latest Drops'}
            </h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {activeTab === 'best-sellers' ? 'Most loved by our community' : 'Fresh styles just landed in our store'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-12"
            >
              {loading ? (
                Array(5).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              ) : (
                displayProducts.slice(0, 5).map((product) => (
                  <Link key={product.id} to={`/products/${product.handle || product.id}`} className="group space-y-4">
                    <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-white relative">
                      <img
                        src={product.thumbnailUrl || product.images?.[0]}
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${product.hoverThumbnailUrl || product.images?.[1] ? 'absolute inset-0 group-hover:opacity-0' : ''}`}
                        alt={product.name}
                      />
                      {(product.hoverThumbnailUrl || product.images?.[1]) && (
                        <img
                          src={product.hoverThumbnailUrl || product.images?.[1]}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
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
                ))
              )}
            </motion.div>
          </AnimatePresence>

          <div className="text-center mt-20">
            <Link
              to="/collections/25a1dc7c-029e-44b9-b64b-e25e1525a4de"
              className="inline-flex items-center gap-3 bg-white text-black border border-black px-12 py-4 rounded-full text-[0.65rem] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl active:scale-95"
            >
              View all <ChevronRight size={14} />
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

      {/* Shoppable Videos Section */}
      <ShoppableVideo />

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
                  <a
                    href="https://www.google.com/maps/place/Vikram+Urbane/@22.748421,75.8182107,13z/data=!4m6!3m5!1s0x3962fd57c7b315d5:0xe8e1287dffe4c75!8m2!3d22.748421!4d75.8903085!16s%2Fg%2F1q62k_zmf?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={18} /></a>
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
            <img src="/images/knitting_knot.png" className="w-full h-full object-cover" alt="Indore Store" />
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
