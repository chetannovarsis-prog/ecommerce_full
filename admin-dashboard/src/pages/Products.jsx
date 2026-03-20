import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, MoreHorizontal, Search, Filter, Tag, ChevronDown } from 'lucide-react';
import ProductForm from '../forms/ProductForm';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSortFocused, setIsSortFocused] = useState(false);
  const [isPageSizeFocused, setIsPageSizeFocused] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const sortRef = React.useRef(null);
  const pageSizeRef = React.useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) setIsSortOpen(false);
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target)) setIsPageSizeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      const productList = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'asc': return a.name.localeCompare(b.name);
      case 'desc': return b.name.localeCompare(a.name);
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'high-price': return b.price - a.price;
      case 'low-price': return a.price - b.price;
      case 'max-unit': return (b.stock || 0) - (a.stock || 0);
      case 'min-unit': return (a.stock || 0) - (b.stock || 0);
      default: return 0;
    }
  });

  const displayProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Products</h1>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-6">

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-gray-50/50 dark:bg-white/5">
             <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
               <div ref={sortRef} className="relative min-w-[180px]">
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full flex items-center justify-between gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-sm transition-all hover:border-black dark:hover:border-white"
                  >
                    <div className="flex items-center gap-2">
                       <Filter size={14} className="text-gray-400" />
                       <span className="text-[0.7rem] font-black uppercase tracking-widest dark:text-white">
                         {sortBy === 'newest' && 'Newest First'}
                         {sortBy === 'oldest' && 'Oldest First'}
                         {sortBy === 'asc' && 'Name: A-Z'}
                         {sortBy === 'desc' && 'Name: Z-A'}
                         {sortBy === 'high-price' && 'Price: High to Low'}
                         {sortBy === 'low-price' && 'Price: Low to High'}
                         {sortBy === 'max-unit' && 'Stock: High to Low'}
                         {sortBy === 'min-unit' && 'Stock: Low to High'}
                       </span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-[60] animate-in slide-in-from-top-2 duration-200">
                      {[
                        { val: 'newest', label: 'Newest First' },
                        { val: 'oldest', label: 'Oldest First' },
                        { val: 'asc', label: 'Name: A-Z' },
                        { val: 'desc', label: 'Name: Z-A' },
                        { val: 'high-price', label: 'Price: High to Low' },
                        { val: 'low-price', label: 'Price: Low to High' },
                        { val: 'max-unit', label: 'Stock: High to Low' },
                        { val: 'min-unit', label: 'Stock: Low to High' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => { setSortBy(opt.val); setIsSortOpen(false); }}
                          className={`w-full text-left px-5 py-2.5 text-[0.7rem] font-bold transition-all relative group flex items-center ${sortBy === opt.val ? 'bg-gray-50 dark:bg-white/5 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`}
                        >
                          {sortBy === opt.val && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black dark:bg-white" />}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
               </div>

               <div ref={pageSizeRef} className="relative min-w-[120px]">
                  <button 
                    onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                    className="w-full flex items-center justify-between gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-sm transition-all hover:border-black dark:hover:border-white"
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-[0.6rem] font-black text-gray-400 uppercase">Show:</span>
                       <span className="text-[0.75rem] font-black dark:text-white">{pageSize}</span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPageSizeOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-[60] animate-in slide-in-from-top-2 duration-200">
                      {[10, 20, 30].map((size) => (
                        <button
                          key={size}
                          onClick={() => { setPageSize(size); setCurrentPage(1); setIsPageSizeOpen(false); }}
                          className={`w-full text-left px-5 py-2.5 text-[0.75rem] font-bold transition-all relative group flex items-center ${pageSize === size ? 'bg-gray-50 dark:bg-white/5 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`}
                        >
                          {pageSize === size && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black dark:bg-white" />}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
               </div>
            </div>

             <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
               <div className="relative flex-1">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Find products..."
                   value={searchTerm}
                   onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                   className="pl-9 pr-4 py-1.5 w-full md:w-64 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[0.8rem] font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                 />
               </div>
               <button
                  onClick={handleCreate}
                  className="px-4 py-2 md:py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                <Plus size={14} strokeWidth={3} /> New Product
              </button>
             </div>
          </div>


          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/30">
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Product</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Category</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Collection</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Price</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Inventory</th>
                  <th className="px-6 py-4 w-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
                    </td>
                  </tr>
                ) : displayProducts.length > 0 ? (
                  displayProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-50/80 dark:hover:bg-white/2 transition-colors group cursor-pointer text-xs font-bold"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-14 bg-gray-100 dark:bg-white/5 rounded-md overflow-hidden shadow-sm">
                            {(product.thumbnailUrl || product.images?.[0]) && (
                              <img src={product.thumbnailUrl || product.images[0]} className="w-full h-full object-cover" alt="" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{product.name}</p>
                            <p className="text-[0.6rem] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">{product.subtitle || 'No Subtitle'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {product.categories?.length > 0 ? (
                          <>
                            {product.categories[0].name}
                            {product.categories.length > 1 && (
                              <span className="ml-1 text-emerald-500">+{product.categories.length - 1}</span>
                            )}
                          </>
                        ) : 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[0.6rem] font-black text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded uppercase tracking-widest">
                          {product.collections?.length > 0 ? (
                            <>
                              {product.collections[0].name}
                              {product.collections.length > 1 && (
                                <span className="ml-1 opacity-70">+{product.collections.length - 1}</span>
                              )}
                            </>
                          ) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {product.discountPrice > 0 && (
                            <span className="text-[0.6rem] text-gray-400 dark:text-gray-600 line-through">₹{parseFloat(product.price || 0) + parseFloat(product.discountPrice || 0)}</span>
                          )}
                          <span className="text-sm font-black text-gray-900 dark:text-white">₹{product.price}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${(product.inventory || product.stock) > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          <span className="text-[0.65rem] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{(product.inventory || product.stock || 0)} units</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-32 text-center">
                       <Tag size={48} className="mx-auto text-gray-200 dark:text-white/10 mb-4" strokeWidth={1} />
                       <div className="space-y-1">
                         <p className="text-[0.7rem] text-gray-900 dark:text-white font-black uppercase tracking-widest">No products found</p>
                         <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-tight">Add your first product to start selling</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/30 dark:bg-white/2">
            <p className="text-[0.6rem] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest">
              Showing {Math.min(filteredProducts.length, displayProducts.length)} of {filteredProducts.length} results
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-[0.65rem] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg font-black text-gray-600 dark:text-gray-400 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-[0.65rem] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg font-black text-gray-600 dark:text-gray-400 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </main>

      {showModal && (
        <ProductForm 
          product={selectedProduct} 
          onClose={() => setShowModal(false)} 
          onSave={fetchProducts} 
        />
      )}
    </div>
  );
};

export default Products;
