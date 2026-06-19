import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] w-full">
      <div className="relative w-32 h-32 flex items-center justify-center mb-8">
        {/* Outer Base */}
        <div className="absolute inset-0 rounded-full neu-flat animate-[spin_4s_linear_infinite]"></div>
        
        {/* Inner Pressed Track */}
        <div className="absolute inset-4 rounded-full neu-pressed"></div>
        
        {/* Spinning Gradient Indicator */}
        <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-indigo-500 border-r-purple-500 animate-[spin_1.5s_cubic-bezier(0.68,-0.55,0.265,1.55)_infinite]"></div>
        
        {/* Center Core */}
        <div className="w-12 h-12 rounded-full neu-button flex items-center justify-center z-10 animate-pulse">
          <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 animate-pulse tracking-wide">
          Injaazh Global
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase mt-2">
          Preparing Workspace
        </p>
      </div>
    </div>
  );
}
