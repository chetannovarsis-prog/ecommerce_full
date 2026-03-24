import { Instagram, Facebook, MapPin, Phone, Heart } from 'lucide-react';
import { TbBrandPinterest, TbBrandWhatsapp } from 'react-icons/tb';
import { Link } from 'react-router-dom';

// Lotus/mandala motif SVG — matches logo accent color
const LotusMotif = ({ size = 14, color = '#e87825' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4C13 8 11 12 11 16C11 19 13.5 21.5 16 22C18.5 21.5 21 19 21 16C21 12 19 8 16 4Z" fill={color}/>
    <path d="M7 10C6 13 6 16 7.5 18.5C9 21 11.5 22 14 21.5C14.8 19.5 14.5 17 13 15C11 13 9 11 7 10Z" fill={color} opacity="0.85"/>
    <path d="M25 10C23 11 21 13 19 15C17.5 17 17.2 19.5 18 21.5C20.5 22 23 21 24.5 18.5C26 16 26 13 25 10Z" fill={color} opacity="0.85"/>
    <path d="M3 17C4.5 20 7 22.5 10 23.5C12 24 14 23.5 15.5 22.5C15 20.5 13.5 19 11.5 18C9 17 6 17 3 17Z" fill={color} opacity="0.7"/>
    <path d="M29 17C26 17 23 17 20.5 18C18.5 19 17 20.5 16.5 22.5C18 23.5 20 24 22 23.5C25 22.5 27.5 20 29 17Z" fill={color} opacity="0.7"/>
    <ellipse cx="16" cy="24" rx="4" ry="2.5" fill={color} opacity="0.5"/>
  </svg>
);

const Footer = () => {
  return (
    <footer
      className="relative overflow-hidden pt-20 pb-10"
      style={{ background: 'linear-gradient(160deg, #1a2d5a 0%, #0f1c3a 60%, #0a1228 100%)' }}
    >
      {/* Left side logo watermark */}
      <img
        src="/images/logo3.png"
        alt=""
        aria-hidden="true"
        className="absolute left-0 bottom-0 w-[300px] h-[300px] object-contain pointer-events-none select-none"
        style={{ opacity: 0.06 }}
      />
      {/* Right side logo watermark */}
      <img
        src="/images/logo3.png"
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-0 w-[280px] h-[280px] object-contain pointer-events-none select-none"
        style={{ opacity: 0.05 }}
      />

      <div className="max-w-[1400px] mx-auto px-10 relative z-10">

        {/* Top divider with lotus */}
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #e8782540)' }} />
          <LotusMotif size={22} color="#e87825" />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #e8782540)' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-6 block w-[130px]">
              <img src="/images/logo3.png" alt="Ghar of Ethnics" className="w-full" />
            </Link>
            <p className="text-[0.8rem] leading-7 max-w-xs" style={{ color: '#c9b99a' }}>
              Rooted in tradition. Crafted for today. Discover ethnic fashion that celebrates India's timeless heritage.
            </p>

            {/* Contact info */}
            <div className="mt-8 space-y-3">
              <a
                href="https://www.google.com/maps/search/Ghar+of+Ethnics+Koramangala+Bangalore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#e87825' }} />
                <span className="text-[0.72rem] leading-5" style={{ color: '#c9b99a' }}>
                  38, Booth no-127, 2nd Main Road, Ashwini Layout,<br/>Ejipura, Koramangala, Bangalore – 560047
                </span>
              </a>
              <a
                href="tel:+918861940980"
                className="flex items-center gap-3"
              >
                <Phone size={13} style={{ color: '#e87825' }} />
                <span className="text-[0.72rem]" style={{ color: '#c9b99a' }}>+91 88619 40980</span>
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex gap-5 mt-8">
              <a href="https://www.instagram.com/gharofethnics/" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}>
                <Instagram size={16} />
              </a>
              <a href="https://www.facebook.com/gharofethnics/" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}>
                <Facebook size={16} />
              </a>
              <a href="https://in.pinterest.com/gharofethnics/" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}>
                <TbBrandPinterest size={16} />
              </a>
              <a
                href="https://wa.me/918861940980"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-110"
                style={{ borderColor: '#e87825', color: '#e87825' }}>
                <TbBrandWhatsapp size={16} />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <LotusMotif size={12} color="#e87825" />
              <h4 className="font-black text-xs tracking-widest uppercase text-white">Shop</h4>
            </div>
            <ul className="space-y-4 text-[0.82rem]" style={{ color: '#c9b99a' }}>
              <li><Link to="/new-arrivals" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>New Arrivals</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Best Sellers</Link></li>
              <li><Link to="/collections" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Collections</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Women's Ethnic</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <LotusMotif size={12} color="#e87825" />
              <h4 className="font-black text-xs tracking-widest uppercase text-white">Support</h4>
            </div>
            <ul className="space-y-4 text-[0.82rem]" style={{ color: '#c9b99a' }}>
              <li><Link to="/shipping" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Returns & Exchanges</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Track Your Order</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <LotusMotif size={12} color="#e87825" />
              <h4 className="font-black text-xs tracking-widest uppercase text-white">Newsletter</h4>
            </div>
            <p className="text-[0.75rem] mb-5" style={{ color: '#c9b99a' }}>Join our list for exclusive offers & new drops.</p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                className="px-4 py-3 text-xs outline-none w-full text-white placeholder:text-white/30"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(232,120,37,0.3)', borderRadius: '2px' }}
              />
              <button
                className="py-3 text-[0.65rem] font-black uppercase tracking-widest text-white transition-colors"
                style={{ background: '#e87825', borderRadius: '2px' }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[0.72rem]"
          style={{ borderTop: '1px solid rgba(232,120,37,0.2)', color: '#c9b99a' }}
        >
          <div className="flex items-center gap-2">
            <LotusMotif size={12} color="#e87825" />
            <p>© 2026 Ghar of Ethnics. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
