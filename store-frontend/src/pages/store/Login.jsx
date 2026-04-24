import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [mode, setMode] = useState('email'); // 'email' | 'mobile'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('mobile'); // 'mobile' | 'otp'

  const [resendSeconds, setResendSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const persistCustomerSession = (data) => {
    localStorage.setItem('customerToken', data.token);
    localStorage.setItem('customer', JSON.stringify({ ...data.customer, token: data.token }));
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const interval = setInterval(() => {
      setResendSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendSeconds]);

  const normalizeMobileDigits = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
  const isValidMobile = (digits) => /^[6-9]\d{9}$/.test(digits);

  const resetMobileFlow = () => {
    setOtpStep('mobile');
    setOtp('');
    setResendSeconds(0);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError('');
    setLoading(false);
    resetMobileFlow();
    setShowPassword(false);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/email-login', { email, password });
      persistCustomerSession(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e, resend = false) => {
    e?.preventDefault?.();
    setLoading(true);
    setError('');

    try {
      const digits = normalizeMobileDigits(mobile);
      if (!isValidMobile(digits)) {
        setLoading(false);
        return setError('Enter a valid 10-digit mobile number');
      }

      const res = await api.post('/auth/send-otp', { mobile: digits, resend });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to send OTP');
      }

      setMobile(digits);
      setOtp('');
      setOtpStep('otp');
      setResendSeconds(30);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setError('');

    try {
      const digits = normalizeMobileDigits(mobile);
      if (!isValidMobile(digits)) {
        setLoading(false);
        return setError('Enter a valid 10-digit mobile number');
      }
      if (!/^\d{4}$/.test(otp)) {
        setLoading(false);
        return setError('Enter the 4-digit OTP');
      }

      const res = await api.post('/auth/verify-otp', { mobile: digits, otp });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'OTP verification failed');
      }

      persistCustomerSession(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || loading) return;
    await handleSendOtp(null, true);
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/customer/google-login', { credential: response.credential });
      persistCustomerSession(res.data);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Google login failed';
      setError(`Google login failed: ${msg}`);
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
          <h1 className="md:text-5xl text-3xl font-black uppercase tracking-tighter">Sign In</h1>
          <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-[3px]">Welcome Back</p>
        </div>

        <div className="flex justify-center gap-3">
          {/* <button
            type="button"
            onClick={() => handleModeChange('email')}
            className={`px-4 py-2 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] transition-all border ${
              mode === 'email' ? 'bg-black text-white border-black' : 'bg-white text-black border-black/20 hover:border-black/60'
            }`}
          >
            Email
          </button> */}
          {/* <button
            type="button"
            onClick={() => handleModeChange('mobile')}
            className={`px-4 py-2 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] transition-all border ${
              mode === 'mobile' ? 'bg-black text-white border-black' : 'bg-white text-black border-black/20 hover:border-black/60'
            }`}
          >
            Mobile
          </button> */}
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-[0.7rem] font-bold text-center border border-red-100 uppercase tracking-tighter">
            {error}
          </div>
        )}

        {mode === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-6">
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <Link
                to="/forgot-password"
                title="Forgot Password"
                className="text-[0.65rem] text-gray-400 font-black uppercase tracking-tighter hover:text-black transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Secure Login'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {otpStep === 'mobile' ? (
              <>
                <div className="space-y-4">
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Mobile Number"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                      value={mobile}
                      onChange={(e) => setMobile(normalizeMobileDigits(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSendOtp}
                  className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'} <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-tighter">
                      OTP sent to {mobile}
                    </p>
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="4-digit OTP"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                      value={otp}
                      onChange={(e) => setOtp(normalizeMobileDigits(e.target.value).slice(0, 4))}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center px-1 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setOtpStep('mobile');
                      setOtp('');
                      setResendSeconds(0);
                      setError('');
                    }}
                    className="text-[0.65rem] text-gray-400 font-black uppercase tracking-tighter hover:text-black transition-colors"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    disabled={loading || resendSeconds > 0}
                    onClick={handleResendOtp}
                    className="text-[0.65rem] text-black font-black uppercase tracking-tighter disabled:opacity-50 hover:underline underline-offset-4"
                  >
                    {resendSeconds > 0 ? `Resend OTP (${resendSeconds}s)` : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'} <ArrowRight size={18} />
                </button>
              </>
            )}
          </form>
        )}

        {/* <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[0.6rem] uppercase tracking-widest font-black"><span className="bg-white px-4 text-gray-300">or continue with</span></div>
        </div> */}

        {/* <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
            theme="outline"
            size="large"
            shape="pill"
          />
        </div> */}

        <p className="text-center text-[0.65rem] font-bold text-gray-400 uppercase tracking-tight">
          Don&apos;t have an account? <Link to="/signup" className="text-black underline underline-offset-4 decoration-2">Create profile</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
