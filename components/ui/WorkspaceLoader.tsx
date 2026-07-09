'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function WorkspaceLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] w-full">
      <div className="relative w-36 h-36 flex items-center justify-center mb-8">
        {/* Outer Glow Ring */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Outer Base */}
        <div className="absolute inset-2 rounded-full neu-flat shadow-xl"></div>
        
        {/* Inner Pressed Track */}
        <div className="absolute inset-6 rounded-full neu-pressed"></div>
        
        {/* Spinning Gradient Indicator */}
        <motion.div 
          className="absolute inset-2 rounded-full border-[6px] border-transparent border-t-indigo-500 border-r-purple-500 border-b-pink-500"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Center Core */}
        <motion.div 
          className="w-14 h-14 rounded-full neu-button flex items-center justify-center z-10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div 
            className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.8)]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <motion.h3 
          className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-wide"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Injaazh Global
        </motion.h3>
        
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div 
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-purple-500' : 'bg-pink-500'}`}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        <p className="text-xs font-bold tracking-[0.4em] text-slate-500 dark:text-slate-400 uppercase mt-2">
          Preparing Workspace
        </p>
      </div>
    </div>
  );
}
