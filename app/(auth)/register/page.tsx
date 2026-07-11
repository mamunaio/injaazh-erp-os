'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, Command, Building2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/authActions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

export default function RegisterPage() {
  const router = useRouter();
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

        {/* Center Welcome Message */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-5xl font-bold font-jakarta text-white mb-6 leading-tight tracking-tight">
            Start your journey.
          </h1>
          <p className="text-lg text-[#94A3B8] font-medium leading-relaxed">
            Create an account and deploy the world's most intelligent enterprise operating system for your team in minutes.
          </p>
          
          <ul className="mt-8 space-y-4">
            {['Enterprise grade security', 'Real-time pipeline analytics', 'AI-powered workflow automation'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-[#94A3B8] font-medium">
                <CheckCircle2 size={20} className="text-[#10B981]" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Bottom Abstract Graphic / Placeholder */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-xs font-semibold text-[#94A3B8]">Trusted by forward-thinking companies</span>
        </div>
      </div>

      {/* RIGHT SIDE - Registration Context */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        
        {/* Mobile background glow fallback */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#2563EB]/10 blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10 py-12"
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
              Create Your Account
            </h2>
            <p className="text-sm text-[#94A3B8] font-medium">
              Join Injaazh ERP and streamline your workflow today.
            </p>
          </div>

          <div className="bg-[#11131A] border border-[#232734] p-6 sm:p-8 rounded-[24px] shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94A3B8] ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type="text" 
                    name="name"
                    required
                    placeholder="John Doe"
                    className="w-full bg-[#09090B] border border-[#232734] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white font-medium placeholder:text-[#232734] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94A3B8] ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="name@company.com"
                    className="w-full bg-[#09090B] border border-[#232734] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white font-medium placeholder:text-[#232734] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94A3B8] ml-1">Company Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type="text" 
                    name="companyName"
                    placeholder="Acme Corp"
                    className="w-full bg-[#09090B] border border-[#232734] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white font-medium placeholder:text-[#232734] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94A3B8] ml-1">Password</label>
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94A3B8] ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" size={18} />
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

              {/* Accept Terms */}
              <div className="flex items-center gap-2 pt-2 pb-1">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input required type="checkbox" className="mt-0.5 w-4 h-4 rounded border-[#232734] bg-[#09090B] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-0 focus:ring-offset-[#11131A] transition-colors" />
                  <span className="text-xs font-medium text-[#94A3B8] group-hover:text-white transition-colors leading-relaxed">
                    I accept the <a href="#" className="text-[#2563EB] hover:underline">Terms of Service</a> and <a href="#" className="text-[#2563EB] hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#2563EB] hover:bg-[#2563EB]/90 disabled:opacity-50 disabled:hover:bg-[#2563EB] text-white font-semibold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#11131A]"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#232734]"></div>
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Or continue with</span>
              <div className="h-px flex-1 bg-[#232734]"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex items-center justify-center gap-2 bg-[#09090B] hover:bg-[#232734]/50 border border-[#232734] py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#232734] focus:ring-offset-2 focus:ring-offset-[#11131A]">
                <GoogleIcon />
                <span className="text-xs font-bold text-white">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 bg-[#09090B] hover:bg-[#232734]/50 border border-[#232734] py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#232734] focus:ring-offset-2 focus:ring-offset-[#11131A]">
                <MicrosoftIcon />
                <span className="text-xs font-bold text-white">Microsoft</span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center flex flex-col items-center gap-4">
            <p className="text-[#94A3B8] text-sm font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-white font-bold hover:text-[#2563EB] transition-colors">
                Sign in here
              </Link>
            </p>
            <p className="text-[10px] font-mono tracking-widest text-[#94A3B8]/40 uppercase">
              v2.0.0-beta
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
