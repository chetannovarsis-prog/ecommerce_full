import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowRight, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

const AuthTabs = () => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [signInMode, setSignInMode] = useState('email'); // 'email' | 'mobile'
  
  // Sign In States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInMobile, setSignInMobile] = useState('');
  const [signInOtp, setSignInOtp] = useState('');
  const [signInOtpStep, setSignInOtpStep] = useState('mobile');
  const [signInResendSeconds, setSignInResendSeconds] = useState(0);
  
  // Sign Up States
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '' });
  const [signUpShowPassword, setSignUpShowPassword] = useState(false);
  const [signUpOtp, setSignUpOtp] = useState('');
  const [signUpStep, setSignUpStep] = useState('details');
  const [signUpVerificationToken, setSignUpVerificationToken] = useState('');
  const [signUpPasswordError, setSignUpPasswordError] = useState('');
  
  // Common States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shakeTab, setShakeTab] = useState(''); // 'signin' | 'signup' - which tab to shake
  const shakeRef = useRef(null);
  
  const navigate = useNavigate();

  // Password validation
  const MIN_PASSWORD_LENGTH = 6;
  const PASSWORD_RULES = {
    uppercase: /[A-Z]/,
    number: /[0-9]/,
    special: /[^A-Za-z0-9]/
  };

  const getPasswordValidation = (password) => {
    const minLength = password.length >= MIN_PASSWORD_LENGTH;
    const uppercase = PASSWORD_RULES.uppercase.test(password);
    const number = PASSWORD_RULES.number.test(password);
    const special = PASSWORD_RULES.special.test(password);

    return {
      minLength,
      uppercase,
      number,
      special,
      isValid: minLength && uppercase && number && special,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include 1 uppercase letter, 1 number, and 1 special character.`
    };
  };

  const triggerShake = (tab) => {
    setShakeTab(tab);
    setTimeout(() => setShakeTab(''), 600);
  };

  const persistCustomerSession = (data) => {
    localStorage.setItem('customerToken', data.token);
    localStorage.setItem('customer', JSON.stringify({ ...data.customer, token: data.token }));
  };

  // ── Sign In Handlers ──
  const normalizeMobileDigits = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
  const isValidMobile = (digits) => /^[6-9]\d{9}$/.test(digits);

  const handleSignInEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/email-login', { email: signInEmail, password: signInPassword });
      persistCustomerSession(res.data);
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      triggerShake('signin');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSendOtp = async (e, resend = false) => {
    e?.preventDefault?.();
    setLoading(true);
    setError('');

    try {
      const digits = normalizeMobileDigits(signInMobile);
      if (!isValidMobile(digits)) {
        setLoading(false);
        setError('Enter a valid 10-digit mobile number');
        triggerShake('signin');
        return;
      }

      const res = await api.post('/auth/send-otp', { mobile: digits, resend });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to send OTP');
      }

      setSignInMobile(digits);
      setSignInOtp('');
      setSignInOtpStep('otp');
      setSignInResendSeconds(30);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
      triggerShake('signin');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInVerifyOtp = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setError('');

    try {
      const digits = normalizeMobileDigits(signInMobile);
      if (!isValidMobile(digits)) {
        setLoading(false);
        setError('Enter a valid 10-digit mobile number');
        triggerShake('signin');
        return;
      }
      if (!/^\d{4}$/.test(signInOtp)) {
        setLoading(false);
        setError('Enter the 4-digit OTP');
        triggerShake('signin');
        return;
      }

      const res = await api.post('/auth/verify-otp', { mobile: digits, otp: signInOtp });
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'OTP verification failed');
      }

      persistCustomerSession(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed');
      triggerShake('signin');
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up Handlers ──
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setSignUpPasswordError('');

    const passwordCheck = getPasswordValidation(signUpForm.password);
    if (!passwordCheck.isValid) {
      setSignUpPasswordError(passwordCheck.message);
      setLoading(false);
      triggerShake('signup');
      return;
    }

    try {
      const res = await api.post('/auth/customer/signup', signUpForm);
      setSignUpVerificationToken(res.data.verificationToken);
      setSignUpStep('otp');
      setMessage(res.data.message || 'OTP sent to your email.');
    } catch (err) {
      let errorMessage = err.response?.data?.message || 'Signup failed';
      if (errorMessage.toLowerCase().includes('email already registered') || 
          errorMessage.toLowerCase().includes('email already exists')) {
        errorMessage = 'This email already exists. Please Sign In';
        triggerShake('signup');
        // Switch to sign-in tab after a short delay so user can see the message
        setTimeout(() => setActiveTab('signin'), 1500);
      } else {
        triggerShake('signup');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/customer/signup/verify-otp', {
        otp: signUpOtp,
        verificationToken: signUpVerificationToken
      });
      persistCustomerSession(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
      triggerShake('signup');
    } finally {
      setLoading(false);
    }
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
      triggerShake(activeTab);
    } finally {
      setLoading(false);
    }
  };

  // Sign In resend timer
  useEffect(() => {
    if (signInResendSeconds <= 0) return;
    const interval = setInterval(() => {
      setSignInResendSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [signInResendSeconds]);

  const shakeAnimation = {
    animate: shakeTab === activeTab ? {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    } : {}
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-10"
      >
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <h1 className="md:text-5xl text-3xl font-bold">Ghar Of Ethnics</h1>
          <p className="text-sm text-gray-400 font-bold">Welcome</p>
        </div>

        {/* Tabs */}
        <div ref={shakeRef} className="flex gap-2">
          <motion.button
            animate={shakeAnimation.animate}
            onClick={() => {
              setActiveTab('signin');
              setError('');
              setMessage('');
            }}
            className={`flex-1 py-3 rounded-2xl text-[0.7rem] font-black uppercase tracking-[2px] transition-all border ${
              activeTab === 'signin'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-black/20 hover:border-black/60'
            }`}
          >
            Sign In
          </motion.button>
          <motion.button
            animate={shakeAnimation.animate}
            onClick={() => {
              setActiveTab('signup');
              setError('');
              setMessage('');
            }}
            className={`flex-1 py-3 rounded-2xl text-[0.7rem] font-black uppercase tracking-[2px] transition-all border ${
              activeTab === 'signup'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-black/20 hover:border-black/60'
            }`}
          >
            Sign Up
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 text-red-500 p-4 rounded-xl text-[0.7rem] font-bold text-center border border-red-100 tracking-tight uppercase"
          >
            {error}
          </motion.div>
        )}

        {/* Success Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-[0.7rem] font-bold text-center border border-emerald-100 uppercase tracking-widest"
          >
            {message}
          </motion.div>
        )}

        {/* Auth Forms Container */}
        <AnimatePresence mode="wait">
          {activeTab === 'signin' ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Email Sign In */}
              {signInMode === 'email' ? (
                <form onSubmit={handleSignInEmailLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
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
                /* Mobile Sign In */
                <form onSubmit={signInOtpStep === 'mobile' ? handleSignInSendOtp : handleSignInVerifyOtp} className="space-y-6">
                  {signInOtpStep === 'mobile' ? (
                    <>
                      <div className="space-y-4">
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Mobile Number"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                            value={signInMobile}
                            onChange={(e) => setSignInMobile(normalizeMobileDigits(e.target.value))}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
                      >
                        {loading ? 'Sending OTP...' : 'Send OTP'} <ArrowRight size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-tighter">
                          OTP sent to {signInMobile}
                        </p>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="4-digit OTP"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                            value={signInOtp}
                            onChange={(e) => setSignInOtp(normalizeMobileDigits(e.target.value).slice(0, 4))}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify OTP'} <ArrowRight size={18} />
                      </button>

                      <div className="flex justify-between items-center px-1 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSignInOtpStep('mobile');
                            setSignInOtp('');
                            setSignInResendSeconds(0);
                            setError('');
                          }}
                          className="text-[0.65rem] text-gray-400 font-black uppercase tracking-tighter hover:text-black transition-colors"
                        >
                          Change Number
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (signInResendSeconds === 0) {
                              await handleSignInSendOtp(null, true);
                            }
                          }}
                          disabled={signInResendSeconds > 0 || loading}
                          className={`text-[0.65rem] font-black uppercase tracking-tighter transition-colors ${
                            signInResendSeconds > 0
                              ? 'text-gray-300'
                              : 'text-gray-400 hover:text-black'
                          }`}
                        >
                          {signInResendSeconds > 0 ? `Resend in ${signInResendSeconds}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {signUpStep === 'details' ? (
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                        value={signUpForm.name}
                        onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                      <input
                        type={signUpShowPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                        value={signUpForm.password}
                        onChange={(e) => {
                          setSignUpForm({ ...signUpForm, password: e.target.value });
                          setSignUpPasswordError('');
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setSignUpShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                      >
                        {signUpShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {signUpPasswordError && (
                    <p className="text-[0.7rem] text-red-500 font-bold uppercase">{signUpPasswordError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUpVerifyOtp} className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-tighter">
                      OTP sent to {signUpForm.email}
                    </p>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-black transition-colors" size={18} />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit OTP"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-black transition-all focus:ring-4 focus:ring-black/5"
                        value={signUpOtp}
                        onChange={(e) => setSignUpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl text-[0.7rem] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'} <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSignUpStep('details');
                      setSignUpOtp('');
                      setError('');
                      setMessage('');
                    }}
                    className="w-full text-[0.7rem] text-gray-400 font-black uppercase tracking-widest hover:text-black transition-colors"
                  >
                    Back to Details
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthTabs;
