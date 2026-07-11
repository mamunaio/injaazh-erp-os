'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';

export default function WorkspaceLoader() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full font-sans selection:bg-[#2563EB]/30">
      {/* Background Breathing Glow */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, rgba(124,58,237,0.15) 50%, rgba(9,9,11,0) 70%)'
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#11131A] to-[#09090B] border border-[#232734] shadow-2xl"
        >
          <Command className="w-8 h-8 text-[#FFFFFF]" strokeWidth={1.5} />
        </motion.div>

        {/* Text Block */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-2xl md:text-3xl font-bold tracking-tight text-[#FFFFFF] font-jakarta"
          >
            INJAAZH ERP OS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-[13px] md:text-sm font-medium tracking-wide text-[#94A3B8]"
          >
            Intelligent Business Operating System
          </motion.p>
        </div>

        {/* Loading Indicator Group */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 flex flex-col items-center gap-4 w-full max-w-[200px]"
        >
          {/* Progress Bar */}
          <div className="w-full h-1 bg-[#11131A] border border-[#232734] rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent rounded-full"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#94A3B8]/60">
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
        <p className="text-[10px] font-mono tracking-widest text-[#94A3B8]/40">
          v2.0.0-beta
        </p>
      </motion.div>
    </div>
  );
}
