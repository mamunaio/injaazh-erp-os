import React from 'react';

export default function SettingsLoading() {
  return (
    <div className="bg-slate-50 dark:bg-[#060608] min-h-screen text-slate-900 dark:text-white p-4 md:p-8 pt-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-36 bg-black/5 dark:bg-white/10 rounded-lg animate-pulse" />
          <div className="h-8 w-44 bg-black/5 dark:bg-white/10 rounded-xl animate-pulse" />
          <div className="h-4 w-72 bg-black/5 dark:bg-white/10 rounded-lg animate-pulse" />
        </div>

        {/* Content Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          <div className="lg:col-span-1 space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-12 bg-black/5 dark:bg-white/5 rounded-2xl animate-pulse border border-black/5 dark:border-white/5" />
            ))}
          </div>
          <div className="lg:col-span-3 h-[520px] bg-white dark:bg-[#0a0a0d] rounded-3xl animate-pulse border border-black/10 dark:border-white/10 shadow-xs" />
        </div>
      </div>
    </div>
  );
}
