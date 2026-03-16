import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { Package } from 'lucide-react';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Reviews from './pages/Reviews';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import ColorVariants from './pages/ColorVariants';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('adminAuth') === 'true';
  return isAuth ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-60'}`}>
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

const Customers = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
      <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Customers</h1>
    </header>
    <main className="p-10">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-32 text-center text-gray-400 flex flex-col items-center gap-4">
        <Package size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
        <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">No customers yet</p>
      </div>
    </main>
  </div>
);

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
        <Route path="/sales" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
