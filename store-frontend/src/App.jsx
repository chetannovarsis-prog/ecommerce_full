import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import api from './utils/api';
import { useStore } from './services/useStore';

import Products from './pages/store/Products';
import Home from './pages/store/Home';
import ProductDetail from './pages/store/ProductDetail';
import CartPage from './pages/store/CartPage';
import Checkout from './pages/store/Checkout';
import Wishlist from './pages/store/Wishlist';
import CollectionsPage from './pages/store/CollectionsPage';
import { 
  About, 
  Shipping, 
  Returns, 
  Privacy, 
  Terms 
} from './pages/store/InfoPages';
import OrderSuccess from './pages/store/OrderSuccess';
import OrderDetail from './pages/store/OrderDetail';
import Contact from './pages/store/Contact';

import Shop from './pages/store/Shop';
import NewArrivals from './pages/store/NewArrivals';
import Login from './pages/store/Login';
import Signup from './pages/store/Signup';
import ForgotPassword from './pages/store/ForgotPassword';
import Profile from './pages/store/Profile';
import Navbar from './components/store/Navbar';
import MobileNavbar from './components/store/MobileNavbar';
import Footer from './components/store/Footer';
import Toast from './components/store/Toast';
import ScrollToTop from './components/store/ScrollToTop';

import { MessageCircle } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const { syncStore } = useStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn("VITE_GOOGLE_CLIENT_ID is not defined in .env");
  }

  useEffect(() => {
    const fetchProductsAndSync = async () => {
      try {
        const response = await api.get('/products');
        const products = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        syncStore(products);
      } catch (error) {
        console.error('Error syncing store:', error);
      }
    };
    fetchProductsAndSync();
  }, [syncStore]);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <ScrollToTop />
        <div className="App selection:bg-black selection:text-white relative min-h-screen">
          <Navbar />
          <MobileNavbar />
          <Toast />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections/all" element={<Products />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/collections/:id" element={<Products />} />
              <Route path="/collections/:id" element={<Products />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>

          {/* WhatsApp Floating Button */}
          <a 
            href="https://wa.me/919876543210" 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-28 md:bottom-10 right-6 md:right-10 z-[90] bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_10px_40px_-10px_rgba(37,211,102,0.5)] hover:scale-110 transition-all duration-300 active:scale-95 group border-4 border-white"
            title="Chat with us on WhatsApp"
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="absolute right-full mr-4 bg-white text-black text-[0.6rem] font-black uppercase tracking-widest px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 whitespace-nowrap shadow-2xl border border-gray-100 italic-none">
              Chat with us
            </span>
          </a>

          <Footer />
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
