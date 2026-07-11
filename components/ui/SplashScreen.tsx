'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';

export default function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const duration = 2500; // 2.5 seconds
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        if (onComplete) {
          setTimeout(onComplete, 500); // Wait a little before completing
        }
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 overflow-hidden font-sans text-slate-800 dark:text-slate-200">
      
      {/* Background Glowing Orb */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full blur-[120px] sm:blur-[160px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.5) 0%, rgba(37,99,235,0.4) 40%, rgba(2,6,23,0) 80%)'
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        
        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-12"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl shadow-violet-500/10 mb-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Command className="w-8 h-8 sm:w-10 sm:h-10 text-slate-900 dark:text-white relative z-10" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold font-jakarta tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            INJAAZH
            <span className="text-violet-500 text-sm sm:text-base font-semibold uppercase tracking-widest mt-1">Global</span>
          </h1>
        </motion.div>

        {/* Progress Bar Container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full flex flex-col items-center gap-4"
        >
          {/* Ultra-thin Elegant Progress Bar */}
          <div className="w-full h-1 sm:h-[2px] bg-slate-800/50 rounded-full overflow-hidden relative shadow-inner">
            <motion.div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)]"
              style={{ width: `${progress}%` }}
              layout
            />
          </div>

          {/* Initializing Text */}
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-2"
          >
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wider">
              Initializing Workspace...
            </span>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
