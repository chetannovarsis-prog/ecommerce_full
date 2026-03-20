import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User as UserIcon, LogIn, Chrome } from 'lucide-react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/customer/login', { email, password });
      localStorage.setItem('customerToken', res.data.token);

      localStorage.setItem('customer', JSON.stringify(res.data.customer));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Google login failed';
      setError(`Google login failed: ${message}`);
      console.error('Google login error (frontend):', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-10"
      >
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black uppercase tracking-tighter">Sign In</h1>
          <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">Welcome back to Vogue</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[0.7rem] font-bold text-center border border-red-100 uppercase tracking-tighter">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <Link to="/forgot-password" title="Forgot Password" className="text-[0.65rem] text-gray-400 font-black uppercase tracking-tighter hover:text-black transition-colors">Forgot Password?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Secure Login'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[0.6rem] uppercase tracking-widest font-black"><span className="bg-white px-4 text-gray-300">or continue with</span></div>
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
          Don't have an account? <Link to="/signup" className="text-black underline underline-offset-4 decoration-2">Create profile</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

