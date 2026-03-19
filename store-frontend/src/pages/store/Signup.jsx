import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User as UserIcon, Chrome } from 'lucide-react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';


const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/customer/signup', formData);
      navigate('/login');

    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/customer/google-login', { credential: response.credential });
      localStorage.setItem('customerToken', res.data.token);
      localStorage.setItem('customer', JSON.stringify(res.data.customer));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-10"
      >
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black uppercase tracking-tighter">Join Vogue</h1>
          <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">Create your premium experience</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[0.7rem] font-bold text-center border border-red-100 uppercase tracking-tighter">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Become a Member'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[0.6rem] uppercase tracking-widest font-black"><span className="bg-white px-4 text-gray-300">or sign up with</span></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
            theme="outline"
            size="large"
            shape="pill"
          />
        </div>
        <p className="text-center text-[0.65rem] font-bold text-gray-400 uppercase tracking-tight">
          Already a member? <Link to="/login" className="text-black underline underline-offset-4 decoration-2">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
