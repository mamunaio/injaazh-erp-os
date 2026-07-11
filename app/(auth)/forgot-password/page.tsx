'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Loader2, Command, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/authActions';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);
    
    setIsLoading(false);
    
    if (result.success) {
      setIsSent(true);
      toast.success(result.message || 'Reset link sent!');
    } else {
      toast.error(result.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="relative min-h-screen flex bg-[#09090B] overflow-hidden font-sans text-slate-200 selection:bg-[#2563EB]/30">
      
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

        {/* Glassmorphic Floating Element */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hidden xl:block"
          style={{ transform: 'perspective(1000px) rotateY(-15deg) rotateX(10deg)' }}
        >
          <div className="p-6 h-full flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Command className="text-violet-400" size={24} />
            </div>
            <div className="space-y-2 mt-auto">
              <div className="h-2 w-full bg-white/10 rounded-full"></div>
              <div className="h-2 w-3/4 bg-white/10 rounded-full"></div>
              <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
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
          <div className="w-16 h-16 rounded-[20px] bg-[#11131A] border border-[#232734] flex items-center justify-center shadow-lg mb-4">
             <ShieldCheck className="w-8 h-8 text-[#2563EB]" strokeWidth={1.5} />
          </div>
          <div className="inline-flex items-center gap-2 mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-emerald-400">Enterprise-grade encryption and privacy</span>
          </div>
          
          <h1 className="text-5xl font-bold font-jakarta text-white mb-6 leading-tight tracking-tight">
            Secure your workspace.
          </h1>
          <p className="text-lg text-[#94A3B8] font-medium leading-relaxed">
            Fast, secure, and hassle-free password recovery. Regain access to your enterprise operating system securely.
          </p>
        </motion.div>

        {/* Bottom Abstract Graphic / Placeholder */}
        <div className="relative z-10 flex items-center gap-2">
        </div>
      </div>

      {/* RIGHT SIDE - Recovery Context */}
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

          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[24px] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <div className="mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2 font-jakarta tracking-tight">
                Forgot Password
              </h2>
              <p className="text-sm text-[#94A3B8] font-medium">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="relative z-10">
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#94A3B8] ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="name@company.com"
                      className="w-full bg-white/5 backdrop-blur-md border border-slate-700/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90 disabled:opacity-50 disabled:hover:bg-[#2563EB] text-white font-semibold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#11131A]"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-8 text-center shadow-inner relative overflow-hidden"
              >
                {/* Success Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-[#10B981]/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="w-16 h-16 bg-[#11131A] border border-[#232734] rounded-[16px] flex items-center justify-center mx-auto mb-6 relative">
                  <div className="absolute -inset-1 bg-[#10B981]/20 blur-md rounded-[16px]" />
                  <CheckCircle2 className="text-[#10B981] relative z-10" size={32} strokeWidth={2} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 font-jakarta tracking-tight">Check your email</h3>
                <p className="text-[#94A3B8] text-sm mb-4 leading-relaxed font-medium">
                  If an account exists for that email, we have sent password reset instructions.
                </p>
                <div className="p-3 bg-[#11131A] border border-[#232734] rounded-xl inline-block">
                  <p className="text-[#2563EB] text-[11px] font-bold tracking-wide">
                    (Check terminal console for the mock link!)
                  </p>
                </div>
              </motion.div>
            )}
            </div>
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
