'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface AnimatedStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColorClass: string;
  glowColorClass: string;
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function AnimatedStatCard({
  title,
  value,
  icon: Icon,
  iconColorClass,
  glowColorClass,
  href,
  children,
  className = ''
}: AnimatedStatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative h-full flex flex-col justify-between p-6 rounded-[28px] overflow-hidden group border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl hover:border-white/10 hover:shadow-${glowColorClass.split('-')[1]}-500/20 transition-all duration-500 ${className}`}
    >
      {/* Background Animated Glow */}
      <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[60px] opacity-30 group-hover:opacity-60 transition-opacity duration-700 ${glowColorClass}`} />
      
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${iconColorClass}`}>
              <Icon size={22} className="text-white drop-shadow-md" />
            </div>
            {href && (
              <Link href={href} className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                View <ArrowRight size={12} />
              </Link>
            )}
          </div>
          
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-white tracking-tight mb-4">{value}</h3>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/10">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
