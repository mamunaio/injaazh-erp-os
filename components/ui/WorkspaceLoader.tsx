'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';

export default function WorkspaceLoader() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full font-sans selection:bg-[#6324FC]/30">
      {/* Background Breathing Glow */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,36,252,0.3) 0%, rgba(0,229,255,0.15) 50%, rgba(0,0,0,0) 70%)'
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-2xl"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#6324FC]/10 to-[#00E5FF]/10 pointer-events-none" />
          <Command className="w-8 h-8 text-[#6324FC] dark:text-[#00E5FF]" strokeWidth={1.75} />
        </motion.div>

        {/* Text Block */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            INJAAZH ERP OS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-xs md:text-sm font-medium tracking-wide text-secondary"
          >
            Intelligent Business Operating System
          </motion.p>
        </div>

        {/* Loading Indicator Group */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 flex flex-col items-center gap-3 w-full max-w-[200px]"
        >
          {/* Progress Bar */}
          <div className="w-full h-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#6324FC] to-[#00E5FF] rounded-full"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          <p className="text-[10px] font-heading font-bold tracking-widest uppercase text-secondary">
            Initializing System...
          </p>
        </motion.div>
      </div>

      {/* Version Tag */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <p className="text-[10px] font-mono tracking-widest text-secondary opacity-60">
          v2.4.0-stable
        </p>
      </motion.div>
    </div>
  );
}
