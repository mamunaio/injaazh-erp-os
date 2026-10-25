'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  Layers,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  Cpu,
  Server
} from 'lucide-react';
import Link from 'next/link';
import { loginUser, loginAsDemoUser, verifyTwoFactorLogin } from '@/app/actions/authActions';
import { toast } from 'react-hot-toast';
import { notify } from '@/lib/notify';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useRouter } from 'next/navigation';

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
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#060608] overflow-hidden font-sans text-slate-900 dark:text-white selection:bg-[#6324FC]/30 selection:text-white">
      
      {/* Global Background Ambient Glow Meshes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] max-w-[800px] bg-gradient-to-br from-[#6324FC]/20 via-[#8B5CF6]/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] max-w-[700px] bg-gradient-to-tl from-[#00E5FF]/15 via-[#6324FC]/10 to-transparent blur-[150px] rounded-full" />
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* =========================================================================
          LEFT SIDE: Executive Command Showcase (Desktop / High-Res)
         ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 lg:p-16 overflow-hidden bg-gradient-to-br from-[#060608] via-[#090812] to-[#0d091d] border-r border-black/10 dark:border-white/10 z-10">
        
        {/* Subtle Background Circuit Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#6324FC_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07] pointer-events-none" />

        {/* Dynamic Breathing Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(99,36,252,0.3) 0%, rgba(0,0,0,0) 70%)'
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, 40, 0], y: [0, -40, 0], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] rounded-full blur-[130px] pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(0,229,255,0.2) 0%, rgba(0,0,0,0) 70%)'
          }}
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 30, 0], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* 1. Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6324FC] to-[#00E5FF] p-[1.5px] shadow-[0_0_20px_rgba(99,36,252,0.45)]">
              <div className="w-full h-full rounded-[14px] bg-[#0c0d14] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#00E5FF]" strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <span className="text-xl font-heading font-black tracking-tight text-white block">
                INJAAZH
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#00E5FF] uppercase font-bold block -mt-0.5">
                BUSINESS OS v2.4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
              System Online
            </span>
          </div>
        </motion.div>

        {/* 2. Centerpiece: Dynamic 3D Floating KPI Widget & Narrative */}
        <div className="relative z-20 my-auto py-8">
          
          <AnimatePresence mode="wait">
            {!requires2FA ? (
              <motion.div
                key="hero-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7 }}
                className="max-w-lg mb-8"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 backdrop-blur-md mb-4 shadow-inner">
                  <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Single-Tenant Enterprise Node</span>
                </div>
                <h1 className="text-4xl xl:text-5xl font-heading font-black text-white leading-[1.12] tracking-tight">
                  Command your entire enterprise with{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6324FC] via-[#a855f7] to-[#00E5FF]">
                    precision &amp; velocity.
                  </span>
                </h1>
                <p className="mt-4 text-sm xl:text-base text-slate-400 font-medium leading-relaxed">
                  Seamlessly orchestrate campaigns, monitor real-time cash flow, track active projects, and automate outreach pipelines in one unified command center.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="hero-2fa"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7 }}
                className="max-w-lg mb-8"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6324FC]/30 to-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.3)] mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#00E5FF]" />
                </div>
                <h1 className="text-4xl xl:text-5xl font-heading font-black text-white leading-tight tracking-tight">
                  Cryptographic Two-Factor Verification
                </h1>
                <p className="mt-4 text-sm xl:text-base text-slate-400 font-medium leading-relaxed">
                  Your session is safeguarded with multi-layered biometric and time-based cryptographic key rotation. Enter your 6-digit authenticator token to proceed.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Floating Interactive Metrics Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            whileHover={{ rotateY: -3, rotateX: 3, y: -4 }}
            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
            className="w-full max-w-md rounded-3xl bg-white/[0.04] dark:bg-black/40 border border-white/10 backdrop-blur-2xl p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden group transition-all duration-300"
          >
            {/* Top Card Neon Strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6324FC]/20 border border-[#6324FC]/40 flex items-center justify-center text-[#00E5FF]">
                  <Activity size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Live Enterprise Pipeline</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Real-time aggregate run rate</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <TrendingUp size={12} />
                +34.2% MoM
              </span>
            </div>

            <div className="space-y-1 mb-5">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-semibold">Active ARR Projection</span>
              <p className="text-3xl font-heading font-black font-mono tracking-tight text-white flex items-baseline gap-2">
                $148,250.00
                <span className="text-xs font-normal text-slate-400 font-sans">USD</span>
              </p>
            </div>

            {/* Micro Graphic Velocity Bars */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Monthly Growth Target</span>
                <span className="text-white font-bold">88.4% Achieved</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '88.4%' }}
                  transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#6324FC] via-[#9061F9] to-[#00E5FF] shadow-[0_0_12px_#00E5FF]"
                />
              </div>
            </div>

            {/* Floating Mini Pill Accent */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Server size={13} className="text-[#00E5FF]" />
                Private MongoDB Atlas Cluster
              </span>
              <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                <CheckCircle2 size={13} />
                0ms Latency
              </span>
            </div>
          </motion.div>
        </div>

        {/* 3. Bottom Trust & Security Banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative z-20 flex items-center justify-between pt-6 border-t border-white/10 text-xs text-slate-400"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
            <span>Zero-Knowledge AES-256 Cloud Encryption</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Node ID: INJ-OS-PROD
          </span>
        </motion.div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: Ultra-Glassmorphic Luxury Login Card
         ========================================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[430px] relative"
        >
          
          {/* Mobile Branded Header (Visible on sm/md) */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6324FC] to-[#00E5FF] p-[1.5px] shadow-[0_0_25px_rgba(99,36,252,0.4)] mb-3">
              <div className="w-full h-full rounded-[14px] bg-[#0c0d14] flex items-center justify-center">
                <Layers className="w-6 h-6 text-[#00E5FF]" strokeWidth={2.2} />
              </div>
            </div>
            <h2 className="text-2xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
              INJAAZH GLOBAL
            </h2>
            <p className="text-xs font-mono text-[#6324FC] dark:text-[#00E5FF] tracking-widest font-bold uppercase mt-0.5">
              Enterprise Business OS
            </p>
          </div>

          {/* Master Glassmorphic Auth Card */}
          <div className="bg-white/80 dark:bg-[#0c0d14]/85 border border-black/10 dark:border-white/10 p-7 sm:p-9 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl relative overflow-hidden transition-all duration-300 hover:border-black/20 dark:hover:border-white/20">
            
            {/* Top Neon Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-[#00E5FF] shadow-[0_0_12px_#6324FC]" />

            {/* Form Title & Subtitle */}
            <div className="mb-6 relative z-10">
              <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                {requires2FA ? 'Two-Factor Challenge' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {requires2FA
                  ? 'Enter the 6-digit security token generated by your authenticator app.'
                  : 'Enter your credentials to access your executive workspace.'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {requires2FA ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between gap-2 sm:gap-2.5">
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
                        className="w-10 h-12 sm:w-12 sm:h-12 text-center text-lg font-mono font-black bg-slate-50 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] focus:ring-2 focus:ring-[#6324FC]/20 transition-all shadow-inner"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        name="rememberMe" 
                        defaultChecked 
                        className="w-4 h-4 rounded border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black/60 text-[#6324FC] focus:ring-[#6324FC] transition-colors" 
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Trust this device for 30 days
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      className="text-xs font-heading font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                    >
                      Use recovery key
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0}
                      className={`text-xs font-heading font-bold transition-colors ${
                        resendTimer > 0
                          ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : 'text-[#6324FC] dark:text-[#00E5FF] hover:underline'
                      }`}
                    >
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-heading font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase ml-0.5">
                        Enterprise Email
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6324FC] dark:group-focus-within:text-[#00E5FF] transition-colors" size={16} />
                        <input 
                          type="email" 
                          name="email"
                          required
                          autoComplete="email"
                          placeholder="name@company.com"
                          className="w-full bg-slate-50/80 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#6324FC] focus:ring-2 focus:ring-[#6324FC]/20 dark:focus:border-[#00E5FF] transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-0.5">
                        <label className="text-[11px] font-heading font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                          Password
                        </label>
                        <Link 
                          href="/forgot-password" 
                          className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6324FC] dark:group-focus-within:text-[#00E5FF] transition-colors" size={16} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="password"
                          required
                          autoComplete="current-password"
                          placeholder="••••••••••••"
                          className="w-full bg-slate-50/80 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#6324FC] focus:ring-2 focus:ring-[#6324FC]/20 dark:focus:border-[#00E5FF] transition-all shadow-inner"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <input 
                        type="checkbox" 
                        name="rememberMe" 
                        defaultChecked 
                        className="w-4 h-4 rounded border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black/60 text-[#6324FC] focus:ring-[#6324FC] transition-colors" 
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Remember this session
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Primary Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-[#6324FC] via-[#7B39FD] to-[#00E5FF] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-heading font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(99,36,252,0.45)] focus:outline-none focus:ring-2 focus:ring-[#6324FC]/50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{requires2FA ? 'Verify Credentials' : 'Sign In to Workspace'}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Instant 1-Click Demo Access Section */}
            {!requires2FA && (
              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 space-y-2.5">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading || isDemoLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#6324FC]/10 to-[#00E5FF]/10 hover:from-amber-500/20 hover:to-[#00E5FF]/20 border border-amber-500/30 dark:border-amber-400/30 text-xs font-heading font-bold text-amber-700 dark:text-amber-300 transition-all shadow-xs hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] focus:outline-none disabled:opacity-50"
                >
                  {isDemoLoading ? (
                    <Loader2 size={14} className="animate-spin text-amber-500" />
                  ) : (
                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                  )}
                  <span>⚡ 1-Click Instant Demo Login (Read-Only)</span>
                </button>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono px-1">
                  <span>User: <strong className="text-slate-800 dark:text-slate-200">demo@injaazh.com</strong></span>
                  <span>Pass: <strong className="text-slate-800 dark:text-slate-200">demo123456</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Registration Redirect Link */}
          <div className="mt-6 text-center">
            {!requires2FA && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Don&apos;t have an executive workspace?{' '}
                <Link 
                  href="/register" 
                  className="font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline transition-colors ml-1"
                >
                  Register Account &rarr;
                </Link>
              </p>
            )}
          </div>

        </motion.div>
      </div>

    </div>
  );
}
