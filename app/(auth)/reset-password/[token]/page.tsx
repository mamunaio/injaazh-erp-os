'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { resetPassword } from '@/app/actions/authActions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

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
    if (password.length === 0) return 'bg-white/10';
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] py-12">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none" />
      
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
              Set New Password
            </h1>
            <p className="text-slate-400 font-medium">
              Please enter your new strong password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                <input 
                  type="password" 
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>

              {/* Password Strength Indicator */}
              <div className="flex gap-1 mt-2 px-1">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 w-full rounded-full transition-colors duration-300 ${
                      password.length > 0 && i < strength ? getStrengthColor() : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>

              <div className="relative group pt-2">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  placeholder="Confirm New Password"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-[1px] mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl group-hover:bg-black/20 transition-all">
                <span className="text-white font-bold text-lg">
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </span>
                {!isLoading && <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />}
              </div>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
