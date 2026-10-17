'use client';

import React from 'react';

interface PlatformProjectAnalyticsProps {
  analytics: {
    Freelancer: number;
    Direct: number;
    Upwork: number;
    Fiverr: number;
  };
}

export default function PlatformProjectAnalytics({ analytics }: PlatformProjectAnalyticsProps) {
  const platforms = [
    { 
      name: 'Freelancer', 
      count: analytics?.Freelancer || 0, 
      color: '#00E5FF',
      bgColor: 'bg-[#00E5FF]/10',
      borderColor: 'border-[#00E5FF]/30'
    },
    { 
      name: 'Direct Client', 
      count: analytics?.Direct || 0, 
      color: '#6324FC',
      bgColor: 'bg-[#6324FC]/10',
      borderColor: 'border-[#6324FC]/30'
    },
    { 
      name: 'Upwork', 
      count: analytics?.Upwork || 0, 
      color: '#10B981',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    { 
      name: 'Fiverr', 
      count: analytics?.Fiverr || 0, 
      color: '#EC4899',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30'
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-6 mb-8 shadow-sm">
      <h2 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white mb-5">
        Project Count by Platform
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {platforms.map((platform) => (
          <div key={platform.name} className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
            <div 
              className={`w-14 h-14 mx-auto rounded-2xl ${platform.bgColor} border ${platform.borderColor} flex items-center justify-center text-xl font-heading font-extrabold mb-2 shadow-sm`}
              style={{ color: platform.color }}
            >
              {platform.count}
            </div>
            <p className="text-xs font-heading font-bold text-slate-700 dark:text-slate-300">
              {platform.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
