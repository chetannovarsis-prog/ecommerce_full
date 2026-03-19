import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { 
  ShoppingBag, 
  Heart, 
  ChevronRight, 
  Plus, 
  Minus, 
  Star,
  Maximize2,
  X as CloseIcon,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  Zap,
  Share2
} from 'lucide-react';

import { useStore } from '../../services/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('blob:')) return false;
  if (url === 'null' || url === 'undefined' || url === '') return false;
  return url.includes('/') || url.includes('http');
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [currentFullscreenIndex, setCurrentFullscreenIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', name: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const thumbnailRefs = useRef([]);
  const thumbnailContainerRef = useRef(null);

  // Aggregate all potential images with strict ordering and deduplication
  const getDeduplicatedImages = () => {
    if (!product) return [];

    // 1. Selected variant's images
    let variantImages = (selectedVariant?.images || []).filter(isValidUrl);
    const variantThumbnail = selectedVariant?.thumbnailUrl;
    if (isValidUrl(variantThumbnail)) {
      // Ensure thumbnail is always first
      variantImages = [variantThumbnail, ...variantImages.filter(img => img !== variantThumbnail)];
    }

    // 2. All other variants' images
    const otherVariantsImages = (product.variants || [])
      .filter(v => v.id !== selectedVariant?.id)
      .flatMap(v => [v.thumbnailUrl, ...(v.images || [])])
      .filter(img => isValidUrl(img) && !variantImages.includes(img));
    
    const uniqueOtherVariantsImages = Array.from(new Set(otherVariantsImages));

    // 3. General product images
    const productImages = [product.thumbnailUrl, ...(product.images || [])]
      .filter(img => isValidUrl(img) && !variantImages.includes(img) && !uniqueOtherVariantsImages.includes(img));
      
    const uniqueProductImages = Array.from(new Set(productImages));

    return [...variantImages, ...uniqueOtherVariantsImages, ...uniqueProductImages];
  };

  const allImages = getDeduplicatedImages();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreenOpen) return;
      if (e.key === 'Escape') setIsFullscreenOpen(false);
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen, allImages.length, activeImage]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);

        if (response.data.variants && response.data.variants.length > 0) {
          setSelectedVariant(response.data.variants[0]);
        }
        setActiveImage(response.data.thumbnailUrl || response.data.images?.[0]);
        
        // Fetch Related Products (Same category + Featured)
        const allProductsRes = await api.get('/products');
        const categoryIds = response.data.categoryIds || [];

        const related = allProductsRes.data
          .filter(p => (p.id !== response.data.id && (p.stock > 0 || p.quantity > 0)))
          .sort((a, b) => {
            const aInCat = a.categoryIds?.some(id => categoryIds.includes(id));
            const bInCat = b.categoryIds?.some(id => categoryIds.includes(id));
            if (aInCat && !bInCat) return -1;
            if (!aInCat && bInCat) return 1;
            return 0;
          })
          .slice(0, 4);
        setRelatedProducts(related);

        // Fetch Reviews
        const reviewsRes = await api.get(`/reviews/product/${id}`);
        setReviews(reviewsRes.data);


      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        productId: product.id,
        userName: reviewForm.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      // Refresh reviews
      const reviewsRes = await api.get(`/reviews/product/${id}`);
      setReviews(reviewsRes.data);

      setReviewForm({ rating: 5, comment: '', name: '' });
      setIsReviewing(false);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this ${product.name} on KnittingKnot`,
          url: window.location.href,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Product link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  useEffect(() => {
    if (selectedVariant) {
      // Prioritize variant thumbnail, then first image, then product thumbnail
      const variantImage = selectedVariant.thumbnailUrl || (selectedVariant.images && selectedVariant.images.length > 0 ? selectedVariant.images[0] : null);
      if (isValidUrl(variantImage)) {
        setActiveImage(variantImage);
      }
    }
  }, [selectedVariant]);

  useEffect(() => {
    const idx = allImages.indexOf(activeImage);
    if (idx !== -1 && thumbnailRefs.current[idx]) {
      thumbnailRefs.current[idx].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeImage]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
    </div>
  );

  if (!product) return <div className="p-20 text-center">Product not found</div>;

  const isFavorited = wishlist.some(p => p.id === product.id);
  const sellingPrice = (selectedVariant?.price !== null && selectedVariant?.price !== undefined) 
    ? selectedVariant.price 
    : (product.price || 0);

  const handleNextImage = () => {
    const currentIdx = allImages.indexOf(activeImage);
    const nextIdx = (currentIdx + 1) % allImages.length;
    setActiveImage(allImages[nextIdx]);
  };

  const handlePrevImage = () => {
    const currentIdx = allImages.indexOf(activeImage);
    const prevIdx = (currentIdx - 1 + allImages.length) % allImages.length;
    setActiveImage(allImages[prevIdx]);
  };

  // Group variants by multiple attributes
  const variantOptions = {};
  product.variants?.forEach(v => {
    if (!v.title) return;
    // Split by comma for multiple attributes (e.g., "Color: Red, Size: XL")
    const attributes = v.title.split(', ');
    attributes.forEach(attr => {
      if (!attr.includes(':')) return;
      const parts = attr.split(': ');
      if (parts.length < 2) return;
      const name = parts[0].trim().toLowerCase();
      const value = parts[1].trim();
      if (!variantOptions[name]) variantOptions[name] = new Set();
      variantOptions[name].add(value);
    });
  });

  // Helper to find variant matching partial selections
  const findMatchingVariant = (newVal, type) => {
    if (!product.variants || product.variants.length === 0) return null;
    
    // 1. Get current selections from the selectedVariant
    const currentSelections = {};
    if (selectedVariant?.title) {
      selectedVariant.title.split(', ').forEach(attr => {
        if (attr.includes(': ')) {
          const [name, val] = attr.split(': ');
          currentSelections[name.trim().toLowerCase()] = val.trim().toLowerCase();
        } else {
          // Fallback for non-labeled attributes
          currentSelections['option'] = attr.trim().toLowerCase();
        }
      });
    }

    // 2. Update the target attribute with the new value
    currentSelections[type.toLowerCase()] = newVal.toLowerCase();

    // 3. Find matches based on ANY matching attribute first, then score
    const possibleMatches = product.variants.filter(v => {
      const vTitle = v.title.toLowerCase();
      // Relaxed matching: check if the newVal is present in the title
      return vTitle.includes(newVal.toLowerCase());
    });

    if (possibleMatches.length === 0) return null;

    // 4. Score matches based on how many OTHER current selections they satisfy
    const scoredMatches = possibleMatches.map(v => {
      let score = 0;
      const vTitle = v.title.toLowerCase();
      Object.entries(currentSelections).forEach(([k, val]) => {
        // If it's the attribute we just clicked, it MUST match (though filtered above)
        if (k === type.toLowerCase()) {
           if (vTitle.includes(val)) score += 10; 
        } else {
           if (vTitle.includes(val)) score += 1;
        }
      });
      return { variant: v, score };
    });

    // 5. Return the one with the highest score
    return scoredMatches.sort((a, b) => b.score - a.score)[0].variant;
  };

  return (
    <div className="bg-white min-h-screen pb-40 italic-none">
      {/* Breadcrumbs & Title Top */}
      <div className="max-w-[1400px] mx-auto px-10 pt-6">
        <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400 mb-6">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">•</span>
          <Link to="/collections/all" className="hover:text-black transition-colors">Products</Link>
          <span className="text-gray-300">•</span>
          <span className="text-black uppercase">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left: Product Gallery */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-6">
            <div 
              ref={thumbnailContainerRef}
              className="col-span-2 hidden lg:flex flex-col gap-4 max-h-[700px] overflow-y-auto no-scrollbar"
            >
              {allImages.map((img, i) => (
                <button 
                  key={i}
                  ref={el => thumbnailRefs.current[i] = el}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? 'border-black opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            <div className="col-span-12 lg:col-span-10">
              <div className="aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden relative group">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={activeImage} 
                    className="w-full h-full object-cover"
                    alt={product.name}
                  />
                </AnimatePresence>
                
                {/* Arrow Controls */}
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:bg-white transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10"
                >
                  <LeftIcon size={20} />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:bg-white transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10"
                >
                  <RightIcon size={20} />
                </button>

                <button 
                  onClick={() => setIsFullscreenOpen(true)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:bg-white transition-all z-10"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-4xl font-black uppercase tracking-tight leading-[1.1] flex-1">{product.name}</h1>
                <button 
                  onClick={handleShare}
                  className="p-3 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"
                  title="Share Product"
                >
                  <Share2 size={20} />
                </button>
              </div>
                  <button 
                    onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                     <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map(s => {
                          const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
                          return (
                            <Star 
                              key={s} 
                              size={16} 
                              fill={s <= avgRating ? "currentColor" : "none"} 
                              className={s <= avgRating ? "" : "text-gray-200"}
                            />
                          );
                        })}
                     </div>
                     <span className="text-sm font-bold text-gray-900">
                       {reviews.length > 0 
                         ? `${(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} | (${reviews.length} Review${reviews.length > 1 ? 's' : ''})` 
                         : '0.0 | (0 Reviews)'}
                     </span>
                     <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                     </div>
                  </button>

              <div className="flex flex-col gap-1 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-[#e44d26]">₹{sellingPrice.toLocaleString()}</span>
                  </div>
              </div>

              {/* Stock Meter */}
               <div className="space-y-3 pt-4">
                 {(() => {
                   const stockCount = selectedVariant 
                     ? (parseFloat(selectedVariant.stock) || parseFloat(selectedVariant.quantity) || 0)
                     : (parseFloat(product.stock) || parseFloat(product.quantity) || 0);
                   
                   return (
                     <>
                       <div className={`flex items-center gap-2 text-sm font-black italic ${stockCount > 0 ? 'text-[#22c55e]' : 'text-red-500'}`}>
                         <Zap size={18} className="fill-current" />
                         {stockCount > 0 ? `${stockCount} items left in stock` : 'Out of stock'}
                       </div>
                       <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${stockCount > 0 ? 'bg-[#22c55e]' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min((stockCount / 20) * 100, 100)}%` }}
                          ></div>
                       </div>
                     </>
                   );
                 })()}
               </div>

              <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest pt-2">Inclusive of all taxes</p>
              
              <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest border-b border-black pb-1 hover:opacity-60 transition-opacity pt-4">
                <ShoppingBag size={14} /> Size guide
              </button>
            </div>

            {/* Size & Color Selections */}
            <div className="space-y-8 pt-4">
               {/* Size */}
               {variantOptions['size'] && (
                 <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest">
                      SIZE: {(() => {
                        const title = selectedVariant?.title || '';
                        const sizePart = title.split(/size: /i)[1];
                        return sizePart ? sizePart.split(',')[0].trim() : 'N/A';
                      })()}
                    </label>
                    <div className="flex flex-wrap gap-3">
                       {[...variantOptions['size']].map(val => {
                          const isSelected = selectedVariant?.title?.toLowerCase().includes(`size: ${val.toLowerCase()}`);
                          return (
                            <button
                              key={val}
                              onClick={() => {
                                const variant = findMatchingVariant(val, 'size');
                                if (variant) setSelectedVariant(variant);
                              }}
                              className={`w-12 h-12 flex items-center justify-center text-xs font-black border transition-all rounded-[4px] ${isSelected ? 'border-black bg-white' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
                            >
                              {val}
                            </button>
                          );
                       })}
                    </div>
                 </div>
               )}

               {/* Color */}
               {variantOptions['color'] && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-widest">
                        COLOR: <span className="text-gray-400 font-bold ml-1">
                          {(() => {
                            const title = selectedVariant?.title || '';
                            const colorPart = title.split(/color: /i)[1];
                            return colorPart ? colorPart.split(',')[0].trim() : 'N/A';
                          })()}
                        </span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-4">
                       {[...variantOptions['color']].map(color => {
                          const lowerColor = color.toLowerCase();
                          const lowerTitle = (selectedVariant?.title || '').toLowerCase();
                          const isSelected = lowerTitle.includes(`color: ${lowerColor}`) || 
                                           (!lowerTitle.includes('color:') && lowerTitle.includes(lowerColor));
                          // Find a variant that has this color to show its thumbnail
                          const representativeVariant = product.variants.find(v => {
                            const vTitle = v.title.toLowerCase();
                            return vTitle.includes(`color: ${color.toLowerCase()}`) || vTitle.includes(color.toLowerCase());
                          });
                          const imgUrl = representativeVariant?.thumbnailUrl || representativeVariant?.images?.find(isValidUrl) || product.thumbnailUrl;
                          
                          return (
                            <button
                               key={color}
                               onClick={() => {
                                 const variant = findMatchingVariant(color, 'color');
                                 if (variant) setSelectedVariant(variant);
                               }}
                               className={`group relative flex flex-col items-center gap-2 transition-all p-1 rounded-full ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}`}
                             >
                                <div className={`w-12 h-12 rounded-full border border-gray-100 transition-all duration-300 overflow-hidden shadow-sm`}>
                                   <div className="w-full h-full bg-gray-50">
                                     <img src={imgUrl} className="w-full h-full object-cover" alt={color} />
                                   </div>
                                </div>
                             </button>
                          );
                       })}
                    </div>
                 </div>
               )}
            </div>

            {/* Qty & Add to Cart */}
            <div className="pt-8 space-y-4">
               <div className="flex gap-4">
                  <div className="flex items-center bg-white border border-black/10 rounded-lg overflow-hidden">
                    <button onClick={() => quantity > 1 && setQuantity(prev => prev - 1)} className="p-4 hover:bg-gray-50"><Minus size={16} /></button>
                    <span className="w-12 text-center font-black">{quantity}</span>
                    <button onClick={() => setQuantity(prev => prev + 1)} className="p-4 hover:bg-gray-50"><Plus size={16} /></button>
                  </div>
                  <button 
                    onClick={() => addToCart(product, selectedVariant, quantity)}
                    className="flex-1 bg-[#1a1a1a] text-white py-5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]"
                  >
                    ADD TO CART
                  </button>
               </div>
               <button 
                onClick={() => {
                  addToCart(product, selectedVariant, quantity);
                  navigate('/checkout');
                }}
                className="w-full bg-[#dab352] text-white py-5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-[#c9a241] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                ORDER NOW <RightIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="mt-40 border-t border-gray-100 pt-20 scroll-mt-24">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="md:w-1/3 space-y-6">
              <h2 className="text-3xl font-black uppercase tracking-tight">Customer Reviews</h2>
              <div className="flex items-center gap-4">
                <div className="text-6xl font-black text-gray-900">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="space-y-1">
                  <div className="flex text-amber-400">
                    {[1,2,3,4,5].map(s => (
                      <Star 
                        key={s} 
                        size={18} 
                        fill={s <= (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)) ? "currentColor" : "none"} 
                        className={s <= (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)) ? "" : "text-gray-200"}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Based on {reviews.length} reviews</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReviewing(!isReviewing)}
                className="w-full py-4 border-2 border-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-xl"
              >
                {isReviewing ? 'Cancel' : 'Write a Review'}
              </button>

              <AnimatePresence>
                {isReviewing && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleReviewSubmit}
                    className="overflow-hidden space-y-4 pt-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Rating</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(s => (
                          <button 
                            key={s}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                            className={`p-1 transition-all ${reviewForm.rating >= s ? 'text-amber-400 scale-110' : 'text-gray-200'}`}
                          >
                            <Star size={24} fill={reviewForm.rating >= s ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Your Name</label>
                      <input 
                        required
                        type="text" 
                        value={reviewForm.name}
                        onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-black transition-all outline-none font-bold text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Review</label>
                      <textarea 
                        required
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-black transition-all outline-none font-bold text-sm h-32 resize-none"
                        placeholder="Share your thoughts about this product..."
                      />
                    </div>
                    <button 
                      disabled={submittingReview}
                      className="w-full bg-black text-white py-4 rounded-xl text-xs font-black tracking-widest uppercase hover:opacity-80 transition-all disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 space-y-10">
              {reviews.length > 0 ? (
                reviews.map((r, i) => (
                  <div key={i} className="space-y-3 pb-8 border-b border-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1 text-amber-400">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} fill={s <= r.rating ? 'currentColor' : 'none'} className={s <= r.rating ? '' : 'text-gray-200'} />
                        ))}
                      </div>
                      <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{r.name || 'Anonymous User'}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{r.comment}</p>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 p-10 text-center">
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No reviews yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-40">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tight">You May Also Like</h2>
              <Link to="/products" className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-60 transition-all">View All Products</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {relatedProducts.map((p, i) => (
                <Link 
                  key={p.id} 
                  to={`/products/${p.handle || p.id}`}
                  className="group space-y-4"
                >
                  <div className="aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden relative">
                    <img 
                      src={p.thumbnailUrl || p.images?.[0]} 
                      className={`w-full h-full object-cover transition-all duration-700 ${p.hoverThumbnailUrl || p.images?.[1] ? 'absolute inset-0 group-hover:opacity-0' : 'group-hover:scale-105'}`} 
                      alt={p.name} 
                    />
                    {(p.hoverThumbnailUrl || p.images?.[1]) && (
                      <img 
                        src={p.hoverThumbnailUrl || p.images?.[1]} 
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
                        alt={`${p.name} hover`} 
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black uppercase text-sm tracking-tight group-hover:text-[#e44d26] transition-colors">{p.name}</h3>
                    <p className="text-sm font-black text-gray-400">₹{p.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreenOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-10">
            <button onClick={() => setIsFullscreenOpen(false)} className="absolute top-10 right-10 text-white p-4"><CloseIcon size={32} /></button>
            <img src={activeImage} className="max-w-full max-h-full object-contain" alt="" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;

