'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, PlayCircle } from 'lucide-react';

interface IslamicSplashModalProps {
  islamicQuote: any;
}

export default function IslamicSplashModal({ islamicQuote }: IslamicSplashModalProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [minimized, setMinimized] = useState(true);

  useEffect(() => {
    // Check if we already showed it today
    const lastShown = localStorage.getItem('islamic_splash_last_shown');
    const today = new Date().toDateString();

    if (lastShown !== today) {
      setShowSplash(true);
      setMinimized(false);
      localStorage.setItem('islamic_splash_last_shown', today);
    }
  }, []);

  if (!islamicQuote) return null;

  return (
    <>
      <AnimatePresence>
        {showSplash && !minimized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative w-full h-full max-w-none max-h-none overflow-y-auto neu-base-bg flex flex-col items-center justify-center p-8"
            >
              <button 
                onClick={() => setMinimized(true)}
                className="absolute top-6 right-6 p-2 rounded-full neu-button text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-12 max-w-3xl mx-auto mt-auto">
                <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <BookOpen size={40} className="text-slate-900 dark:text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  আজকের ইসলামিক বার্তা
                </h2>
                <p className="text-lg font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  {new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 w-full max-w-5xl mx-auto">
                {islamicQuote.ayah && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">কোরআনের আয়াত</h4>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-arabic text-indigo-400 mb-4 leading-relaxed" dir="rtl">
                        {islamicQuote.ayah.arabic}
                      </p>
                      <p className="text-xs font-bold text-indigo-500/80 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full inline-block">{islamicQuote.ayah.reference}</p>
                    </div>
                    <div className="p-6 neu-flat rounded-2xl flex-1 text-center">
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {islamicQuote.ayah.translation}
                      </p>
                    </div>
                  </div>
                )}

                {islamicQuote.hadith && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">ডেইলি হাদিস</h4>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-arabic text-purple-400 mb-4 leading-relaxed" dir="rtl">
                        {islamicQuote.hadith.arabic}
                      </p>
                      <p className="text-xs font-bold text-purple-500/80 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full inline-block">{islamicQuote.hadith.reference}</p>
                    </div>
                    <div className="p-6 neu-flat rounded-2xl flex-1 text-center">
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {islamicQuote.hadith.translation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-16 mb-auto flex justify-center w-full">
                <button 
                  onClick={() => setMinimized(true)}
                  className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-slate-900 dark:text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95"
                >
                  <PlayCircle size={28} />
                  Bismillah, Start Work
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Banner when minimized */}
      <AnimatePresence>
        {minimized && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 overflow-hidden rounded-2xl neu-flat border border-indigo-500/20"
          >
            <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <BookOpen size={20} className="text-slate-900 dark:text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-0.5">Today's Insight</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate max-w-2xl">
                    {islamicQuote.ayah?.translation || islamicQuote.hadith?.translation || ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSplash(true);
                  setMinimized(false);
                }}
                className="text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-2 rounded-xl transition-all shrink-0 border border-indigo-500/20"
              >
                Read Full
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
