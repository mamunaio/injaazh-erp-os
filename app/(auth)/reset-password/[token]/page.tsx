'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, Command, Eye, EyeOff, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { resetPassword } from '@/app/actions/authActions';
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
    if (password.length === 0) return 'bg-[#232734]';
    if (strength <= 1) return 'bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]';
    if (strength === 2) return 'bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.4)]';
    if (strength === 3) return 'bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.4)]';
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
    <div className="relative min-h-screen flex bg-[#09090B] overflow-hidden font-sans text-slate-200 selection:bg-[#2563EB]/30">
      
      {/* LEFT SIDE - Brand & Atmosphere (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-[#232734] overflow-hidden">
        {/* Breathing Abstract Glow */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, rgba(124,58,237,0.15) 50%, rgba(9,9,11,0) 70%)'
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
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#11131A] to-[#09090B] border border-[#232734] flex items-center justify-center shadow-lg">
            <Command className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-xl font-bold font-jakarta tracking-tight text-white">INJAAZH</span>
        </motion.div>

        {/* Center Security Context */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 max-w-md"
        >
          <div className="w-16 h-16 rounded-[20px] bg-[#11131A] border border-[#232734] flex items-center justify-center shadow-lg mb-8 relative">
             <div className="absolute -inset-1 bg-[#2563EB]/20 blur-md rounded-[20px]" />
             <KeyRound className="w-8 h-8 text-[#2563EB] relative z-10" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-5xl font-bold font-jakarta text-white mb-6 leading-tight tracking-tight">
            Set your new password.
          </h1>
          <p className="text-lg text-[#94A3B8] font-medium leading-relaxed">
            Choose a strong password to maintain enterprise-grade security across your workspaces.
          </p>
        </motion.div>

        {/* Bottom Abstract Graphic / Placeholder */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Enterprise-grade encryption and privacy</span>
        </div>
      </div>

      {/* RIGHT SIDE - Reset Context */}
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
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#11131A] to-[#09090B] border border-[#232734] flex items-center justify-center shadow-lg">
              <Command className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <span className="text-2xl font-bold font-jakarta tracking-tight text-white">INJAAZH</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 font-jakarta tracking-tight">
              Reset Password
            </h2>
            <p className="text-sm text-[#94A3B8] font-medium">
              Please enter your new strong password below.
            </p>
          </div>

          <div className="bg-[#11131A] border border-[#232734] p-6 sm:p-8 rounded-[24px] shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94A3B8] ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#09090B] border border-[#232734] rounded-xl pl-11 pr-12 py-3.5 text-sm text-white font-medium placeholder:text-[#232734] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-inner"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength Meter */}
                <div className="flex gap-1 pt-1 px-1">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 w-full rounded-full transition-all duration-300 ${
                        password.length > 0 && i < strength ? getStrengthColor() : 'bg-[#232734]'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94A3B8] ml-1">Confirm New Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#09090B] border border-[#232734] rounded-xl pl-11 pr-12 py-3.5 text-sm text-white font-medium placeholder:text-[#232734] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-inner"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90 disabled:opacity-50 disabled:hover:bg-[#2563EB] text-white font-semibold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#11131A] mt-2"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center flex flex-col items-center gap-4">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white font-semibold transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] rounded-md px-2 py-1"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
            <p className="text-[10px] font-mono tracking-widest text-[#94A3B8]/40 uppercase mt-4">
              v2.0.0-beta
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
