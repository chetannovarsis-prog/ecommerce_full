import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { TbBrandLinkedin, TbBrandThreads, TbBrandWhatsapp, TbBrandYoutube, TbBrandInstagram } from 'react-icons/tb';
import { Link } from 'react-router-dom';

const LotusMotif = ({ size = 14, color = '#e87825' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4C13 8 11 12 11 16C11 19 13.5 21.5 16 22C18.5 21.5 21 19 21 16C21 12 19 8 16 4Z" fill={color} />
    <path d="M7 10C6 13 6 16 7.5 18.5C9 21 11.5 22 14 21.5C14.8 19.5 14.5 17 13 15C11 13 9 11 7 10Z" fill={color} opacity="0.85" />
    <path d="M25 10C23 11 21 13 19 15C17.5 17 17.2 19.5 18 21.5C20.5 22 23 21 24.5 18.5C26 16 26 13 25 10Z" fill={color} opacity="0.85" />
    <path d="M3 17C4.5 20 7 22.5 10 23.5C12 24 14 23.5 15.5 22.5C15 20.5 13.5 19 11.5 18C9 17 6 17 3 17Z" fill={color} opacity="0.7" />
    <path d="M29 17C26 17 23 17 20.5 18C18.5 19 17 20.5 16.5 22.5C18 23.5 20 24 22 23.5C25 22.5 27.5 20 29 17Z" fill={color} opacity="0.7" />
    <ellipse cx="16" cy="24" rx="4" ry="2.5" fill={color} opacity="0.5" />
  </svg>
);

const Footer = () => {
  const whatsappMessage = encodeURIComponent('Hello, I would like to know more about your products.');

  return (
    <footer
      className="relative overflow-hidden pt-20 pb-32 md:pb-10 bg-[#ddcbb7]/50"
    // style={{ background: 'linear-gradient(160deg, #1a2d5a 0%, #0f1c3a 60%, #0a1228 100%)' }}
    >
      <img
        src="/images/logo3.png"
        alt=""
        aria-hidden="true"
        className="absolute left-0 bottom-0 w-[300px] h-[300px] object-contain pointer-events-none select-none"
        style={{ opacity: 0.06 }}
      />
      <img
        src="/images/logo3.png"
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-0 w-[280px] h-[280px] object-contain pointer-events-none select-none"
        style={{ opacity: 0.05 }}
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10">
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #e8782540)' }} />
          <LotusMotif size={22} color="#e87825" />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #e8782540)' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16">
          <div className="md:col-span-2 lg:col-span-2">
            <Link to="/" className="mb-6 block w-[150px]">
              <img src="/images/logo.webp?v=1" alt="Ghar of Ethnics" className="w-full h-auto" />
            </Link>
            <p className="text-[0.8rem] leading-7 max-w-xs font-medium" style={{ color: '#b75a14' }}>
              Rooted in tradition. Crafted for today. Discover ethnic fashion that celebrates India&apos;s timeless heritage.
            </p>

            <div className="mt-8 space-y-3">
              <div
                // href="https://www.google.com/maps/search/Ghar+of+Ethnics+Koramangala+Bangalore"
                // target="_blank"
                // rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#e87825' }} />
                <span className="text-[0.72rem] leading-5" style={{ color: '#b75a14' }}>
                  38, Booth no-127, 2nd Main Road, Ashwini Layout,
                  <br />
                  Ejipura, Koramangala, Bangalore - 560047
                </span>
              </div>
              <a href="tel:+919845634734" className="flex items-center gap-3">
                <Phone size={14} style={{ color: '#e87825' }} />
                <span className="text-[0.72rem]" style={{ color: '#b75a14' }}>+91 98456 34734</span>
              </a>
              <a href="mailto:support@gharofethnics.com" className="flex items-center gap-3">
                <Mail size={14} style={{ color: '#e87825' }} />
                <span className="text-[0.72rem]" style={{ color: '#b75a14' }}>support@gharofethnics.com</span>
              </a>
            </div>

            <div className="flex gap-5 mt-8">
              <a
                href="https://www.facebook.com/share/1DrpmWT9hW/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full group/facebook flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}
              >
                <Facebook size={16} className='group-hover/facebook:rotate-[360deg] transition-all duration-500 ' />
              </a>
              <a
                href="https://youtube.com/@gharofethnics?si=0PHrceQJ-U73T_lk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full group/youtube flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}
              >
                <TbBrandYoutube size={16} className='group-hover/youtube:rotate-[360deg] transition-all duration-500 ' />
              </a>
              <a
                href="https://www.instagram.com/gharofethnics?igsh=NG92OXRrMWhhbjBo&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full group/instagram flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}
              >
                <TbBrandInstagram size={16} className='group-hover/instagram:rotate-[360deg] transition-all duration-500 '/>
              </a>
              <a
                href="https://www.threads.com/@gharofethnics?igshid=NTc4MTIwNjQ2YQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 hidden sm:flex rounded-full group/threads flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}
              >
                <TbBrandThreads size={16} className='group-hover/threads:rotate-[360deg] transition-all duration-500 '/>
              </a>
              <a
                href="https://in.linkedin.com/in/ghar-of-ethnics-2787813ba"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center group/linkedin justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}
              >
                <TbBrandLinkedin size={16} className='group-hover/linkedin:rotate-[360deg] transition-all duration-500 '/>
              </a>
              <a
                href={`https://wa.me/919845634734?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center group/whatsapp justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}
              >
                <TbBrandWhatsapp size={16} className='group-hover/whatsapp:rotate-[360deg] transition-all duration-500 ' />
              </a>
            </div>
          </div>

          <div className="md:col-start-1 lg:col-start-auto">
            <div className="flex items-center gap-2 mb-8">
              <LotusMotif size={13} color="#e87825" />
              <h4 className="font-black text-xs tracking-widest uppercase text-[#16263f]">Shop</h4>
            </div>
            <ul className="space-y-4 text-[0.82rem] font-semibold" style={{ color: '#b75a14' }}>
              <li><Link to="/new-arrivals" className="hover:underline transition-colors" style={{ color: 'inherit' }}>New Arrivals</Link></li>
              <li><Link to="/collections/all" className="hover:underline transition-colors" style={{ color: 'inherit' }}>Best Sellers</Link></li>
              <li><Link to="/collections" className="hover:underline transition-colors" style={{ color: 'inherit' }}>Collections</Link></li>
              <li><Link to="/collections/all" className="hover:underline transition-colors" style={{ color: 'inherit' }}>All Products</Link></li>
            </ul>
          </div>

          <div className="md:col-start-1 lg:col-start-auto">
            <div className="flex items-center gap-2 mb-8">
              <LotusMotif size={12} color="#e87825" />
              <h4 className="font-black text-xs tracking-widest uppercase text-[#16263f]">Support</h4>
            </div>
            <ul className="space-y-4 text-[0.82rem] text-[#b75a14] font-semibold">
              <li><Link to="/shipping" className="hover:underline transition-colors" style={{ color: 'inherit' }}>Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:underline transition-colors" style={{ color: 'inherit' }}>Returns & Exchanges</Link></li>
              {/* <li><Link to="/contact" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Track Your Order</Link></li> */}
              <li><Link to="/contact" className="hover:underline transition-colors" style={{ color: 'inherit' }}>Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:underline transition-colors" style={{ color: 'inherit' }}>Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:underline transition-colors" style={{ color: 'inherit' }}>Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[0.72rem] text-center md:text-left"
          style={{ borderTop: '1px solid rgba(232,120,37,0.2)', color: '#c9b99a' }}
        >
          <div className="flex items-center gap-2">
            <LotusMotif size={12} color="#e87825" />
            <p className='text-[#16263f] font-semibold'>© 2026 Ghar of Ethnics. All rights reserved.</p>
          </div>
          <div className="hidden md:flex gap-6">
            <Link to="/privacy" className="hover:scale-105 text-[#16263f] transition-all">Privacy Policy</Link>
            <Link to="/terms" className="hover:scale-105 text-[#16263f] transition-all">Terms of Service</Link>
          </div>
        </div>

        <p className="text-center text-gray-500 text-[0.85rem] mt-3 px-4">
          Crafted with ❤️' by 
          <a
            href="https://www.novarsistech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-500 text-[#e87825] font-bold animate-pulse transition-colors ml-2"
          >
            Novarsis Technologies
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
