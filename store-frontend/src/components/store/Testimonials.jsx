import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const [visibleCount, setVisibleCount] = useState(3);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const testimonials = [
    {
      title: "Exactly as shown, amazing quality",
      text: "Loved the quality of the fabric - it's really comfortable and looks exactly like the pictures. Totally worth it!",
      author: "Shivani",
      location: "Greater Noida",
      rating: 4.0
    },
    {
      title: "Great experience from start to finish",
      text: "Great experience overall. Good material, neat stitching, and fast delivery. Really happy with my purchase.",
      author: "Geetanjali",
      location: "Gurgaon",
      rating: 4.5
    },
    {
      title: "Lightweight & office-friendly",
      text: "Such a great find! The suit is lightweight, soft, and very comfortable. Perfect for office wear and casual plans too.",
      author: "Vaani",
      location: "New Delhi",
      rating: 4.7
    },
    {
      title: "Great fit, super lightweight",
      text: "Perfect for hot weather. Keeps you cool and relaxed all day.",
      author: "Sheela",
      location: "Puri",
      rating: 4.8
    },
    {
      title: "Extremely comfortable for everyday use",
      text: "This Cotton Kurta Set is extremely comfortable for everyday use. The material feels soft on the skin and is very breathable, even in humid weather.",
      author: "Sudeshna",
      location: "Kolkata",
      rating: 4.6
    }
  ];

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };
  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Get visible items based on responsive count
  const getVisibleTestimonials = () => {
    const indices = [];
    for (let i = 0; i < visibleCount; i++) {
      indices.push((currentIndex + i) % testimonials.length);
    }
    return indices.map(idx => testimonials[idx]);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <section className="py-32 font-['Albert_Sans'] bg-[#fffaf5] overflow-hidden">
      <div className="container mx-auto px-4 md:px-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black uppercase tracking-tight text-[#1a2d5a] mb-4">Customer Testimonials</h2>
          <div className="flex items-center justify-center gap-4">
             <div className="h-px w-12 bg-orange-200" />
             <p className="text-[0.65rem] font-black text-orange-500 uppercase tracking-[4px]">Verified Feedback</p>
             <div className="h-px w-12 bg-orange-200" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-10 md:px-16">
          <div className="relative h-[480px]">
             <AnimatePresence initial={false} custom={direction}>
                <motion.div 
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className={`absolute inset-0 grid gap-8 ${
                        visibleCount === 1 ? 'grid-cols-1' : 
                        visibleCount === 2 ? 'grid-cols-2' : 
                        'grid-cols-3'
                    }`}
                >
                    {getVisibleTestimonials().map((t, i) => (
                    <div 
                        key={`${currentIndex}-${i}-${t.author}`}
                        className="h-full"
                    >
                        <div className="bg-white p-10 rounded-[2rem] border border-orange-50 shadow-[0_20px_50px_rgba(232,120,37,0.05)] relative group hover:shadow-2xl hover:shadow-orange-200/20 transition-all duration-500 h-full flex flex-col ring-1 ring-black/5">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                    <div key={s} className="relative">
                                    <Star size={14} className="text-gray-100" fill="currentColor" />
                                    <div 
                                        className="absolute inset-0 overflow-hidden" 
                                        style={{ width: `${Math.max(0, Math.min(100, (t.rating - (s - 1)) * 100))}%` }}
                                    >
                                        <Star size={14} className="text-[#e87825] fill-[#e87825]" />
                                    </div>
                                    </div>
                                ))}
                                </div>
                                <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">{t.rating.toFixed(1)}</span>
                            </div>

                            <h3 className="text-[0.95rem] font-black uppercase tracking-tight mb-4 text-[#1a2d5a] leading-tight group-hover:text-[#e87825] transition-colors">{t.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium italic opacity-80">
                            "{t.text}"
                            </p>

                            <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between">
                                <div>
                                    <h4 className="text-[0.7rem] font-black text-[#1a2d5a] uppercase tracking-wider">{t.author}</h4>
                                    <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.location}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Star size={12} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </motion.div>
             </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={prev} 
            className="absolute left-0 md:-left-4 xl:-left-10 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white border border-orange-100 flex items-center justify-center text-orange-500 shadow-xl hover:bg-[#1a2d5a] hover:text-white hover:border-[#1a2d5a] transition-all z-[10] group/btn"
          >
             <ChevronLeft size={24} className="group-hover/btn:-translate-x-0.5 transition-transform" />
          </button>
          <button 
            onClick={next} 
            className="absolute right-0 md:-right-4 xl:-right-10 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white border border-orange-100 flex items-center justify-center text-orange-500 shadow-xl hover:bg-[#1a2d5a] hover:text-white hover:border-[#1a2d5a] transition-all z-[10] group/btn"
          >
             <ChevronRight size={24} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-3 mt-16">
            {testimonials.map((_, i) => (
                <button 
                    key={i}
                    onClick={() => {
                        setDirection(i > currentIndex ? 1 : -1);
                        setCurrentIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-500 ${currentIndex === i ? 'w-8 bg-[#1a2d5a]' : 'w-2 bg-orange-200'}`}
                />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

