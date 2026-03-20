import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Plus, Minus, Info, Volume2, VolumeX } from 'lucide-react';
import api from '../../utils/api';
import { useStore } from '../../services/useStore';

const ShoppableVideo = () => {
  const [products, setProducts] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalMuted, setIsModalMuted] = useState(true);
  const { addToCart } = useStore();

  const [selectedSize, setSelectedSize] = useState('S');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const videoRefs = useRef([]);
  const sectionRef = useRef(null);

  const videos = [
    { id: 1, src: '/videos/vid1.mp4', title: 'Summer Collection' },
    { id: 2, src: '/videos/vid2.mp4', title: 'New Arrivals' },
    { id: 3, src: '/videos/vid3.mp4', title: 'Ethnic Wear' },
    { id: 4, src: '/videos/vid4.mp4', title: 'Casual Fits' },
    { id: 5, src: '/videos/vid5.mp4', title: 'Party Edit' },
    { id: 6, src: '/videos/vid6.mp4', title: 'Premium Silk' },
    { id: 7, src: '/videos/vid7.mp4', title: 'Winter Sale' },
    { id: 8, src: '/videos/vid8.mp4', title: 'Bestsellers' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const productList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setProducts(productList);
      } catch (err) {
        console.error('Error fetching products for video:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const itemsPerPage = {
    lg: 4,
    md: 3,
    sm: 2
  };

  const [itemsToShow, setItemsToShow] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsToShow(2); // Grid 2x2 on mobile
      else if (window.innerWidth < 1024) setItemsToShow(3);
      else setItemsToShow(4); // Strictly 4 on desktop
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intersection Observer for autoplay/pause on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    const currentVideos = videoRefs.current;
    currentVideos.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      currentVideos.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [loading, products]);

  const totalSlides = Math.ceil(videos.length / itemsToShow);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % videos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const openModal = (video, index) => {
    const product = products.length ? products[index % products.length] : null;
    setSelectedVideo({ ...video, product });

    if (product?.variants?.length > 0) {
      setSelectedColor(product.variants[0].title);
    } else {
      setSelectedColor('S');
    }

    setQuantity(1);
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  const navigateModal = (direction) => {
    const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = videos.length - 1;
    if (nextIndex >= videos.length) nextIndex = 0;
    
    openModal(videos[nextIndex], nextIndex);
  };

  if (loading && products.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-24 bg-white overflow-hidden relative">
      <div className="max-w-full mx-auto md:px-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Shop The Look</h2>
            <p className="text-[0.6rem] md:text-xs font-black text-gray-400 uppercase tracking-widest mt-2">Tap to shop your favorite styles</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={prevSlide} 
              disabled={currentSlide === 0}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-100 flex items-center justify-center transition-all shadow-sm ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black hover:text-white'}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide} 
              disabled={currentSlide >= videos.length - itemsToShow}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-100 flex items-center justify-center transition-all shadow-sm ${currentSlide >= videos.length - itemsToShow ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black hover:text-white'}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="relative">
          <motion.div 
            className={`flex gap-3 md:gap-4 ${window.innerWidth < 768 ? 'grid grid-cols-2' : ''}`}
            animate={window.innerWidth >= 768 ? { x: -currentSlide * (100 / itemsToShow) + '%' } : {}}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          >
            {videos.map((vid, idx) => (
              <div 
                key={vid.id}
                className="flex-shrink-0 relative group cursor-pointer w-full"
                style={window.innerWidth >= 768 ? { width: `calc((100% - ${(itemsToShow - 1) * 1}rem) / ${itemsToShow})` } : {}}
                onClick={() => openModal(vid, idx)}
              >
                <div className="rounded-xl overflow-hidden bg-black shadow-xl relative">
                  <video 
                    ref={(el) => (videoRefs.current[idx] = el)}
                    src={vid.src} 
                    className="w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden border border-white/20 shadow-lg flex-shrink-0">
                      <img src={products.length > 0 ? products[idx % products.length]?.thumbnailUrl || '/images/default-product.jpg' : '/images/default-product.jpg'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.55rem] md:text-[0.65rem] font-bold text-white truncate">{products.length > 0 ? products[idx % products.length]?.name : vid.title}</p>
                      <p className="text-[0.5rem] md:text-[0.6rem] font-black text-white/70 tracking-tighter">₹{products.length > 0 ? products[idx % products.length]?.price ?? '---' : '---'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-5xl h-[90vh] md:h-[80vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeModal} className="absolute top-6 right-6 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-black hover:text-white transition-all">
                <X size={20} />
              </button>

              {/* Video Section */}
              <div className="flex-1 h-3/5 md:h-auto relative bg-black">
                <video 
                  key={selectedVideo.src}
                  src={selectedVideo.src}
                  className="w-full h-full object-cover md:object-contain"
                  autoPlay
                  loop
                  muted={isModalMuted}
                  playsInline
                />
                
                {/* Modal Navigation Arrows */}
                <button 
                  onClick={() => navigateModal(-1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => navigateModal(1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Left Top Info */}
                <div className="absolute top-6 left-6 text-white text-[0.6rem] font-black bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                   {videos.findIndex(v => v.id === selectedVideo.id) + 1} / {videos.length}
                </div>

                {/* Mute Toggle */}
                <button 
                  onClick={() => setIsModalMuted(!isModalMuted)}
                  className="absolute bottom-6 right-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/10"
                >
                  {isModalMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {/* Product Info Section */}
              <div className="w-full md:w-[450px] p-8 md:p-12 overflow-y-auto bg-white flex flex-col">
                <div className="flex gap-6 mb-10">
                   <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-lg">
                      <img src={selectedVideo.product?.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="flex-1 pt-2">
                      <h3 className="text-xl font-black uppercase tracking-tighter leading-tight mb-2">{selectedVideo.product?.name}</h3>
                      <p className="text-lg font-black text-gray-900">₹{selectedVideo.product?.price}</p>
                   </div>
                </div>

                <div className="space-y-10 flex-1">
                  {/* Color Selector */}
                  <div>
                    <h4 className="text-[0.65rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Color</h4>
                    <div className="flex gap-3">
                       {selectedVideo.product?.variants?.map(v => {
                         const colorMatch = v.title.match(/color:\s*([^,]+)/i);
                         const color = colorMatch ? colorMatch[1].trim() : v.title;
                         return (
                            <button 
                              key={v.id}
                              onClick={() => setSelectedColor(v.title)}
                              className={`px-4 py-2 border-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedColor === v.title ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
                            >
                              {color}
                            </button>
                         );
                       })}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div>
                    <h4 className="text-[0.65rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Size</h4>
                    <div className="flex gap-3">
                       {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                          <button 
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`w-12 h-12 border-2 rounded-xl text-xs font-black transition-all ${selectedSize === size ? 'border-black bg-black text-white shadow-xl' : 'border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}
                          >
                            {size}
                          </button>
                       ))}
                    </div>
                  </div>

                  {/* Quantity & Add to Cart */}
                  <div className="pt-6 space-y-6">
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-400 hover:text-black transition-colors"><Minus size={16} /></button>
                          <span className="w-8 text-center font-black text-sm">{quantity}</span>
                          <button onClick={() => setQuantity(quantity + 1)} className="text-gray-400 hover:text-black transition-colors"><Plus size={16} /></button>
                       </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={() => addToCart(selectedVideo.product, { id: selectedVideo.product.id, title: `${selectedColor} / ${selectedSize}`, price: selectedVideo.product.price })}
                        className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[0.75rem] shadow-2xl shadow-black/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        Add to Bag <ShoppingBag size={18} />
                      </button>
                      <button className="w-16 h-16 border-2 border-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all text-gray-400">
                         <Info size={24} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Description Section */}
                  <div className="pt-10 border-t border-gray-100">
                     <div className="flex items-center justify-between group cursor-pointer mb-6">
                       <h4 className="text-sm font-black uppercase tracking-tight">Description</h4>
                       <ChevronRight size={16} className="text-gray-300 group-hover:text-black transition-transform" />
                     </div>
                     <p className="text-[0.8rem] text-gray-500 leading-relaxed font-medium">
                        {selectedVideo.product?.description || "Step into effortless style with this meticulously crafted piece. Designed for a modern balance of comfort and chic fashion."}
                     </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ShoppableVideo;
