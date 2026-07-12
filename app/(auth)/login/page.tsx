'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Command, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { loginUser, verifyTwoFactorLogin } from '@/app/actions/authActions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
    <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
    <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
    <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  
  const [code2FA, setCode2FA] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (requires2FA && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [requires2FA, resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = code2FA.split('');
    newOtp[index] = value.slice(-1);
    const newCode = newOtp.join('');
    setCode2FA(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code2FA[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      setCode2FA(pastedData);
      const nextFocusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  const handleResendOTP = () => {
    if (resendTimer === 0) {
      setResendTimer(30);
      toast.success('A new code has been sent to your device.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const rememberMe = formData.get('rememberMe') === 'on';
    
    if (requires2FA) {
      if (code2FA.length !== 6) {
        toast.error('Please enter a valid 6-digit code');
        setIsLoading(false);
        return;
      }
      const result = await verifyTwoFactorLogin(tempToken, code2FA, rememberMe);
      setIsLoading(false);
      
      if (result.success) {
        toast.success(result.message || 'Login successful');
        router.push('/dashboard');
      } else {
        toast.error(result.message || 'Invalid 2FA code');
      }
      return;
    }

    const result = await loginUser(formData);
    
    setIsLoading(false);
    
    if (result.requires2FA) {
      setRequires2FA(true);
      setTempToken(result.tempToken);
      toast.success('Please enter your 2FA code');
      return;
    }
    
    if (result.success) {
      toast.success(result.message || 'Welcome back!');
      router.push('/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#09090B] overflow-hidden font-sans text-slate-800 dark:text-slate-200 selection:bg-[#2563EB]/30">
      
      {/* LEFT SIDE - Brand & Atmosphere (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#09090B] to-[#11131a]">
        {/* Breathing Abstract Glow & Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(9,9,11,0) 70%)'
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -50, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(9,9,11,0) 70%)'
          }}
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 40, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Mini Dashboard Widget / Glassmorphic Floating Element */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 w-72 bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hidden xl:block overflow-hidden"
          style={{ transform: 'perspective(1000px) rotateY(-15deg) rotateX(10deg)' }}
        >
          <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Command className="text-violet-400" size={20} />
              </div>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">+24%</span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Total Revenue</p>
              <h3 className="text-slate-900 dark:text-white text-2xl font-bold font-mono">$128,450.00</h3>
            </div>
            <div className="flex items-end gap-2 h-12 mt-auto">
              {[40, 70, 45, 90, 65, 100].map((height, i) => (
                <div key={i} className="flex-1 bg-violet-500/40 rounded-t-sm hover:bg-violet-400 transition-colors cursor-pointer" style={{ height: `${height}%` }}></div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Brand Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#11131A] to-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center shadow-lg">
            <Command className="w-5 h-5 text-slate-900 dark:text-white" strokeWidth={2} />
          </div>
          <span className="text-xl font-bold font-jakarta tracking-tight text-slate-900 dark:text-white">INJAAZH</span>
        </motion.div>

        {/* Center Dynamic Content */}
        <div className="relative z-10 max-w-md h-[200px]">
          <AnimatePresence mode="wait">
            {!requires2FA ? (
              <motion.div 
                key="login-content"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <h1 className="text-5xl font-bold font-jakarta text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                  Streamline your enterprise.
                </h1>
                <p className="text-lg text-[#94A3B8] font-medium leading-relaxed">
                  Log in to the Intelligent Business Operating System to manage campaigns, deals, and clients with unprecedented speed and precision.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="otp-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <div className="w-16 h-16 rounded-[20px] bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center shadow-lg mb-8 relative">
                   <div className="absolute -inset-1 bg-[#2563EB]/20 blur-md rounded-[20px]" />
                   <ShieldCheck className="w-8 h-8 text-[#2563EB] relative z-10" strokeWidth={1.5} />
                </div>
                <h1 className="text-5xl font-bold font-jakarta text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                  Two-Factor Authentication
                </h1>
                <p className="text-lg text-[#94A3B8] font-medium leading-relaxed">
                  We require two-factor authentication to ensure the utmost security of your enterprise data.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Abstract Graphic / Placeholder */}
        <div className="relative z-10 flex items-center gap-2">
          {!requires2FA ? (
            <>
              <div className="flex -space-x-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#11131A] border-2 border-[#09090B] flex items-center justify-center text-xs font-bold hover:z-10 hover:scale-110 transition-transform cursor-pointer relative shadow-lg">JD</div>
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#11131A] border-2 border-[#09090B] flex items-center justify-center text-xs font-bold text-[#2563EB] hover:z-10 hover:scale-110 transition-transform cursor-pointer relative shadow-lg">AK</div>
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#11131A] border-2 border-[#09090B] flex items-center justify-center text-xs font-bold text-[#10B981] hover:z-10 hover:scale-110 transition-transform cursor-pointer relative shadow-lg">SM</div>
              </div>
              <span className="text-sm font-semibold text-[#94A3B8] ml-4">Join 10,000+ professionals</span>
            </>
          ) : (
            <span className="text-xs font-semibold text-[#94A3B8]">Enterprise-grade encryption and privacy</span>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - Login Context */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Mobile background glow fallback */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#2563EB]/10 blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Logo Fallback */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#11131A] to-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center shadow-lg">
              <Command className="w-6 h-6 text-slate-900 dark:text-white" strokeWidth={2} />
            </div>
            <span className="text-2xl font-bold font-jakarta tracking-tight text-slate-900 dark:text-white">INJAAZH</span>
          </div>

          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-6 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <div className="mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta tracking-tight">
                {requires2FA ? 'Verify Your Identity' : 'Welcome back'}
              </h2>
              <p className="text-sm text-[#94A3B8] font-medium">
                {requires2FA ? 'Enter the 6-digit code from your authenticator app.' : 'Please enter your details to sign in.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {requires2FA ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={code2FA[index] || ''}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono bg-slate-50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/20 transition-all shadow-inner"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-0 focus:ring-offset-[#11131A] transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:hover:text-white transition-colors">Trust this device for 30 days</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                    <button
                      type="button"
                      className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                    >
                      Use a recovery code instead
                    </button>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">
                        No code?
                      </span>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0}
                        className={`text-sm font-bold transition-colors ${resendTimer > 0 ? 'text-slate-700 dark:text-slate-300 cursor-not-allowed' : 'text-[#2563EB] hover:text-[#2563EB]/80'}`}
                      >
                        {resendTimer > 0 ? (
                          <>Resend in <span className="text-[#2563EB]">{resendTimer}s</span></>
                        ) : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] ml-1">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                        <input 
                          type="email" 
                          name="email"
                          required
                          placeholder="name@company.com"
                          className="w-full bg-slate-50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] ml-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="password"
                          required
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/20 transition-all"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-0 focus:ring-offset-[#11131A] transition-colors" />
                      <span className="text-xs font-medium text-slate-600 dark:text-[#94A3B8] group-hover:text-slate-900 dark:hover:text-white transition-colors">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-[#2563EB] hover:bg-[#2563EB]/90 disabled:opacity-50 disabled:hover:bg-[#2563EB] text-white font-semibold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#11131A]"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {requires2FA ? 'Verify Identity' : 'Sign In'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {!requires2FA && (
              <>
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-[#232734]"></div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-widest">Or continue with</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-[#232734]"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button type="button" className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/20">
                    <GoogleIcon />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Google</span>
                  </button>
                  <button type="button" className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/20">
                    <MicrosoftIcon />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Microsoft</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 text-center flex flex-col items-center gap-4">
            {requires2FA ? (
              <button 
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setCode2FA('');
                  setTempToken('');
                }}
                className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-slate-900 dark:hover:text-white font-semibold transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] rounded-md px-2 py-1"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            ) : (
              <p className="text-slate-500 dark:text-[#94A3B8] text-sm font-medium">
                Don't have an account?{' '}
                <Link href="/register" className="text-slate-900 dark:text-white font-bold hover:text-[#2563EB] transition-colors">
                  Create one now
                </Link>
              </p>
            )}
            
            <p className="text-[10px] font-mono tracking-widest text-[#94A3B8]/40 uppercase mt-4">
              v2.0.0-beta
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
