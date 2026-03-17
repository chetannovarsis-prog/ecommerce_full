import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Trash2, Tag, Search, Filter } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await api.post('/categories', { name: newCategoryName });
      setCategories([...categories, res.data]);
      setNewCategoryName('');
    } catch (error) {
      alert('Error adding category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      alert('Error deleting category. It might be linked to products.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Categories</h1>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-8">

        {/* Add Category Form */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 leading-none">New Category Name</label>
              <input 
                type="text" 
                placeholder="e.g. Footwear, Outerwear" 
                className="w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black transition-all text-gray-900 dark:text-white"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="px-6 py-4 md:py-3 bg-black dark:bg-white dark:text-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 md:self-end"
            >
              <Plus size={16} strokeWidth={3} /> Add Category
            </button>
          </form>
        </div>


        {/* Categories List */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-bottom-10 duration-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Tag size={16} className="text-gray-400" />
               <span className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Active Categories</span>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/10">
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Slug</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Created</th>
                  <th className="px-6 py-3 w-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 italic-none">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <tr 
                      key={category.id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/categories/${category.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white decoration-black/20 decoration-2 underline-offset-4">{category.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[0.6rem] font-mono text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded">
                          /{category.name?.toLowerCase().replace(/ /g, '-') || 'category'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[0.65rem] text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(category.id);
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-32 text-center text-gray-400 flex flex-col items-center gap-4">
                      <Tag size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
                      <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">No categories found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Categories;
