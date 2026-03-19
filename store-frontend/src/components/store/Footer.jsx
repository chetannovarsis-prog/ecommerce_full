import { Instagram, Facebook } from 'lucide-react';
import { TbBrandPinterest, TbBrandWhatsapp } from 'react-icons/tb';

import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#111] text-white pt-24 pb-12">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
          <div className="lg:col-span-2">
            <Link to="/" className="mb-8 block w-[150px]"><img src="/images/logo3.png" alt="" /></Link>
            <p className="text-gray-400 text-[0.9rem] leading-7 max-w-sm">
              Premium fashion for the modern individual. Quality craftsmanship and timeless style, delivered to your doorstep.
            </p>
            <div className="flex gap-6 mt-10">
              <a href="https://www.instagram.com/knittingknot_official/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors"><Instagram size={22} /></a>
              <a href="https://www.facebook.com/knittingknot" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors"><Facebook size={22} /></a>
              <a href="https://in.pinterest.com/knitting_knot/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors"><TbBrandPinterest size={22} /></a>
              <a href="https://alvo.chat/67KT" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors"><TbBrandWhatsapp size={22} /></a>
            </div>

          </div>

          <div>
            <h4 className="font-bold mb-8 uppercase text-xs tracking-widest text-white">Shop</h4>
            <ul className="space-y-4 text-gray-400 text-[0.85rem]">
              <li><Link to="/new-arrivals" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Men's Collection</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Women's Collection</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-8 uppercase text-xs tracking-widest text-white">Support</h4>
            <ul className="space-y-4 text-gray-400 text-[0.85rem]">
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-8 uppercase text-xs tracking-widest text-white">Newsletter</h4>
            <p className="text-gray-400 text-xs mb-6">Join our list for exclusive offers.</p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                className="bg-zinc-900 border border-zinc-800 px-4 py-3 text-xs focus:border-white outline-none transition-colors w-full"
              />
              <button className="bg-white text-black text-[0.65rem] font-bold uppercase py-3 tracking-widest hover:bg-gray-200 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-[0.75rem]">
          <p>© 2026 VOGUE. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
