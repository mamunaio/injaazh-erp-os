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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto neu-base-bg rounded-3xl shadow-2xl p-8 border border-slate-700/50"
            >
              <button 
                onClick={() => setMinimized(true)}
                className="absolute top-6 right-6 p-2 rounded-full neu-button text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <BookOpen size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  আজকের ইসলামিক বার্তা
                </h2>
                <p className="text-slate-400 mt-2">
                  {new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {islamicQuote.ayah && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <h4 className="text-sm font-bold text-slate-300">কোরআনের আয়াত</h4>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-arabic text-emerald-400 mb-2 leading-relaxed" dir="rtl">
                        {islamicQuote.ayah.arabic}
                      </p>
                      <p className="text-sm font-bold text-emerald-500/80 uppercase tracking-widest">{islamicQuote.ayah.reference}</p>
                    </div>
                    <div className="p-4 neu-pressed rounded-xl flex-1 text-center">
                      <p className="text-base font-medium text-slate-300 leading-relaxed">
                        {islamicQuote.ayah.translation}
                      </p>
                    </div>
                  </div>
                )}

                {islamicQuote.hadith && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <h4 className="text-sm font-bold text-slate-300">ডেইলি হাদিস</h4>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-arabic text-teal-400 mb-2 leading-relaxed" dir="rtl">
                        {islamicQuote.hadith.arabic}
                      </p>
                      <p className="text-sm font-bold text-teal-500/80 uppercase tracking-widest">{islamicQuote.hadith.reference}</p>
                    </div>
                    <div className="p-4 neu-pressed rounded-xl flex-1 text-center">
                      <p className="text-base font-medium text-slate-300 leading-relaxed">
                        {islamicQuote.hadith.translation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 flex justify-center">
                <button 
                  onClick={() => setMinimized(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/25 transition-all transform hover:scale-105"
                >
                  <PlayCircle size={24} />
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
            className="mb-6 overflow-hidden rounded-2xl neu-flat border border-emerald-500/20 bg-gradient-to-r from-slate-900 to-slate-800"
          >
            <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mb-0.5">Today's Insight</p>
                  <p className="text-sm text-slate-300 font-medium truncate max-w-2xl">
                    {islamicQuote.ayah?.translation || islamicQuote.hadith?.translation || ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSplash(true);
                  setMinimized(false);
                }}
                className="text-xs font-bold text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-5 py-2 rounded-xl transition-all shrink-0 border border-emerald-500/30"
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
