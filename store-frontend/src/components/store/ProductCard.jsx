import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../services/useStore';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ product, isListView = false }) => {
  const { id, name, price, images, variants, badge, isDiscountable, discountPrice, thumbnailUrl, hoverThumbnailUrl } = product;
  const navigate = useNavigate();
  const { toggleWishlist, wishlist, addToCart } = useStore();

  const isFavorited = wishlist.some(p => p.id === id);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prefetchedRef = React.useRef(false);

  // State for selected variant
  const [selectedVariant, setSelectedVariant] = useState(variants && variants.length > 0 ? variants[0] : null);
  const [activeImage, setActiveImage] = useState(thumbnailUrl || (images && images.length > 0 ? images[0] : 'https://via.placeholder.com/400x500?text=No+Image'));
  const isFirstRender = React.useRef(true);

  // Sync activeImage whenever curated fields change (e.g. from Admin update)
  useEffect(() => {
    setActiveImage(thumbnailUrl || (images && images.length > 0 ? images[0] : 'https://via.placeholder.com/400x500?text=No+Image'));
  }, [thumbnailUrl, images]);

  useEffect(() => {
    if (selectedVariant && !isFirstRender.current) {
      const variantImg = selectedVariant.thumbnailUrl || (selectedVariant.images && selectedVariant.images[0]);
      if (variantImg) {
        setActiveImage(variantImg);
      }
    }
  }, [selectedVariant]);

  useEffect(() => {
     isFirstRender.current = false;
  }, []);

  // Prefetch product detail API on hover for snappier navigation
  const handlePrefetch = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    // Fire-and-forget: prime the browser and API cache
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://ecommerce-backend-s90k.onrender.com/api'}/products/${product.handle || id}`, { 
      priority: 'low',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('customerToken') || ''}`
      }
    }).catch(() => {});
  };

  const currentPrice = (selectedVariant?.price !== null && selectedVariant?.price !== undefined) ? selectedVariant.price : (price || 0);
  const hasDiscount = isDiscountable && discountPrice > 0;
  const originalPrice = hasDiscount ? (currentPrice + parseFloat(discountPrice)) : null;
  const availableStock = Number(selectedVariant?.stock ?? selectedVariant?.quantity ?? product.stock ?? product.quantity ?? 0);
  const isOutOfStock = availableStock <= 0;

  // Extract colors
  // Deduplicate colors by case-insensitive matching
  const colorMap = {};
  variants?.forEach(v => {
    const title = v.title || '';
    const match = title.match(/color:\s*([^,]+)/i);
    if (match) {
      const colorValue = match[1].trim();
      const colorLower = colorValue.toLowerCase();
      // Only add if we haven't seen this color (case-insensitive)
      if (!colorMap[colorLower]) {
        colorMap[colorLower] = colorValue; // Store original case
      }
    }
  });
  const colors = Object.values(colorMap);

  if (isListView) {
    return (
      <div
        onClick={() => navigate(`/products/${product.handle || id}`)}
        className="flex flex-col md:flex-row gap-6 md:gap-10 group cursor-pointer py-10 border-b border-gray-50 last:border-0 italic-none"
      >
        <div className="w-full md:w-60 aspect-[3/4] overflow-hidden bg-gray-50 rounded-sm relative flex-shrink-0">
          <img src={activeImage} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" alt="" loading="eager" />
          {badge && <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest">{badge}</div>}
        </div>
        <div className="flex-1 flex flex-col justify-between py-4">
          <div className="space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tight">{name}</h3>
            <div className="flex items-center gap-4">
              <span className="text-xl font-black">₹{currentPrice}</span>
              {originalPrice && <span className="text-gray-300 line-through font-bold">₹{originalPrice}</span>}
            </div>
            <p className="text-gray-400 text-sm max-w-xl line-clamp-3 leading-relaxed">
              {product.description || "Indulge in the epitome of style with this meticulously crafted piece, designed for those who command attention and value timeless elegance."}
            </p>

            {colors.length > 0 && (
              <div className="flex mb-6 gap-2">
                {colors
                  .filter((color, index, arr) => 
                    arr.findIndex(c => c.toLowerCase() === color.toLowerCase()) === index
                  )
                  .map(color => {
                    const lowerColor = color.toLowerCase();
                    const representativeVariant = variants.find(v => {
                      const match = (v.title || '').match(/color:\s*([^,]+)/i);
                      return match && match[1].trim().toLowerCase() === lowerColor;
                    });
                    const imgUrl = representativeVariant?.thumbnailUrl
                      || representativeVariant?.images?.[0]
                      || thumbnailUrl;
                    const isSelected = selectedVariant?.title?.toLowerCase().includes(lowerColor);

                    return (
                      <button
                        key={color}
                        onClick={(e) => {
                          e.stopPropagation();
                          const variant = variants.find(v => v.title.toLowerCase().includes(`color: ${lowerColor}`));
                          if (variant) setSelectedVariant(variant);
                        }}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${isSelected ? ' ring-1 ring-black ring-offset-1' : 'border-gray-200 hover:border-gray-400'}`}
                      >
                        {imgUrl ? (
                          <img src={imgUrl} className="w-full h-full object-cover" alt={color} loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
          <div className="flex mt-4 md:mt-1 items-center gap-6">
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(product, selectedVariant); }}
              disabled={isOutOfStock}
              className={`px-4 md:px-8 py-3.5 text-[0.65rem] font-black uppercase tracking-[3px] rounded-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${isOutOfStock ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-zinc-800 md:hover:bg-zinc-800'}`}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
            >
              <span className="hidden md:inline">{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
              {!isOutOfStock && (
                <>
                  <ShoppingBag size={14} />
                </>
              )}
              {isOutOfStock && <span className="md:hidden">X</span>}
            </button>
            <button className="text-[0.65rem] font-black uppercase tracking-[3px] flex items-center gap-2 group-hover:gap-4 transition-all">
              View Details <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer italic-none"
      onClick={() => navigate(`/products/${product.handle || id}`)}
      onMouseEnter={handlePrefetch}
    >
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {badge && (
          <div className="bg-black text-white px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest shadow-xl">
            {badge}
          </div>
        )}
        {hasDiscount && (
          <div className="bg-emerald-500 text-white px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest shadow-xl">
            -{Math.round((discountPrice / (currentPrice + discountPrice)) * 100)}%
          </div>
        )}
      </div>

      <div className="absolute top-1 -right-1 z-[30] flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-4 right-4 z-[30] p-2.5 rounded-full backdrop-blur-md transition-all shadow-xl active:scale-90 opacity-100 lg:opacity-0 group-hover:opacity-100 ${isFavorited ? 'bg-red-50 text-red-500 opacity-100' : 'bg-white/80 text-gray-400 hover:text-black hover:bg-white'}`}
          title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-md ring-1 ring-black/5">
        {/* Skeleton shimmer while image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 z-30 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-[shimmer_1.4s_infinite] bg-[length:200%_100%]" />
        )}

        <div className="w-full h-full relative">
          <motion.img
            initial={false}
            animate={{ scale: 1, opacity: imgLoaded ? 1 : 0 }}
            whileHover={{
              scale: 1.15,
              transition: { scale: { duration: 3, ease: "linear" }, opacity: { duration: 0 } }
            }}
            src={activeImage}
            alt={name}
            className="w-full h-full object-contain absolute inset-0 z-10 transition-opacity duration-300"
            loading="eager"
            onLoad={() => setImgLoaded(true)}
          />
          {hoverThumbnailUrl && (
            <motion.img
              initial={{ opacity: 0 }}
              whileHover={{
                opacity: 1,
                scale: 1.15,
                transition: { scale: { duration: 3, ease: "linear" }, opacity: { duration: 0 } }
              }}
              src={hoverThumbnailUrl}
              alt={`${name} hover`}
              className="w-full h-full object-contain absolute inset-0 z-20"
              loading="eager"
            />
          )}
        </div>

        {/* Quick Add Button — DESKTOP ONLY */}
        <div className="hidden lg:block absolute inset-x-4 bottom-4 z-30 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, selectedVariant);
            }}
            disabled={isOutOfStock}
            className={`w-full backdrop-blur-md py-3 rounded-sm text-[0.65rem] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2 shadow-2xl ${isOutOfStock ? 'bg-white/90 text-gray-400 cursor-not-allowed' : 'bg-white/90 text-black hover:bg-black hover:text-white'}`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Bag'} <ShoppingBag size={14} />
          </button>
        </div>

        {/* Quick Add Button — MOBILE ONLY */}
        <div className="block lg:hidden absolute bottom-3 right-3 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, selectedVariant);
            }}
            disabled={isOutOfStock}
            className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md shadow-lg active:scale-95 transition-all ${isOutOfStock ? 'bg-white/80 text-gray-400' : 'bg-white/80 text-black'}`}
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          {imgLoaded ? (
            <>
              <h3 className="text-[0.65rem] font-bold uppercase tracking-tight text-gray-900 leading-tight line-clamp-2 flex-1">{name}</h3>
              <div className="flex flex-col items-end">
                <span className="text-[0.7rem] font-black text-gray-900 tracking-tight">₹{currentPrice}</span>
                {originalPrice && (
                  <span className="text-[0.6rem] text-gray-300 line-through font-bold">₹{originalPrice}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-4/5" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/5" />
              </div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-10" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
