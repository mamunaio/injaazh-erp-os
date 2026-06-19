'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { loginUser, verifyTwoFactorLogin } from '@/app/actions/authActions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code2FA, setCode2FA] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (requires2FA) {
      if (code2FA.length !== 6) {
        toast.error('Please enter a valid 6-digit code');
        setIsLoading(false);
        return;
      }
      const result = await verifyTwoFactorLogin(tempToken, code2FA);
      setIsLoading(false);
      
      if (result.success) {
        toast.success(result.message || 'Login successful');
        router.push('/dashboard');
      } else {
        toast.error(result.message || 'Invalid 2FA code');
      }
      return;
    }

    const formData = new FormData(e.currentTarget);
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden neu-base-bg">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="neu-flat p-8 rounded-3xl">
          <div className="text-center mb-10">
            <h1 className="mb-2 text-slate-800 dark:text-white">
              {requires2FA ? 'Two-Factor Auth' : 'Welcome Back'}
            </h1>
            <p className="text-slate-500 font-medium">
              {requires2FA ? 'Enter the 6-digit code from your authenticator app' : 'Enter your credentials to access your workspace'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {requires2FA ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength={6}
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-[1em] font-mono py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="Email address"
                      className="w-full neu-pressed rounded-2xl pl-12 pr-4 py-4 text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                    <input 
                      type="password" 
                      name="password"
                      required
                      placeholder="Password"
                      className="w-full neu-pressed rounded-2xl pl-12 pr-4 py-4 text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-black/20 text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0 transition-colors" />
                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full relative neu-button flex items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all"
            >
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                {isLoading ? (requires2FA ? 'Verifying...' : 'Signing in...') : (requires2FA ? 'Verify Code' : 'Sign In')}
              </span>
              {!isLoading && <ArrowRight size={20} className="text-indigo-600 dark:text-indigo-400" />}
            </button>
          </form>

          <div className="mt-8 pt-6">
            <p className="text-center text-slate-500 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-bold transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
