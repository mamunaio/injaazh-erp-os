'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, Command, Eye, EyeOff, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { resetPassword } from '@/app/actions/authActions';
import ThemeToggle from '@/components/layout/ThemeToggle';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);
  
  const getStrengthColor = () => {
    if (password.length === 0) return 'bg-black/10 dark:bg-white/10';
    if (strength <= 1) return 'bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]';
    if (strength === 2) return 'bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.4)]';
    if (strength === 3) return 'bg-[#6324FC] shadow-[0_0_10px_rgba(99,36,252,0.4)]';
    return 'bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.4)]';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await resetPassword(formData, token);
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success(result.message || 'Password reset successful!');
      router.push('/login');
    } else {
      toast.error(result.message || 'Failed to reset password');
    }
  };

  return (
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#060608] overflow-hidden font-sans text-slate-900 dark:text-white selection:bg-[#6324FC]/30">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100]">
        <ThemeToggle />
      </div>

      {/* LEFT SIDE - Brand & Atmosphere */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#060608] to-[#0d091a]">
        {/* Breathing Abstract Glow */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(99,36,252,0.4) 0%, rgba(0,229,255,0.15) 50%, rgba(0,0,0,0) 70%)'
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

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

        {/* Center Security Context */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 max-w-md"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg mb-6 relative">
             <KeyRound className="w-7 h-7 text-[#00E5FF] relative z-10" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-4 leading-tight tracking-tight">
            Set your new password.
          </h1>
          <p className="text-base text-slate-400 font-medium leading-relaxed">
            Choose a strong password to maintain enterprise-grade security across your workspaces.
          </p>
        </motion.div>

        {/* Bottom Abstract Graphic / Placeholder */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-xs font-heading font-bold text-slate-400">Enterprise-grade encryption and privacy</span>
        </div>
      </div>

      {/* RIGHT SIDE - Reset Context */}
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

          <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs text-secondary font-medium">
                Please enter your new strong password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* New Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" size={15} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {/* Strength Meter */}
                <div className="flex gap-1 pt-1 px-1">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 w-full rounded-full transition-all duration-300 ${
                        password.length > 0 && i < strength ? getStrengthColor() : 'bg-black/5 dark:bg-white/5'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Confirm New Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" size={15} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white font-medium placeholder:text-secondary focus:outline-none focus:border-[#6324FC] transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-heading font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,36,252,0.35)] focus:outline-none mt-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center flex flex-col items-center gap-2">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 text-secondary hover:text-slate-900 dark:hover:text-white font-heading font-bold transition-colors text-xs"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
