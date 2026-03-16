import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Star, Trash2, MessageSquare, User, Calendar } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      alert('Error deleting review');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-[0.8rem]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Product Reviews</h1>
      </header>

      <main className="p-10 max-w-[95%] mx-auto space-y-6">
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
            <span className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Latest Feedback</span>
          </div>

          <div className="divide-y divide-gray-100 italic-none">
            {loading ? (
              <div className="p-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors group flex gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />
                          ))}
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{review.product?.name}</span>
                      </div>
                      <span className="text-[0.65rem] text-gray-400 font-medium flex items-center gap-1">
                        <Calendar size={12} /> {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">"{review.comment}"</p>

                    <div className="flex items-center gap-4 text-[0.7rem] pt-2">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">
                        <User size={12} className="text-gray-400" /> {review.userName}
                      </div>
                      <div className="text-gray-300 dark:text-white/10">•</div>
                      <div className="text-gray-400 dark:text-gray-500 font-medium lowercase italic">{review.userEmail}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all self-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-32 text-center text-gray-400 flex flex-col items-center gap-4">
                <MessageSquare size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">Currently don't have reviews</p>
                  <p className="text-[0.6rem] font-bold uppercase tracking-tight">Feedback from your customers will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reviews;
