'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Command, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function WelcomeClient() {
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#060608] flex flex-col items-center justify-center font-sans overflow-hidden selection:bg-[#6324FC]/30">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100]">
        <ThemeToggle />
      </div>
      
      {/* Subtle Background Glow */}
      <motion.div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(99,36,252,0.4) 0%, rgba(0,229,255,0.2) 50%, rgba(6,6,8,0) 70%)'
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-3xl mx-auto">
        
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center w-20 h-20 mb-8 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 shadow-2xl"
        >
          <Command className="w-10 h-10 text-[#6324FC] dark:text-[#00E5FF]" strokeWidth={1.5} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 font-heading"
        >
          Welcome to <br className="md:hidden" /> INJAAZH ERP OS
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-base md:text-lg text-secondary font-medium max-w-[500px] mx-auto leading-relaxed mb-10"
        >
          Intelligent Business Operating System. Streamline your enterprise workflow with unparalleled speed and precision.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link 
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(99,36,252,0.4)]"
          >
            Get Started <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
          
          <Link 
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 text-slate-900 dark:text-white font-heading font-bold rounded-2xl transition-all shadow-sm"
          >
            Sign In
          </Link>
        </motion.div>
      </div>

      {/* Footer Version Tag */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <p className="text-xs font-mono tracking-widest text-secondary uppercase">
          v2.0.0-luxury
        </p>
      </motion.div>
    </div>
  );
}
