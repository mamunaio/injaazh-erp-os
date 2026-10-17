'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Loader2, Command, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/authActions';
import ThemeToggle from '@/components/layout/ThemeToggle';
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
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#060608] overflow-hidden font-sans text-slate-900 dark:text-white selection:bg-[#6324FC]/30">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100]">
        <ThemeToggle />
      </div>

      {/* LEFT SIDE - Brand & Atmosphere */}
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
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg mb-4">
             <ShieldCheck className="w-7 h-7 text-[#00E5FF]" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-4 leading-tight tracking-tight">
            Secure your workspace.
          </h1>
          <p className="text-base text-slate-400 font-medium leading-relaxed">
            Fast, secure, and hassle-free password recovery. Regain access to your enterprise operating system securely.
          </p>
        </motion.div>

        {/* Bottom Tag */}
        <div className="relative z-10">
          <span className="text-xs font-heading font-bold text-slate-400">Enterprise-grade encryption and privacy</span>
        </div>
      </div>

      {/* RIGHT SIDE - Recovery Context */}
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
                Forgot Password
              </h2>
              <p className="text-xs text-secondary font-medium">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <div className="relative z-10">
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-heading font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,36,252,0.35)] focus:outline-none mt-2"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                  <CheckCircle2 className="text-emerald-500" size={24} strokeWidth={2} />
                </div>
                
                <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">Check your email</h3>
                <p className="text-secondary text-xs mb-4 leading-relaxed font-medium">
                  If an account exists for that email, we have sent password reset instructions.
                </p>
                <div className="p-2.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl inline-block">
                  <p className="text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-mono font-bold tracking-wide">
                    (Check terminal console for the mock link!)
                  </p>
                </div>
              </motion.div>
            )}
            </div>
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
