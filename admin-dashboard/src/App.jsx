import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { Package, Menu, X } from 'lucide-react';

import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Reviews from './pages/Reviews';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Sales from './pages/Sales';
import ColorVariants from './pages/ColorVariants';
import Login from './pages/Login';
import Messages from './pages/Messages';
import Banners from './pages/Banners';
import api from './utils/api';



const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('adminAuth') === 'true';
  return isAuth ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'ml-0 md:ml-60'}`}>
        {/* Mobile Header Toggle */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-30 flex items-center px-6">
           <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
             <Menu size={24} />
           </button>
           <span className="ml-4 text-sm font-black uppercase italic tracking-tight">Clothing Store</span>
        </div>
        
        {/* Spacer for fixed mobile header */}
        <div className="md:hidden h-16" />
        
        {children}
      </div>
    </div>
  );
};



const Dashboard = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
      <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Dashboard</h1>
    </header>
    <main className="p-10">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight dark:text-white">Welcome back!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's a summary of your store's performance today.</p>
      </div>
    </main>
  </div>
);

const Customers = () => {
  const [customers, setCustomers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/auth/customers');
        setCustomers(res.data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Customers</h1>
      </header>
      <main className="p-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-32 text-center text-gray-400 flex flex-col items-center gap-4">
            <Package size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
            <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">No customers yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Email</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Join Date</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[0.7rem] font-black">
                          {customer.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-bold dark:text-white">{customer.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold dark:text-white text-right">
                      {customer.orders?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

const Settings = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
      <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Settings</h1>
    </header>
    <main className="p-10">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight dark:text-white uppercase tracking-tighter">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your store configuration.</p>
      </div>
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/products/:id" element={
          <ProtectedRoute>
            <Layout>
              <ProductDetail />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/products/:id/variants" element={
          <ProtectedRoute>
            <Layout>
              <ColorVariants />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/categories" element={
          <ProtectedRoute>
            <Layout>
              <Categories />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/categories/:id" element={
          <ProtectedRoute>
            <Layout>
              <CategoryDetail />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/collections" element={
          <ProtectedRoute>
            <Layout>
              <Collections />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/collections/:id" element={
          <ProtectedRoute>
            <Layout>
              <CollectionDetail />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/reviews" element={
          <ProtectedRoute>
            <Layout>
              <Reviews />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetail /></Layout></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
        <Route path="/banners" element={<ProtectedRoute><Layout><Banners /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />


      </Routes>
    </Router>
  );
}

export default App;
