'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Command, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { loginUser, loginAsDemoUser, verifyTwoFactorLogin } from '@/app/actions/authActions';
import { toast } from 'react-hot-toast';
import { notify } from '@/lib/notify';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

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
  const [isDemoLoading, setIsDemoLoading] = useState(false);
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
        notify.login(result.message || 'Login successful');
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
      notify.login(result.message || 'Welcome back!');
      router.push('/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const result = await loginAsDemoUser();
      if (result.success) {
        notify.login(result.message || 'Signed in as Demo Viewer');
        router.push('/dashboard');
      } else {
        toast.error(result.message || 'Demo login failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to login as demo user');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#060608] overflow-hidden font-sans text-slate-900 dark:text-white selection:bg-[#6324FC]/30">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100]">
        <ThemeToggle />
      </div>

      {/* LEFT SIDE - Brand & Atmosphere (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#060608] to-[#0d091a]">
        {/* Breathing Abstract Glow & Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(99,36,252,0.35) 0%, rgba(0,0,0,0) 70%)'
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -50, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(0,229,255,0.2) 0%, rgba(0,0,0,0) 70%)'
          }}
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 40, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Mini Dashboard Widget / Glassmorphic Floating Element */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 w-72 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hidden xl:block overflow-hidden"
          style={{ transform: 'perspective(1000px) rotateY(-15deg) rotateX(10deg)' }}
        >
          <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                <Command size={20} />
              </div>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">+24%</span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Revenue</p>
              <h3 className="text-white text-2xl font-heading font-extrabold font-mono">$128,450.00</h3>
            </div>
            <div className="flex items-end gap-2 h-12 mt-auto">
              {[40, 70, 45, 90, 65, 100].map((height, i) => (
                <div key={i} className="flex-1 bg-[#6324FC]/40 rounded-t-sm hover:bg-[#6324FC] transition-colors cursor-pointer" style={{ height: `${height}%` }}></div>
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
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-lg">
            <Command className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-xl font-heading font-extrabold tracking-tight text-white">INJAAZH</span>
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
                <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-4 leading-tight tracking-tight">
                  Streamline your enterprise.
                </h1>
                <p className="text-base text-slate-400 font-medium leading-relaxed">
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
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg mb-6 relative">
                   <div className="absolute -inset-1 bg-[#6324FC]/20 blur-md rounded-2xl" />
                   <ShieldCheck className="w-8 h-8 text-[#00E5FF] relative z-10" strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-4 leading-tight tracking-tight">
                  Two-Factor Authentication
                </h1>
                <p className="text-base text-slate-400 font-medium leading-relaxed">
                  We require two-factor authentication to ensure the utmost security of your enterprise data.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Abstract Graphic */}
        <div className="relative z-10 flex items-center gap-2">
          {!requires2FA ? (
            <>
              <div className="flex -space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-[#060608] flex items-center justify-center text-xs font-heading font-bold text-white shadow-lg">JD</div>
                <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-[#060608] flex items-center justify-center text-xs font-heading font-bold text-[#00E5FF] shadow-lg">AK</div>
                <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-[#060608] flex items-center justify-center text-xs font-heading font-bold text-[#10B981] shadow-lg">SM</div>
              </div>
              <span className="text-xs font-heading font-bold text-slate-400 ml-3">Join 10,000+ professionals</span>
            </>
          ) : (
            <span className="text-xs font-heading font-bold text-slate-400">Enterprise-grade encryption and privacy</span>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - Login Context */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Logo Fallback */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex items-center justify-center shadow-lg">
              <Command className="w-5 h-5 text-[#6324FC] dark:text-[#00E5FF]" strokeWidth={2} />
            </div>
            <span className="text-xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">INJAAZH</span>
          </div>

          <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="mb-6 relative z-10">
              <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">
                {requires2FA ? 'Verify Your Identity' : 'Welcome back'}
              </h2>
              <p className="text-xs text-secondary font-medium">
                {requires2FA ? 'Enter the 6-digit code from your authenticator app.' : 'Please enter your details to sign in.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {requires2FA ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
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
                        className="w-10 h-12 sm:w-12 sm:h-12 text-center text-lg font-mono font-extrabold bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-all"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" name="rememberMe" defaultChecked className="w-4 h-4 rounded border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#060608] text-[#6324FC] focus:ring-[#6324FC] transition-colors" />
                      <span className="text-xs font-medium text-secondary group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Trust this device for 30 days</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                    <button
                      type="button"
                      className="text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                    >
                      Use recovery code
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0}
                      className={`text-xs font-heading font-bold transition-colors ${resendTimer > 0 ? 'text-secondary cursor-not-allowed' : 'text-[#6324FC] dark:text-[#00E5FF] hover:underline'}`}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" size={15} />
                        <input 
                          type="email" 
                          name="email"
                          required
                          placeholder="name@company.com"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium placeholder:text-secondary focus:outline-none focus:border-[#6324FC] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" size={15} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="password"
                          required
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white font-medium placeholder:text-secondary focus:outline-none focus:border-[#6324FC] transition-all"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" name="rememberMe" defaultChecked className="w-3.5 h-3.5 rounded border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#060608] text-[#6324FC] focus:ring-[#6324FC] transition-colors" />
                      <span className="text-xs font-medium text-secondary group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-heading font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,36,252,0.35)] focus:outline-none"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {requires2FA ? 'Verify Identity' : 'Sign In'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {!requires2FA && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
                  <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Or continue with</span>
                  <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 relative z-10">
                  <button type="button" className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#060608] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 py-2.5 rounded-xl transition-all focus:outline-none">
                    <GoogleIcon />
                    <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">Google</span>
                  </button>
                  <button type="button" className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#060608] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 py-2.5 rounded-xl transition-all focus:outline-none">
                    <MicrosoftIcon />
                    <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">Microsoft</span>
                  </button>
                </div>

                {/* Instant 1-Click Demo Access */}
                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={isLoading || isDemoLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-[#6324FC]/10 hover:from-amber-500/20 hover:to-[#6324FC]/20 border border-amber-500/30 text-xs font-heading font-bold text-amber-600 dark:text-amber-400 transition-all shadow-xs hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] focus:outline-none disabled:opacity-50"
                  >
                    {isDemoLoading ? (
                      <Loader2 size={14} className="animate-spin text-amber-500" />
                    ) : (
                      <Sparkles size={14} className="text-amber-500 animate-pulse" />
                    )}
                    <span>⚡ Quick Demo Account (Read-Only)</span>
                  </button>
                  <div className="flex items-center justify-between text-[10px] text-secondary font-mono mt-2 px-1">
                    <span>Email: <strong className="text-slate-700 dark:text-slate-300">demo@injaazh.com</strong></span>
                    <span>Pass: <strong className="text-slate-700 dark:text-slate-300">demo123456</strong></span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 text-center flex flex-col items-center gap-2">
            {!requires2FA && (
              <p className="text-xs text-secondary font-medium">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline">
                  Create account
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
