import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { ChevronRight, Star, MapPin, Phone } from 'lucide-react';
import Hero from '../../components/store/Hero';
import Testimonials from '../../components/store/Testimonials';
import Benefits from '../../components/store/Benefits';
import ShoppableVideo from '../../components/store/ShoppableVideo';
import { ProductSkeleton, CircularCollectionSkeleton } from '../../components/store/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const toCollectionSlug = (name = '') =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Lotus SVG motif — matches the orange lotus inside the GharOfEthnics logo
const LotusMotif = ({ size = 14, color = '#e87825' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4C13 8 11 12 11 16C11 19 13.5 21.5 16 22C18.5 21.5 21 19 21 16C21 12 19 8 16 4Z" fill={color}/>
    <path d="M7 10C6 13 6 16 7.5 18.5C9 21 11.5 22 14 21.5C14.8 19.5 14.5 17 13 15C11 13 9 11 7 10Z" fill={color} opacity="0.85"/>
    <path d="M25 10C23 11 21 13 19 15C17.5 17 17.2 19.5 18 21.5C20.5 22 23 21 24.5 18.5C26 16 26 13 25 10Z" fill={color} opacity="0.85"/>
    <path d="M3 17C4.5 20 7 22.5 10 23.5C12 24 14 23.5 15.5 22.5C15 20.5 13.5 19 11.5 18C9 17 6 17 3 17Z" fill={color} opacity="0.7"/>
    <path d="M29 17C26 17 23 17 20.5 18C18.5 19 17 20.5 16.5 22.5C18 23.5 20 24 22 23.5C25 22.5 27.5 20 29 17Z" fill={color} opacity="0.7"/>
    <ellipse cx="16" cy="24" rx="4" ry="2.5" fill={color} opacity="0.5"/>
  </svg>
);

const Home = () => {
  // Initialize state synchronously from cache to prevent loading flashes
  const [collections, setCollections] = useState(() => {
    try {
      const cached = localStorage.getItem('homeCollections');
      const timestamp = localStorage.getItem('homeCollectionsTimestamp');
      if (cached && timestamp && (Date.now() - parseInt(timestamp)) < (30 * 60 * 1000)) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [activeTab, setActiveTab] = useState('best-sellers');
  // Only show loading state initially if we didn't find cached collections
  const [loading, setLoading] = useState(() => collections.length === 0);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchFreshData = async () => {
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
          const sortedCollections = collectionsData.sort((a, b) => (a.order || 0) - (b.order || 0));
          setCollections(sortedCollections);
          localStorage.setItem('homeCollections', JSON.stringify(sortedCollections));
          localStorage.setItem('homeCollectionsTimestamp', Date.now().toString());
        }
        if (bestRes.status === 'fulfilled') {
          const bestData = Array.isArray(bestRes.value.data)
            ? bestRes.value.data
            : bestRes.value.data?.data || [];
          setBestSellers(bestData);
        }
        if (newRes.status === 'fulfilled') {
          const newData = Array.isArray(newRes.value.data)
            ? newRes.value.data
            : newRes.value.data?.data || [];
          setNewArrivals(newData);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setFeaturedLoading(false);
        setLoading(false);
      }
    };

    fetchFreshData();
  }, []);

  const displayProducts = activeTab === 'best-sellers' ? bestSellers : newArrivals;

  return (
    <div className="font-['Albert_Sans']">
      <h1 className="sr-only">Ghar of Ethnics Women's Clothing Brand</h1>
      <Hero />

      {/* SHOP BY COLLECTIONS */}
      <section
        className="py-24 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #fdf7f0 0%, #fef9f4 50%, #fdf0e8 100%)' }}
      >
        {/* Logo Watermark motifs */}
        <img src="/images/mandala_motif.png" alt="" className="absolute left-[-5%] top-[20%] w-[400px] opacity-[0.07] pointer-events-none scale-x-[-1]" />
        <img src="/images/mandala_motif.png" alt="" className="absolute right-[-5%] top-[10%] w-[450px] opacity-[0.08] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="md:text-4xl text-2xl font-black uppercase tracking-tight" style={{ color: '#1a2d5a' }}>Shop By Collections</h2>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-16" style={{ background: '#e8782540' }} />
              <LotusMotif size={20} color="#e87825" />
              <div className="h-px w-16" style={{ background: '#e8782540' }} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-wrap justify-center gap-8">
              {Array(3).fill(0).map((_, i) => <div key={i} className="w-64 h-80 bg-gray-100 animate-pulse rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-9xl mx-auto">
              {collections.slice(0, 3).map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${toCollectionSlug(collection.name)}`}
                  className="group relative cursor-pointer block md:mr-4 lg:mr-16 mx-4 md:mx-0"
                >
                  {/* Decorative Premium Corner Bracket */}
                  <div className="absolute -top-[34px] -right-[38px] z-30 w-[80px] h-[80px] pointer-events-none transition-transform duration-500 overflow-hidden">
                    <img src="/images/corner_bracket.png" alt="" className="w-full h-full object-contain" />
                  </div>

                  <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
                    <img
                      src={collection.imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      alt={collection.name}
                      loading="lazy"
                    />
                  </div>

                  {/* Text — navy name, orange VIEW ALL + lotus */}
                  <div className="mt-4 px-1">
                    <h3 className="text-[0.85rem] font-black uppercase tracking-[0.15em]" style={{ color: '#1a2d5a' }}>
                      {collection.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[0.65rem] font-black uppercase tracking-[0.25em]" style={{ color: '#e87825' }}>
                        View All
                      </span>
                      <LotusMotif size={14} color="#e87825" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Tabs */}
      <section className="py-24">
        <div className="container mx-auto px-10">
          <div className="flex flex-col items-center mb-16">
            <div className="flex gap-10 md:gap-16 border-b border-gray-100 w-full justify-center mb-12">
              <button
                onClick={() => setActiveTab('best-sellers')}
                className={`pb-4 text-[0.7rem] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'best-sellers' ? 'text-black' : 'text-gray-300 hover:text-gray-500'}`}
              >
                Best Sellers
                {activeTab === 'best-sellers' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-400" />}
              </button>
              <button
                onClick={() => setActiveTab('new-arrivals')}
                className={`pb-4 text-[0.7rem] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'new-arrivals' ? 'text-black' : 'text-gray-300 hover:text-gray-500'}`}
              >
                New Arrival
                {activeTab === 'new-arrivals' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-400" />}
              </button>
            </div>
            <h2 className="md:text-4xl text-2xl font-black uppercase tracking-tighter mb-4 italic">
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
              {featuredLoading ? (
                Array(5).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              ) : (
                displayProducts.slice(0, isMobile ? 4 : 5).map((product) => (
                  <Link key={product.id} to={`/products/${product.handle || product.id}`} className="group space-y-4">
                     <div className="product-card">
                    <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-white relative">
                      <img
                        src={product.thumbnailUrl || product.images?.[0]}
                        className={`w-full h-full object-contain transition-all duration-700 group-hover:scale-105 ${product.hoverThumbnailUrl || product.images?.[1] ? 'absolute inset-0 group-hover:opacity-0' : ''}`}
                        alt={product.name}
                        loading="eager"
                      />
                      {(product.hoverThumbnailUrl || product.images?.[1]) && (
                        <img
                          src={product.hoverThumbnailUrl || product.images?.[1]}
                          className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                          alt={`${product.name} hover`}
                          loading="eager"
                        />
                      )}
                      {product.isDiscountable && (
                        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest shadow-lg">Sale</div>
                      )}
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>
                    </div>
                    </div>
                    <div>
                      <h4 className="text-[0.7rem] font-black uppercase tracking-tight text-gray-900">{product.name}</h4>
                      <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">{product.subtitle || 'Essential Piece'}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {/* <span className="text-xs font-black">₹{product.price}</span>
                        {product.isDiscountable && <span className="text-[0.65rem] text-gray-300 line-through">₹{product.price + (product.discountPrice || 0)}</span>} */}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </motion.div>
          </AnimatePresence>

          <div className="text-center mt-20">
            <Link
              to="/collections/all"
              className="inline-flex items-center gap-3 bg-white text-black border border-black px-12 py-4 rounded-full text-[0.65rem] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-orange-600 transition-all shadow-xl active:scale-95 duration-300"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Shop The Style - Lookbook Grid */}
      {/* <section className="py-24">
        <div className="container mx-auto px-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic italic">Shop The Style</h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Curated looks for every occasion</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[600px]">
            <div className="lg:col-span-1 h-full rounded-2xl overflow-hidden shadow-2xl transform rotate-1">
              <img src="/images/shopping1.jpg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="" />
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
      </section> */}

      {/* Shoppable Videos Section */}
      {/* <ShoppableVideo /> */}

      {/* Testimonials - Happy Clients */}
      <Testimonials />

      {/* Benefits Section */}
      <Benefits />

      {/* Love Section - Banner */}
      <section className="py-24 relative overflow-hidden flex items-center justify-center">
        <img src="/images/love1.webp" className="w-full h-full object-cover" alt="" loading="lazy" />
        {/* <div className="absolute inset-0 bg-black/40"></div> */}
        {/* <div className="relative z-10 text-center">
            <h2 className="text-[12rem] font-black text-white leading-none tracking-tighter mix-blend-overlay">LOVE</h2>
            <p className="text-xs font-black text-white/80 uppercase tracking-[1em] mt-[-2rem]">In Every Thread</p>
         </div> */}
      </section>

      {/* Store Section - Indore Store */}
    </div>
  );
};

export default Home;
