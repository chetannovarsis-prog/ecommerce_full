import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/10 ${className}`}></div>
  );
};

export const ProductSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-[3/4] rounded-2xl w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full opacity-60" />
      <Skeleton className="h-4 w-1/4 rounded-full pt-2" />
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
  <div className="relative h-[85vh] bg-gray-200 dark:bg-white/5 animate-pulse overflow-hidden">
    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
      <div className="h-32 md:h-48 w-3/4 bg-gray-300 dark:bg-white/10 rounded-full" />
      <div className="h-12 w-48 bg-gray-300 dark:bg-white/10 rounded-xl" />
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="min-h-screen pb-40 italic-none">
    <div className="container mx-auto px-6 lg:px-10 pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left: Images */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-12 gap-6">
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
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-8 w-3/4 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-4 w-1/3 rounded-full" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4 rounded-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32 rounded-lg" />
              <Skeleton className="h-12 flex-1 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const RelatedProductsSkeleton = () => (
  <div className="mt-40">
    <div className="flex items-center justify-between mb-12">
      <Skeleton className="h-8 w-48 rounded-full" />
      <Skeleton className="h-4 w-32 rounded-full" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[3/4] rounded-2xl w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

