'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, Database, AlertCircle, Save, Lock } from 'lucide-react';
import { getAllIslamicInsights, addIslamicInsight, deleteIslamicInsight, seedIslamicInsights } from '@/app/actions/dailyInsightsActions';
import { useUser } from '@/components/layout/UserContext';
import { useRouter } from 'next/navigation';

export default function InsightsManagerPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [newInsight, setNewInsight] = useState({
    ayahArabic: '',
    ayahTranslation: '',
    ayahReference: '',
    hadithArabic: '',
    hadithTranslation: '',
    hadithReference: ''
  });

  const fetchInsights = async () => {
    setLoading(true);
    const res = await getAllIslamicInsights();
    if (res.success && res.data) {
      setInsights(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      if (user?.role !== 'owner') {
        router.push('/dashboard');
      } else {
        fetchInsights();
      }
    }
  }, [user, userLoading, router]);

  if (userLoading || user?.role !== 'owner') {
    return (
      <div className="min-h-screen neu-base-bg p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const handleSeed = async () => {
    if (!confirm('Are you sure you want to seed the database with the default 20 insights?')) return;
    setIsSeeding(true);
    const res = await seedIslamicInsights();
    if (res.success) {
      alert('Seeded successfully!');
      fetchInsights();
    } else {
      alert(res.error || 'Failed to seed');
    }
    setIsSeeding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insight?')) return;
    const res = await deleteIslamicInsight(id);
    if (res.success) {
      fetchInsights();
    } else {
      alert('Failed to delete');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ayah: {
        arabic: newInsight.ayahArabic,
        translation: newInsight.ayahTranslation,
        reference: newInsight.ayahReference
      },
      hadith: {
        arabic: newInsight.hadithArabic,
        translation: newInsight.hadithTranslation,
        reference: newInsight.hadithReference
      }
    };

    const res = await addIslamicInsight(data);
    if (res.success) {
      setIsAdding(false);
      setNewInsight({
        ayahArabic: '', ayahTranslation: '', ayahReference: '',
        hadithArabic: '', hadithTranslation: '', hadithReference: ''
      });
      fetchInsights();
    } else {
      alert('Failed to add insight');
    }
  };

  return (
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-200 overflow-hidden font-sans tracking-tight">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="mb-3">
              Islamic Insights Manager
            </h1>
            <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Lock size={16} className="text-rose-500" /> Owner Only Access
            </p>
          </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="neu-button px-6 py-3 rounded-xl flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300"
          >
            <Plus size={18} /> Add New
          </button>
          {insights.length === 0 && (
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-6 py-3 rounded-xl flex items-center gap-2 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-50"
            >
              <Database size={18} /> {isSeeding ? 'Seeding...' : 'Seed Default 20'}
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 neu-pressed rounded-3xl mb-8 border border-indigo-500/20">
          <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            Add New Insight
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ayah Form */}
            <div className="space-y-4">
              <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-sm">Ayah Details</h4>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Arabic Text</label>
                <textarea required dir="rtl" className="w-full neu-flat bg-transparent rounded-xl p-3 text-white font-arabic h-24 focus:border-indigo-500 outline-none border border-transparent transition-colors" value={newInsight.ayahArabic} onChange={e => setNewInsight({...newInsight, ayahArabic: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Bengali Translation</label>
                <textarea required className="w-full neu-flat bg-transparent rounded-xl p-3 text-white h-24 focus:border-indigo-500 outline-none border border-transparent transition-colors" value={newInsight.ayahTranslation} onChange={e => setNewInsight({...newInsight, ayahTranslation: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Reference (e.g. সূরা আল-বাকারা, ২:২৮৬)</label>
                <input required type="text" className="w-full neu-flat bg-transparent rounded-xl p-3 text-white focus:border-indigo-500 outline-none border border-transparent transition-colors" value={newInsight.ayahReference} onChange={e => setNewInsight({...newInsight, ayahReference: e.target.value})} />
              </div>
            </div>

            {/* Hadith Form */}
            <div className="space-y-4">
              <h4 className="text-purple-400 font-bold uppercase tracking-widest text-sm">Hadith Details</h4>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Arabic Text</label>
                <textarea required dir="rtl" className="w-full neu-flat bg-transparent rounded-xl p-3 text-white font-arabic h-24 focus:border-purple-500 outline-none border border-transparent transition-colors" value={newInsight.hadithArabic} onChange={e => setNewInsight({...newInsight, hadithArabic: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Bengali Translation</label>
                <textarea required className="w-full neu-flat bg-transparent rounded-xl p-3 text-white h-24 focus:border-purple-500 outline-none border border-transparent transition-colors" value={newInsight.hadithTranslation} onChange={e => setNewInsight({...newInsight, hadithTranslation: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Reference (e.g. সহীহ বুখারী: ৫০৪০)</label>
                <input required type="text" className="w-full neu-flat bg-transparent rounded-xl p-3 text-white focus:border-purple-500 outline-none border border-transparent transition-colors" value={newInsight.hadithReference} onChange={e => setNewInsight({...newInsight, hadithReference: e.target.value})} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-4 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
              <button type="submit" className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2">
                <Save size={18} /> Save Insight
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p>Loading insights...</p>
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-slate-800/30 rounded-3xl border border-dashed border-slate-600">
          <Database size={48} className="mb-4 text-slate-400" />
          <p className="text-xl font-bold mb-2">No Insights Found</p>
          <p className="text-slate-400 max-w-md text-center">The database is currently empty. The system is using the fallback array. Please click "Seed Default 20" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight: any) => (
            <div key={insight._id} className="p-6 rounded-2xl neu-flat flex flex-col md:flex-row gap-6 items-start border border-transparent hover:border-slate-700 transition-colors">
              <div className="flex flex-col items-center justify-center bg-indigo-500/10 w-16 h-16 rounded-2xl border border-indigo-500/20 shrink-0">
                <span className="text-xs text-indigo-400 font-bold uppercase">Day</span>
                <span className="text-2xl font-black text-white">{insight.dayNumber}</span>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Ayah • {insight.ayah.reference}</span>
                  <p className="text-slate-300 line-clamp-2" title={insight.ayah.translation}>{insight.ayah.translation}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 block">Hadith • {insight.hadith.reference}</span>
                  <p className="text-slate-300 line-clamp-2" title={insight.hadith.translation}>{insight.hadith.translation}</p>
                </div>
              </div>

              <button 
                onClick={() => handleDelete(insight._id)}
                className="p-3 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                title="Delete Insight"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
