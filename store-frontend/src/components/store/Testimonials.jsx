import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      title: "My Favourite Place to Shop Online",
      text: "I always find trendy and elegant outfits that make me feel confident and beautiful.",
      author: "Ananya Sharma",
      location: "Customer from India",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=200",
      productName: "The Bare Basic — Women's Self-Line...",
      price: "₹699",
      oldPrice: "₹2,399"
    },
    {
      title: "Perfect Fit and Good Quality Febric",
      text: "The quality of the fabric is amazing and everything fits like it was made for me!",
      author: "Priya Joshi",
      location: "Customer from Jaipur",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=200",
      productName: "The Contrast Line — Pure Cambridge...",
      price: "₹699",
      oldPrice: "₹2,316"
    },
    {
      title: "Stylish, Affordable & Reliable",
      text: "Finally, a fashion site that understands women—stylish collections without breaking the bank.",
      author: "Akansha Tyagi",
      location: "Customer from Bhopal",
      image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=200",
      productName: "The Half Bloom — Pure Cotton Boat...",
      price: "₹1,199",
      oldPrice: "₹3,613"
    }
  ];

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-32 bg-[#fafafa] font-['Albert_Sans']">
      <div className="container mx-auto px-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black uppercase tracking-tight text-black mb-4">Happy Clients</h2>
          <p className="text-sm font-medium text-gray-500">Hear what they say about us</p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-amber-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] relative group hover:shadow-xl transition-all h-full flex flex-col"
              >
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} className="fill-[#ff7a5c] text-[#ff7a5c]" />
                  ))}
                </div>

                <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-gray-900">{t.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium">
                  "{t.text}"
                </p>

                <div className="mt-auto">
                    <div className="mb-8">
                        <h4 className="text-sm font-black text-gray-900">{t.author}</h4>
                        <p className="text-[0.7rem] text-gray-400 font-bold mt-0.5">{t.location}</p>
                    </div>

                    <div className="pt-6 border-t border-amber-100 flex items-center gap-4 group/prod cursor-pointer">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                            <img src={t.image} className="w-full h-full object-cover grayscale group-hover/prod:grayscale-0 transition-all" alt="" />
                        </div>
                        <div>
                            <p className="text-[0.65rem] font-bold text-gray-800 line-clamp-1">{t.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[0.65rem] text-gray-400 line-through font-bold">{t.oldPrice}</span>
                                <span className="text-[0.65rem] text-[#ff4d4d] font-black">{t.price}</span>
                            </div>
                        </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button onClick={prev} className="absolute -left-20 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-amber-100 flex items-center justify-center text-amber-200 hover:text-amber-500 hover:border-amber-500 transition-all hidden xl:flex">
             <ChevronLeft size={24} />
          </button>
          <button onClick={next} className="absolute -right-20 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-amber-100 flex items-center justify-center text-amber-200 hover:text-amber-500 hover:border-amber-500 transition-all hidden xl:flex">
             <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

