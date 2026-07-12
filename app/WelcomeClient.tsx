'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Command, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function WelcomeClient() {
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#09090B] flex flex-col items-center justify-center font-sans overflow-hidden selection:bg-[#2563EB]/30">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-[100]">
        <ThemeToggle />
      </div>
      {/* Subtle Background Glow */}
      <motion.div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, rgba(124,58,237,0.15) 50%, rgba(9,9,11,0) 70%)'
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.2, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-3xl mx-auto">
        
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center w-20 h-20 mb-8 rounded-[24px] bg-gradient-to-br from-[#11131A] to-[#09090B] border border-slate-200 dark:border-[#232734] shadow-2xl"
        >
          <Command className="w-10 h-10 text-white" strokeWidth={1.5} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 font-jakarta"
        >
          Welcome to <br className="md:hidden" /> INJAAZH ERP OS
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-base md:text-lg text-[#94A3B8] font-medium max-w-[500px] mx-auto leading-relaxed mb-12"
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#09090B]"
          >
            Get Started <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
          
          <Link 
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-transparent border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/50 text-slate-900 dark:text-white font-semibold rounded-xl transition-all hover:bg-white dark:bg-[#11131A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#09090B]"
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
        <p className="text-xs font-mono tracking-widest text-[#94A3B8]/40 uppercase">
          v2.0.0-beta
        </p>
      </motion.div>
    </div>
  );
}
