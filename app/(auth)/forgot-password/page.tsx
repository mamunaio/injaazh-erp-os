'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] py-12">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="mb-2">
              Forgot Password
            </h1>
            <p className="text-slate-400 font-medium">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="Email address"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-[1px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl group-hover:bg-black/20 transition-all">
                  <span className="text-white font-bold text-lg">
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </span>
                  {!isLoading && <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />}
                </div>
              </button>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-500/30">
                <Mail className="text-violet-400" size={32} />
              </div>
              <h3 className="mb-2">Check your email</h3>
              <p className="text-slate-400 text-sm mb-6">
                If an account exists for that email, we have sent password reset instructions. (Check your terminal console for the mock link!)
              </p>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-violet-400 font-medium transition-colors">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
