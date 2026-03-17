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

export default Skeleton;

