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
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative h-full flex flex-col justify-between p-6 rounded-3xl overflow-hidden group border border-white/5 bg-[#121214] hover:border-white/10 transition-all duration-300 ${className}`}
    >
      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColorClass}`}>
              <Icon size={18} className="text-white" />
            </div>
            {href && (
              <Link href={href} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full">
                View <ArrowRight size={12} />
              </Link>
            )}
          </div>
          
          <p className="text-xs font-semibold text-slate-400 tracking-wider mb-1.5">{title}</p>
          <h3 className="text-2xl font-bold text-white tracking-tight mb-4 font-mono">{value}</h3>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/5">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
