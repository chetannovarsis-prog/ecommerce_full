import React from 'react';

// Shimmer skeleton block — visible on both white and beige backgrounds
const Skeleton = ({ className }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{ backgroundColor: '#e5e0da' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
};

export const ProductSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-[3/4] rounded-2xl w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
      <Skeleton className="h-4 w-1/4 rounded-full" />
    </div>
  </div>
);

export const CollectionSkeleton = () => (
  <div className="h-[450px] rounded-2xl overflow-hidden relative">
    <Skeleton className="w-full h-full" />
    <div className="absolute bottom-10 left-0 right-0 p-6 flex justify-center">
      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
  </div>
);

export const CircularCollectionSkeleton = () => (
  <div className="flex flex-col items-center gap-4">
    <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
    <Skeleton className="h-3 w-16 rounded-full" />
  </div>
);

export const HeroSkeleton = () => (
  <div className="relative h-[85vh] overflow-hidden" style={{ backgroundColor: '#e5e0da' }}>
    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
      <Skeleton className="h-32 md:h-48 w-3/4 rounded-full" />
      <Skeleton className="h-12 w-48 rounded-xl" />
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="min-h-screen pb-40 italic-none" style={{ background: 'linear-gradient(135deg, #fdf7f0 0%, #fef9f4 50%, #fdf0e8 100%)' }}>
    {/* Breadcrumb skeleton */}
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-6">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
    </div>

    <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Left: Images */}
        <div className="lg:col-span-7">
          {/* Mobile Image Skeleton */}
          <div className="block lg:hidden">
            <Skeleton className="w-full aspect-[3/4] rounded-2xl" />
          </div>

          {/* Desktop Image Skeleton */}
          <div className="hidden lg:grid grid-cols-12 gap-6">
            <div className="col-span-2 space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg w-full" />
              ))}
            </div>
            <div className="col-span-10">
              <Skeleton className="aspect-[3/4] rounded-2xl w-full" />
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-5 space-y-6 mt-4 lg:mt-0">
          {/* Title */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-4/5 rounded" />
            <Skeleton className="h-10 w-3/5 rounded" />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-4 h-4 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-24 rounded" />
          </div>

          {/* Price */}
          <Skeleton className="h-10 w-32 rounded" />

          {/* Stock */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>

          {/* Size options */}
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-20 rounded" />
            <div className="flex gap-3">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-12 h-12 rounded" />
              ))}
            </div>
          </div>

          {/* Color options */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="flex gap-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-12 h-12 rounded-full" />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-4 pt-6">
            <div className="flex gap-4">
              <Skeleton className="h-14 w-32 rounded-lg" />
              <Skeleton className="h-14 flex-1 rounded-lg" />
            </div>
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const RelatedProductsSkeleton = () => (
  <div className="mt-40">
    <div className="flex items-center justify-between mb-12">
      <Skeleton className="h-8 w-48 rounded" />
      <Skeleton className="h-4 w-32 rounded" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[3/4] rounded-2xl w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
