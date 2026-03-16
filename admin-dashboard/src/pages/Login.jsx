import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('admin@ansupal.com');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.requires2FA) {
        setRequires2FA(true);
      } else {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminEmail', res.data.email);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminEmail', res.data.email);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] antialiased font-sans">
      <div className="bg-white dark:bg-[#111] p-10 w-full max-w-sm border border-gray-200 dark:border-white/5 shadow-2xl rounded-2xl animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center rounded-2xl mx-auto mb-4 font-black text-2xl shadow-xl shadow-black/10">M</div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase italic">Medusa Admin</h1>
          <p className="text-gray-400 text-[0.6rem] mt-2 uppercase tracking-[0.2em] font-black leading-none">Management Console</p>
        </div>
        
        {!requires2FA ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 leading-none">Admin Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
                required 
              />
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl animate-in slide-in-from-top-2">
                <p className="text-red-600 dark:text-red-400 text-[0.7rem] font-bold text-center uppercase tracking-tight leading-none">{error}</p>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-gray-100 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center h-12"
            >
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black"></div> : 'Launch Dashboard'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4">
             <div className="space-y-1.5">
              <label className="block text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 leading-none text-center">Enter 6-digit OTP</label>
              <p className="text-[0.6rem] text-center text-gray-400 dark:text-gray-600 mb-2 font-bold uppercase">Sent to {email}</p>
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="000000"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-xl font-black text-center tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
                maxLength={6}
                required 
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-[0.7rem] font-bold text-center uppercase tracking-tight leading-none">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center h-12"
            >
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : 'Verify & Continue'}
            </button>

            <button 
              type="button"
              onClick={() => setRequires2FA(false)}
              className="w-full text-[0.65rem] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
          <p className="text-center text-[0.55rem] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest leading-none">
            Secure Session Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
