'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/authActions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
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
    const result = await registerUser(formData);
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success(result.message || 'Registration successful!');
      router.push('/dashboard');
    } else {
      toast.error(result.message || 'Registration failed');
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
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 tracking-tight drop-shadow-sm mb-2">
              Create Account
            </h1>
            <p className="text-slate-400 font-medium">
              Join Injaazh ERP and streamline your workflow
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="Full Name"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>

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

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                <input 
                  type="password" 
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
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
                  placeholder="Confirm Password"
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
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </span>
                {!isLoading && <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-white font-bold hover:text-violet-400 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
