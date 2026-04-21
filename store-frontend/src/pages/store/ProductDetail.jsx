import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
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
  const [fullscreenMode, setFullscreenMode] = useState('product'); // 'product' or 'review'
  const [fullscreenImages, setFullscreenImages] = useState([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState('chart'); // 'chart' | 'measure'

  const [currentFullscreenIndex, setCurrentFullscreenIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', name: '', email: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loadRelated, setLoadRelated] = useState(false);
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewPreviews, setReviewPreviews] = useState([]);
  const relatedSectionRef = useRef(null);

  const thumbnailRefs = useRef([]);
  const thumbnailContainerRef = useRef(null);
  const sizeGuideBodyRef = useRef(null);
  const howToMeasureRef = useRef(null);

  // Memoized image list — only recomputes when product or selectedVariant changes
  const allImages = useMemo(() => {
    if (!product) return [];

    let variantImages = (selectedVariant?.images || []).filter(isValidUrl);
    const variantThumbnail = selectedVariant?.thumbnailUrl;
    if (isValidUrl(variantThumbnail)) {
      variantImages = [variantThumbnail, ...variantImages.filter(img => img !== variantThumbnail)];
    }

    const otherVariantsImages = (product.variants || [])
      .filter(v => v.id !== selectedVariant?.id)
      .flatMap(v => [v.thumbnailUrl, ...(v.images || [])])
      .filter(img => isValidUrl(img) && !variantImages.includes(img));

    const uniqueOtherVariantsImages = Array.from(new Set(otherVariantsImages));

    const productImages = [product.thumbnailUrl, ...(product.images || [])]
      .filter(img => isValidUrl(img) && !variantImages.includes(img) && !uniqueOtherVariantsImages.includes(img));

    const uniqueProductImages = Array.from(new Set(productImages));

    return [...variantImages, ...uniqueOtherVariantsImages, ...uniqueProductImages];
  }, [product, selectedVariant]);

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

        // Use reviews immediately if present in the response
        if (response.data.reviews) {
          setReviews(response.data.reviews);
          setReviewsLoading(false);
        }

        // Staggered loading for non-critical related products
        setTimeout(() => {
          fetchRelatedAndReviews(response.data);
        }, 1000);

      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedAndReviews = async (productData) => {
      try {
        // Fetch Related Products (Same category + Featured)
        const allProductsRes = await api.get('/products');
        const categoryIds = productData.categoryIds || [];

        if (allProductsRes.data) {
          const products = Array.isArray(allProductsRes.data) ? allProductsRes.data : (allProductsRes.data.data || []);
          const related = products
            .filter(p => (p.id !== productData.id && (p.stock > 0 || p.quantity > 0)))
            .sort((a, b) => {
              const aInCat = a.categoryIds?.some(id => categoryIds.includes(id));
              const bInCat = b.categoryIds?.some(id => categoryIds.includes(id));
              if (aInCat && !bInCat) return -1;
              if (!aInCat && bInCat) return 1;
              return 0;
            })
            .slice(0, 6); // Limit to top 6 as requested
          setRelatedProducts(related);
        }

        // Fetch Reviews only if not already provided in productData
        if (!productData.reviews) {
          setReviewsLoading(true);
          const reviewsRes = await api.get(`/reviews/product/${id}`);
          setReviews(reviewsRes.data);
          setReviewsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching non-critical data:', error);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (reviewImages.length + files.length > 5) {
      alert('Maximum 5 images allowed per review.');
      return;
    }

    setIsCompressing(true);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          return await imageCompression(file, options);
        })
      );

      setReviewImages(prev => [...prev, ...compressedFiles]);

      const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
      setReviewPreviews(prev => [...prev, ...newPreviews]);
    } catch (error) {
      console.error('Error compressing images:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(reviewPreviews[index]);
    setReviewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const savedCustomer = localStorage.getItem('customer');
      let userPhone = '';
      if (savedCustomer) {
        const customer = JSON.parse(savedCustomer);
        userPhone = customer.mobile || '';
      }

      let uploadedImageUrls = [];
      if (reviewImages.length > 0) {
        const formData = new FormData();
        reviewImages.forEach(image => {
          formData.append('images', image);
        });

        const uploadRes = await api.post('/reviews/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrls = uploadRes.data.urls;
      }

      await api.post('/reviews', {
        productId: product.id,
        userName: reviewForm.name,
        userEmail: reviewForm.email,
        userPhone: userPhone,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        images: uploadedImageUrls
      });

      // Refresh reviews
      const reviewsRes = await api.get(`/reviews/product/${id}`);
      setReviews(reviewsRes.data);

      // Reset form
      if (savedCustomer) {
        const customer = JSON.parse(savedCustomer);
        setReviewForm({ rating: 5, comment: '', name: customer.name || '', email: customer.email || '' });
      } else {
        setReviewForm({ rating: 5, comment: '', name: '', email: '' });
      }
      setReviewImages([]);
      reviewPreviews.forEach(url => URL.revokeObjectURL(url));
      setReviewPreviews([]);
      setIsReviewing(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.error || 'Failed to submit review. Each user can submit only one review per product.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Intersection Observer for lazy loading related products
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadRelated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (relatedSectionRef.current) {
      observer.observe(relatedSectionRef.current);
    }

    return () => observer.disconnect();
  }, [relatedProducts.length]);

  // Auto-populate review form when opening

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
  const stockCount = selectedVariant
    ? Number(selectedVariant.stock ?? selectedVariant.quantity ?? 0)
    : Number(product.stock ?? product.quantity ?? 0);
  const isOutOfStock = stockCount <= 0;

  const handleNextImage = () => {
    if (fullscreenMode === 'product') {
      const currentIdx = allImages.indexOf(activeImage);
      const nextIdx = (currentIdx + 1) % allImages.length;
      setActiveImage(allImages[nextIdx]);
    } else {
      const nextIdx = (fullscreenIndex + 1) % fullscreenImages.length;
      setFullscreenIndex(nextIdx);
    }
  };

  const handlePrevImage = () => {
    if (fullscreenMode === 'product') {
      const currentIdx = allImages.indexOf(activeImage);
      const prevIdx = (currentIdx - 1 + allImages.length) % allImages.length;
      setActiveImage(allImages[prevIdx]);
    } else {
      const prevIdx = (fullscreenIndex - 1 + fullscreenImages.length) % fullscreenImages.length;
      setFullscreenIndex(prevIdx);
    }
  };

  // Group variants by multiple attributes (deduplicated by case-insensitive matching)
  const variantOptions = {};
  const valueMapByAttribute = {}; // Maps lowercase values to their original case

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
      const valueLower = value.toLowerCase();

      if (!variantOptions[name]) {
        variantOptions[name] = new Set();
        valueMapByAttribute[name] = {};
      }

      // Only add if we haven't seen this value (case-insensitive)
      if (!valueMapByAttribute[name][valueLower]) {
        variantOptions[name].add(value);
        valueMapByAttribute[name][valueLower] = value; // Store original case
      }
    });
  });

  // Helper to find variant matching partial selections
  const findMatchingVariant = (newVal, type) => {
    if (!product.variants || product.variants.length === 0) return null;

    const typeLower = type.toLowerCase();
    const valLower = newVal.toLowerCase();

    // 1. Build current selections from the selectedVariant title
    const currentSelections = {};
    if (selectedVariant?.title) {
      selectedVariant.title.split(', ').forEach(attr => {
        if (attr.includes(': ')) {
          const colonIdx = attr.indexOf(': ');
          const k = attr.slice(0, colonIdx).trim().toLowerCase();
          const v = attr.slice(colonIdx + 2).trim().toLowerCase();
          currentSelections[k] = v;
        } else {
          currentSelections['option'] = attr.trim().toLowerCase();
        }
      });
    }

    // 2. Override with the newly chosen value
    currentSelections[typeLower] = valLower;

    // 3. Find all variants that contain the target value in any form:
    //    - "Size: M"  (explicit key:value)
    //    - "M"        (bare value, standalone segment)
    const possibleMatches = product.variants.filter(v => {
      const vTitle = v.title.toLowerCase();
      const segments = vTitle.split(', ').map(s => s.trim());

      // Check explicit "type: value" pattern
      if (vTitle.includes(`${typeLower}: ${valLower}`)) return true;

      // Check a bare segment that equals the value (e.g. title is just "M")
      return segments.some(seg => seg === valLower || seg.endsWith(`: ${valLower}`));
    });

    if (possibleMatches.length === 0) return null;

    // 4. Score each candidate by how many other current selections it also satisfies
    const scoredMatches = possibleMatches.map(v => {
      let score = 0;
      const vTitle = v.title.toLowerCase();
      const segments = vTitle.split(', ').map(s => s.trim());

      Object.entries(currentSelections).forEach(([k, val]) => {
        const isTarget = k === typeLower;
        const explicitPattern = `${k}: ${val}`;
        if (vTitle.includes(explicitPattern)) {
          score += isTarget ? 20 : 2;
        } else if (segments.some(seg => seg === val || seg.endsWith(`: ${val}`))) {
          score += isTarget ? 20 : 2;
        }
      });
      return { variant: v, score };
    });

    // 5. Pick best match; fall back to first candidate if all scores are 0
    return scoredMatches.sort((a, b) => b.score - a.score)[0].variant;
  };

  return (
    <div className="min-h-screen pb-40 italic-none">
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
          <div className="lg:col-span-7">

            {/* ── MOBILE: swipable slider with arrows + dots ── */}
            <div className="block lg:hidden relative">
              <div
                id="mobile-gallery"
                className="aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden relative"
              >
                <div
                  className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
                  onScroll={(e) => {
                    const idx = Math.round(e.target.scrollLeft / e.target.clientWidth);
                    if (allImages[idx] && allImages[idx] !== activeImage) setActiveImage(allImages[idx]);
                  }}
                  ref={(el) => { if (el) el._mobileSlider = true; }}
                  id="mobile-gallery-inner"
                >
                  {allImages.map((img, i) => (
                    <div key={i} className="min-w-full h-full snap-center flex-shrink-0">
                      <img src={img} className="w-full h-full object-cover" alt={`${product.name} ${i + 1}`} />
                    </div>
                  ))}
                </div>

                {/* Left arrow */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const el = document.getElementById('mobile-gallery-inner');
                        if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-md shadow-md flex items-center justify-center text-black z-10"
                    >
                      <LeftIcon size={18} />
                    </button>
                    {/* Right arrow */}
                    <button
                      onClick={() => {
                        const el = document.getElementById('mobile-gallery-inner');
                        if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-md shadow-md flex items-center justify-center text-black z-10"
                    >
                      <RightIcon size={18} />
                    </button>
                  </>
                )}

                {/* Dots */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const el = document.getElementById('mobile-gallery-inner');
                          if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                          setActiveImage(allImages[i]);
                        }}
                        className={`rounded-full transition-all duration-300 ${
                          activeImage === allImages[i]
                            ? 'w-5 h-1.5 bg-black'
                            : 'w-1.5 h-1.5 bg-black/25'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Fullscreen btn */}
                <button
                  onClick={() => setIsFullscreenOpen(true)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-md z-10"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            {/* ── DESKTOP: thumbnails + large image ── */}
            <div className="hidden lg:grid grid-cols-12 gap-6">
              <div
                ref={thumbnailContainerRef}
                className="col-span-2 flex flex-col gap-4 max-h-[700px] overflow-y-auto no-scrollbar"
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

              <div className="col-span-10">
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
                      loading="eager"
                      fetchpriority="high"
                    />
                  </AnimatePresence>
                  <button
                    onClick={() => setIsFullscreenOpen(true)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:bg-white transition-all z-10"
                  >
                    <Maximize2 size={18} />
                  </button>
                </div>
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
                {reviewsLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-4 h-4 rounded-full bg-gray-100 animate-pulse" />)}
                    </div>
                    <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
                  </div>
                ) : (
                  <>
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
                        : 'Be the first to review'}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  </>
                )}
              </button>

              <div className="flex flex-col gap-1 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-[#e44d26]">₹{sellingPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Stock Meter */}
              <div className="space-y-3 pt-4">
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
              </div>

              <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest pt-2">Inclusive of all taxes</p>

              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest border-b border-black pb-1 hover:opacity-60 transition-opacity pt-4"
              >
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
                    {Array.from(variantOptions['size'] || [])
                      .filter((size, index, arr) =>
                        arr.findIndex(s => s.toLowerCase() === size.toLowerCase()) === index
                      )
                      .map(val => {
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
                    {Array.from(variantOptions['color'] || [])
                      .filter((color, index, arr) =>
                        // Double-check deduplication: keep only first occurrence (case-insensitive)
                        arr.findIndex(c => c.toLowerCase() === color.toLowerCase()) === index
                      )
                      .map(color => {
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
                  <button onClick={() => quantity > 1 && setQuantity(prev => prev - 1)} className="p-4 hover:bg-gray-50 disabled:opacity-40" disabled={quantity <= 1}><Minus size={16} /></button>
                  <span className="w-12 text-center font-black">{quantity}</span>
                  <button onClick={() => !isOutOfStock && quantity < stockCount && setQuantity(prev => prev + 1)} className="p-4 hover:bg-gray-50 disabled:opacity-40" disabled={isOutOfStock || quantity >= stockCount}><Plus size={16} /></button>
                </div>
                <button
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product, selectedVariant, quantity)}
                  className={`flex-1 py-5 rounded-lg text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isOutOfStock ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-[#1a1a1a] text-white hover:bg-black'}`}
                >
                  {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                </button>
              </div>
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  addToCart(product, selectedVariant, quantity);
                  if (isOutOfStock) return;
                  navigate('/checkout');
                }}
                className={`w-full py-5 rounded-lg text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#dab352] text-white hover:bg-[#c9a241]'}`}
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
                {reviewsLoading ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-20 h-16 bg-gray-100 animate-pulse rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
                      <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-6xl font-black text-gray-900">
                      {reviews.length > 0
                        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                        : '0.0'
                      }
                    </div>
                    <div className="space-y-1">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map(s => (
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
                  </>
                )}
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
                      <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-700">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
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
                      <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-700">Your Name</label>
                      <input
                        required
                        type="text"
                        value={reviewForm.name}
                        onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-black transition-all outline-none font-bold text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-700">Email Address</label>
                      <input
                        required
                        type="email"
                        value={reviewForm.email}
                        onChange={e => setReviewForm({ ...reviewForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-black transition-all outline-none font-bold text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-700">Review</label>
                      <textarea
                        required
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-black transition-all outline-none font-bold text-sm h-32 resize-none"
                        placeholder="Share your thoughts about this product..."
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-700">Add Photos (Max 5)</label>
                        <span className="text-[0.6rem] font-bold text-gray-400">{reviewImages.length}/5</span>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {reviewPreviews.map((url, idx) => (
                          <div key={idx} className="relative aspect-square group">
                            <img src={url} className="w-full h-full object-cover rounded-lg border border-gray-100" alt="" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute -top-1 -right-1 bg-black text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <CloseIcon size={12} />
                            </button>
                          </div>
                        ))}
                        {reviewImages.length < 5 && (
                          <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer transition-all ${isCompressing ? 'opacity-50 cursor-not-allowed' : 'hover:border-black hover:bg-gray-50'}`}>
                            {isCompressing ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[0.5rem] font-black uppercase">...</span>
                              </div>
                            ) : (
                              <Plus size={16} className="text-gray-400" />
                            )}
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={handleImageChange}
                              disabled={isCompressing}
                            />
                          </label>
                        )}
                      </div>
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
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={14} fill={s <= r.rating ? 'currentColor' : 'none'} className={s <= r.rating ? '' : 'text-gray-200'} />
                        ))}
                      </div>
                      <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{r.userName || 'Anonymous User'}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{r.comment}</p>

                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {r.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setFullscreenMode('review');
                              setFullscreenImages(r.images);
                              setFullscreenIndex(idx);
                              setIsFullscreenOpen(true);
                            }}
                          >
                            <img src={img} className="w-full h-full object-cover" alt="" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    )}
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
        <div ref={relatedSectionRef}>
          {loadRelated && relatedProducts.length > 0 && (
            <div className="mt-40">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black uppercase tracking-tight">You May Also Like</h2>
                <Link to="/collections/all" className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-60 transition-all">View All Products</Link>
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
                        loading="lazy"
                      />
                      {(p.hoverThumbnailUrl || p.images?.[1]) && (
                        <img
                          src={p.hoverThumbnailUrl || p.images?.[1]}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          alt={`${p.name} hover`}
                          loading="lazy"
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
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreenOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-4 md:p-10 select-none">
            <button
              onClick={() => {
                setIsFullscreenOpen(false);
                setFullscreenMode('product');
                setFullscreenImages([]);
              }}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-white p-4 hover:rotate-90 transition-transform z-[1100]"
            >
              <CloseIcon size={32} />
            </button>

            {/* Navigation Arrows */}
            {((fullscreenMode === 'product' && allImages.length > 1) || (fullscreenMode === 'review' && fullscreenImages.length > 1)) && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md z-[1100]"
                >
                  <LeftIcon size={32} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md z-[1100]"
                >
                  <RightIcon size={32} />
                </button>
              </>
            )}

            <div className="w-full h-full flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={fullscreenMode === 'product' ? activeImage : `${fullscreenMode}-${fullscreenIndex}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  src={fullscreenMode === 'product' ? activeImage : fullscreenImages[fullscreenIndex]}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                  alt=""
                />
              </AnimatePresence>

              {/* Counter for Review Images */}
              {fullscreenMode === 'review' && fullscreenImages.length > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-black tracking-widest">
                  {fullscreenIndex + 1} / {fullscreenImages.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal — Myntra style */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSizeGuideOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white w-full md:max-w-3xl md:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 md:p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={activeImage} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h2 className="font-black uppercase text-base tracking-tight leading-tight">{product.name}</h2>
                    <p className="text-[#e44d26] font-black text-sm mt-0.5">₹{sellingPrice.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <CloseIcon size={22} />
                </button>
              </div>

              {/* Tabs — scroll to section on click */}
              <div className="flex border-b border-gray-100 flex-shrink-0">
                {['Size Chart', 'How to Measure'].map(tab => {
                  const key = tab === 'Size Chart' ? 'chart' : 'measure';
                  const isActive = sizeGuideTab === key;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setSizeGuideTab(key);
                        if (key === 'chart') {
                          sizeGuideBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          howToMeasureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest relative transition-colors ${
                        isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <motion.div
                          layoutId="size-guide-tab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e44d26]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Body — single scrollable area with both sections */}
              <div ref={sizeGuideBodyRef} className="flex-1 overflow-y-auto no-scrollbar">

                {/* ── SIZE CHART ── */}
                <div className="p-4 md:p-6 space-y-5">
                  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[480px]">
                      <thead>
                        <tr>
                          <th className="bg-[#fc8403] text-white px-4 py-3 text-[0.6rem] font-black uppercase tracking-widest border-r border-white/30">Size</th>
                          <th className="bg-[#fc8403] text-white px-4 py-3 text-[0.6rem] font-black uppercase tracking-widest border-r border-white/30">Bust (in)</th>
                          <th className="bg-[#fc8403] text-white px-4 py-3 text-[0.6rem] font-black uppercase tracking-widest border-r border-white/30">Waist (in)</th>
                          <th className="bg-[#fc8403] text-white px-4 py-3 text-[0.6rem] font-black uppercase tracking-widest border-r border-white/30">Hip (in)</th>
                          <th className="bg-[#fc8403] text-white px-4 py-3 text-[0.6rem] font-black uppercase tracking-widest border-r border-white/30">Shoulder (in)</th>
                          <th className="bg-[#fc8403] text-white px-4 py-3 text-[0.6rem] font-black uppercase tracking-widest">Kurta Length (in)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { s: 'M',   b: '37–38', w: '30–32', h: '38–40', sh: '14.5', l: '40–46' },
                          { s: 'L',   b: '39–40', w: '32–34', h: '40–42', sh: '15',   l: '40–46' },
                          { s: 'XL',  b: '41–42', w: '34–36', h: '42–44', sh: '15.5', l: '40–46' },
                          { s: '2XL', b: '43–44', w: '36–38', h: '44–46', sh: '16',   l: '40–46' },
                        ].map((row, idx) => {
                          const matchedVariant = findMatchingVariant(row.s, 'size');
                          const isSelected = selectedVariant?.title?.toLowerCase().includes(`size: ${row.s.toLowerCase()}`);
                          const isAvailable = !!matchedVariant;
                          return (
                            <tr
                              key={idx}
                              onClick={() => {
                                if (matchedVariant) {
                                  setSelectedVariant(matchedVariant);
                                  setIsSizeGuideOpen(false);
                                }
                              }}
                              className={`group transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-50'
                                  : isAvailable
                                  ? 'hover:bg-gray-50'
                                  : 'opacity-40 cursor-not-allowed'
                              }`}
                            >
                              <td className="px-4 py-3.5 border-t border-gray-100 border-r">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected ? 'border-[#fc8403]' : 'border-gray-300 group-hover:border-gray-500'
                                  }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#fc8403]" />}
                                  </div>
                                  <span className={`font-black text-sm ${isSelected ? 'text-[#fc8403]' : 'text-gray-900'}`}>{row.s}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 border-t border-gray-100 border-r text-sm font-semibold text-gray-600">{row.b}</td>
                              <td className="px-4 py-3.5 border-t border-gray-100 border-r text-sm font-semibold text-gray-600">{row.w}</td>
                              <td className="px-4 py-3.5 border-t border-gray-100 border-r text-sm font-semibold text-gray-600">{row.h}</td>
                              <td className="px-4 py-3.5 border-t border-gray-100 border-r text-sm font-semibold text-gray-600">{row.sh}</td>
                              <td className="px-4 py-3.5 border-t border-gray-100 text-sm font-semibold text-gray-600">{row.l}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest text-center">
                    All measurements are body measurements in inches · Click a size to select it
                  </p>
                </div>

                {/* ── HOW TO MEASURE ── */}
                <div ref={howToMeasureRef} className="p-4 md:p-6 space-y-4 border-t border-gray-100">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">How to measure yourself</p>
                  <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                    <img src="/images/size.webp" className="w-full h-auto object-contain" alt="How to measure" loading="lazy" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { t: 'Bust', d: 'Measure at the fullest part of your chest, keeping the tape level.' },
                      { t: 'Waist', d: 'Measure around your natural waistline, slightly loose.' },
                      { t: 'Hip', d: 'Measure around the fullest part of your hips.' },
                      { t: 'Kurta Length', d: 'From the highest shoulder point straight down to the hem.' },
                    ].map((item, i) => (
                      <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-900 mb-1">{item.t}</p>
                        <p className="text-[0.65rem] text-gray-500 leading-relaxed">{item.d}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="w-full py-4 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-80 transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
