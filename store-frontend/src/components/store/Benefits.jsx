import React from 'react';
import { Box, CreditCard, RotateCcw, Headphones } from 'lucide-react';

const Benefits = () => {
  const benefits = [
    {
      icon: <Box size={32} strokeWidth={1.5} />,
      title: "Free Shipping",
      desc: "You will love at great low prices"
    },
    {
      icon: <CreditCard size={32} strokeWidth={1.5} />,
      title: "Flexible Payment",
      desc: "Pay with Multiple Credit Cards"
    },
    {
      icon: <RotateCcw size={32} strokeWidth={1.5} />,
      title: "7 Day Returns",
      desc: "Within 7 days for an exchange"
    },
    {
      icon: <Headphones size={32} strokeWidth={1.5} />,
      title: "Premium Support",
      desc: "Outstanding premium support"
    }
  ];

  return (
    <section className="pb-32 bg-[#fafafa] font-['Albert_Sans']">
      <div className="container mx-auto px-10">
        <div className="bg-white rounded-[2rem] border border-amber-100 p-12 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0 divide-y md:divide-y-0 lg:divide-x divide-amber-100">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center px-8 first:pl-0 last:pr-0 pt-8 first:pt-0 md:pt-0">
                <div className="mb-6 text-gray-900 group-hover:scale-110 transition-transform">
                  {b.icon}
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight mb-2 text-gray-900">{b.title}</h3>
                <p className="text-[0.7rem] text-gray-400 font-bold">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
