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
  
  // State for selected variant
  const [selectedVariant, setSelectedVariant] = useState(variants && variants.length > 0 ? variants[0] : null);
  const [activeImage, setActiveImage] = useState(thumbnailUrl || (images && images.length > 0 ? images[0] : 'https://via.placeholder.com/400x500?text=No+Image'));

  useEffect(() => {
    if (selectedVariant) {
      const variantImg = selectedVariant.thumbnailUrl || (selectedVariant.images && selectedVariant.images[0]);
      if (variantImg) setActiveImage(variantImg);
    }
  }, [selectedVariant]);

  const currentPrice = (selectedVariant?.price !== null && selectedVariant?.price !== undefined) ? selectedVariant.price : (price || 0);
  const hasDiscount = isDiscountable && discountPrice > 0;
  const originalPrice = hasDiscount ? (currentPrice + parseFloat(discountPrice)) : null;

  // Extract colors
  const colors = Array.from(new Set(variants?.map(v => {
    const title = v.title || '';
    const match = title.match(/color:\s*([^,]+)/i);
    return match ? match[1].trim() : null;
  }).filter(Boolean)));

  if (isListView) {
    return (
      <div 
        onClick={() => navigate(`/products/${product.handle || id}`)}
        className="flex gap-10 group cursor-pointer py-10 border-b border-gray-50 last:border-0 italic-none"
      >
        <div className="w-60 aspect-[3/4] overflow-hidden bg-gray-50 rounded-sm relative flex-shrink-0">
          <img src={activeImage} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="" />
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
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      const variant = variants.find(v => v.title.toLowerCase().includes(`color: ${color.toLowerCase()}`));
                      if (variant) setSelectedVariant(variant);
                    }}
                    className={`w-6 h-6 rounded-full border-2 p-0.5 transition-all ${selectedVariant?.title?.includes(`Color: ${color}`) ? 'border-black' : 'border-transparent'}`}
                  >
                    <div className="w-full h-full rounded-full border border-black/5" style={{ backgroundColor: color.toLowerCase() }} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={(e) => { e.stopPropagation(); addToCart(product, selectedVariant); }}
              className="px-8 py-3.5 bg-black text-white text-[0.65rem] font-black uppercase tracking-[3px] rounded-sm hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              Add to Bag <ShoppingBag size={14} />
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
    <div className="relative group cursor-pointer italic-none" onClick={() => navigate(`/products/${product.handle || id}`)}>
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

      <button 
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
        }}
        className={`absolute top-4 right-4 z-20 p-2.5 rounded-full backdrop-blur-md transition-all shadow-xl active:scale-90 opacity-0 group-hover:opacity-100 ${isFavorited ? 'bg-red-50 text-red-500 opacity-100' : 'bg-white/80 text-gray-400 hover:text-black hover:bg-white'}`}
      >
        <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
      </button>
      
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 rounded-sm ring-1 ring-black/5">
        <div className="w-full h-full relative">
            <motion.img 
              initial={false}
              animate={{ 
                scale: 1,
                opacity: 1
              }}
              whileHover={{ 
                scale: 1.15,
                transition: { scale: { duration: 3, ease: "linear" }, opacity: { duration: 0 } }
              }}
              src={activeImage} 
              alt={name} 
              className="w-full h-full object-cover absolute inset-0 z-10" 
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
                className="w-full h-full object-cover absolute inset-0 z-20" 
              />
            )}

        </div>
        
        {/* Quick Add Button */}
        <div className="absolute inset-x-4 bottom-4 z-30 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               addToCart(product, selectedVariant);
             }}
             className="w-full bg-white/90 backdrop-blur-md text-black py-3 rounded-sm text-[0.65rem] font-black uppercase tracking-[2px] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-2xl"
           >
             Add to Bag <ShoppingBag size={14} />
           </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-[0.65rem] font-bold uppercase tracking-tight text-gray-900 leading-tight limit-2-lines flex-1">{name}</h3>
          <div className="flex flex-col items-end">
             <span className="text-[0.7rem] font-black text-gray-900 tracking-tight">₹{currentPrice}</span>
             {originalPrice && (
               <span className="text-[0.6rem] text-gray-300 line-through font-bold">₹{originalPrice}</span>
             )}
          </div>
        </div>

        {/* {colors.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {colors.map(color => {
              const isActive = selectedVariant?.title?.includes(`Color: ${color}`);
              return (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    const variant = variants.find(v => v.title.includes(`Color: ${color}`));
                    if (variant) setSelectedVariant(variant);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border p-0.5 transition-all ${isActive ? 'border-black' : 'border-transparent'}`}
                >
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: color.toLowerCase() }} title={color} />
                </button>
              );
            })}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ProductCard;
