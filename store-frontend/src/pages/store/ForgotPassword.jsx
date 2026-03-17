import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import { motion } from 'framer-motion';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/customer/forgot-password', { email });
      setMessage('OTP sent to your email. Check your inbox.');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
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
          <h1 className="text-5xl font-black uppercase tracking-tighter">Reset</h1>
          <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">Verify your identity</p>
        </div>

        {message ? (
          <div className="bg-emerald-50 text-emerald-600 p-8 rounded-2xl text-center space-y-4 border border-emerald-100">
            <CheckCircle2 size={40} className="mx-auto" />
            <p className="text-sm font-bold uppercase tracking-tight">{message}</p>
            <Link to="/login" className="inline-block text-[0.65rem] font-black uppercase tracking-widest underline underline-offset-4">Return to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Registered Email" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-[0.65rem] font-bold uppercase tracking-tight ml-1">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
            </button>

            <div className="text-center">
              <Link to="/login" className="text-[0.65rem] text-gray-400 font-black uppercase tracking-widest hover:text-black transition-colors">Back to Sign In</Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
