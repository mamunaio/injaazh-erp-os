'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, Command, Building2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/authActions';
import ThemeToggle from '@/components/layout/ThemeToggle';
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

        {/* Glassmorphic Floating Element */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hidden xl:block p-6 flex flex-col gap-4"
          style={{ transform: 'perspective(1000px) rotateY(-15deg) rotateX(10deg)' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
            <Command size={24} />
          </div>
          <div className="space-y-2 mt-auto">
            <div className="h-2 w-full bg-white/10 rounded-full"></div>
            <div className="h-2 w-3/4 bg-white/10 rounded-full"></div>
            <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
          </div>
        </motion.div>

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

        {/* Center Welcome Message */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-4 leading-tight tracking-tight">
            Start your journey.
          </h1>
          <p className="text-base text-slate-400 font-medium leading-relaxed mb-6">
            Create an account and deploy the world&apos;s most intelligent enterprise operating system for your team in minutes.
          </p>
          
          <ul className="space-y-3">
            {['Enterprise grade security & RBAC', 'Real-time pipeline analytics & cash flow', 'AI-powered workflow automation'].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5 text-slate-300 text-xs font-medium">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Bottom Trust Signals */}
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest">Trusted by forward-thinking companies</span>
          <div className="flex items-center gap-6 opacity-40 grayscale mix-blend-screen">
            <div className="font-bold text-base italic tracking-tighter text-white">ACME</div>
            <div className="font-bold text-base font-mono text-white">NEXUS</div>
            <div className="font-bold text-base font-serif text-white">Stark Industries</div>
            <div className="font-bold text-base tracking-widest text-white">GLOBEX</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Registration Context */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10 py-6"
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
                Create Your Account
              </h2>
              <p className="text-xs text-secondary font-medium">
                Join Injaazh ERP and streamline your workflow today.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" size={15} />
                  <input 
                    type="text" 
                    name="name"
                    required
                    placeholder="John Doe"
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium placeholder:text-secondary focus:outline-none focus:border-[#6324FC] transition-all"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Work Email</label>
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

              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Company Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" size={15} />
                  <input 
                    type="text" 
                    name="companyName"
                    placeholder="Acme Corp"
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium placeholder:text-secondary focus:outline-none focus:border-[#6324FC] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Password</label>
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
                <div className="flex items-center gap-2 pt-1 px-1">
                  <div className="flex-1 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-full rounded-full transition-all duration-300 ${
                          password.length > 0 && i < strength ? getStrengthColor() : 'bg-black/5 dark:bg-white/5'
                        }`} 
                      />
                    ))}
                  </div>
                  {password.length > 0 && (
                    <span className={`text-[9px] font-heading font-bold uppercase tracking-widest ${
                      strength <= 1 ? 'text-[#EF4444]' : strength === 2 ? 'text-[#F59E0B]' : strength === 3 ? 'text-[#6324FC] dark:text-[#00E5FF]' : 'text-emerald-500'
                    }`}>
                      {strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                    </span>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" size={15} />
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

              {/* Accept Terms */}
              <div className="flex items-center gap-2 pt-1 pb-1">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input required type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#060608] text-[#6324FC] focus:ring-[#6324FC] transition-colors" />
                  <span className="text-[11px] font-medium text-secondary group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-relaxed">
                    I accept the <a href="#" className="text-[#6324FC] dark:text-[#00E5FF] hover:underline">Terms</a> and <a href="#" className="text-[#6324FC] dark:text-[#00E5FF] hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-heading font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,36,252,0.35)] focus:outline-none"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Or continue with</span>
              <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 relative z-10">
              <button type="button" className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#060608] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 py-2.5 rounded-xl transition-all focus:outline-none">
                <GoogleIcon />
                <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#060608] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 py-2.5 rounded-xl transition-all focus:outline-none">
                <MicrosoftIcon />
                <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">Microsoft</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center flex flex-col items-center gap-2">
            <p className="text-xs text-secondary font-medium">
              Already have an account?{' '}
              <Link href="/login" className="font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
