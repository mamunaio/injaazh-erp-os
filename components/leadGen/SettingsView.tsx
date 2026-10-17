'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { SystemSettings } from '@/types/leadGen';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  onExportExcel: () => void;
  onResetDatabase: () => Promise<void>;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  onExportExcel,
  onResetDatabase,
}: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'assumptions' | 'database' | 'guide'>('assumptions');

  // Form states
  const [agencyName, setAgencyName] = useState(settings.agencyName || 'Injaazh US HVAC Growth');
  const [niche, setNiche] = useState(settings.niche || 'US HVAC Contractors & Services');
  const [maxBounceRate, setMaxBounceRate] = useState((settings.maxBounceRate || 0.02) * 100);
  const [minPositiveReplyRate, setMinPositiveReplyRate] = useState(
    (settings.minPositiveReplyRate || 0.01) * 100
  );
  const [target30DaysLow, setTarget30DaysLow] = useState(settings.targetColdEmails30DaysLow || 300);
  const [target30DaysHigh, setTarget30DaysHigh] = useState(settings.targetColdEmails30DaysHigh || 500);
  const [targetMrrMonth6, setTargetMrrMonth6] = useState(settings.targetMrrMonth6 || 3000);
  const [targetMrrMonth12, setTargetMrrMonth12] = useState(settings.targetMrrMonth12 || 6000);
  const [hourlyFloorRate, setHourlyFloorRate] = useState(settings.hourlyFloorRate || 25);
  const [reportMonth, setReportMonth] = useState(settings.reportMonth || '2026-10');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isMongoConnected = Boolean(settings.mongoConnected);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSettings({
        agencyName,
        niche,
        maxBounceRate: maxBounceRate / 100,
        minPositiveReplyRate: minPositiveReplyRate / 100,
        targetColdEmails30DaysLow: Number(target30DaysLow),
        targetColdEmails30DaysHigh: Number(target30DaysHigh),
        targetMrrMonth6: Number(targetMrrMonth6),
        targetMrrMonth12: Number(targetMrrMonth12),
        hourlyFloorRate: Number(hourlyFloorRate),
        reportMonth,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to restore the initial Excel template seed data?')) {
      setResetting(true);
      try {
        await onResetDatabase();
        alert('Database restored with Excel template seed data successfully!');
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <SettingsIcon className="h-6 w-6 text-[#6324FC] dark:text-[#00E5FF]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Settings, Database &amp; SOP Guide</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure agency target benchmarks, review MongoDB Atlas connectivity, and access standard operating procedures.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onExportExcel}
            className="flex items-center space-x-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel Backup</span>
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center space-x-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{resetting ? 'Resetting...' : 'Reset to Template'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-black/10 dark:border-white/10 space-x-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('assumptions')}
          className={`pb-3.5 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
            activeSubTab === 'assumptions'
              ? 'border-[#6324FC] dark:border-[#00E5FF] text-[#6324FC] dark:text-[#00E5FF]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Agency Benchmarks &amp; Targets (Assumptions)
        </button>
        <button
          onClick={() => setActiveSubTab('database')}
          className={`pb-3.5 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
            activeSubTab === 'database'
              ? 'border-[#6324FC] dark:border-[#00E5FF] text-[#6324FC] dark:text-[#00E5FF]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          MongoDB Atlas &amp; Storage
        </button>
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`pb-3.5 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
            activeSubTab === 'guide'
              ? 'border-[#6324FC] dark:border-[#00E5FF] text-[#6324FC] dark:text-[#00E5FF]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Operating SOP Guide &amp; Compliance
        </button>
      </div>

      {/* TAB 1: Assumptions Settings */}
      {activeSubTab === 'assumptions' && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 backdrop-blur-xl space-y-6 shadow-sm"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Agency Brand &amp; Target Niche</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Modifying these thresholds updates calculation triggers across Dashboard and Client reports automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Agency Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Business Niche</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-black/5 dark:border-white/10">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Maximum Bounce Rate Ceiling (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={maxBounceRate}
                onChange={(e) => setMaxBounceRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">SOP recommendation: 2.0%</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Minimum Positive Reply Benchmark (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={minPositiveReplyRate}
                onChange={(e) => setMinPositiveReplyRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Below 1.0% indicates offer copy revision needed</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hourly Yield Floor Rate ($/hr)
              </label>
              <input
                type="number"
                min="1"
                value={hourlyFloorRate}
                onChange={(e) => setHourlyFloorRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Triggers low yield alert in Clients view below this</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-black/5 dark:border-white/10">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                First 30-Day Cold Email Target (Low - High)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={target30DaysLow}
                  onChange={(e) => setTarget30DaysLow(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  placeholder="Low"
                />
                <input
                  type="number"
                  value={target30DaysHigh}
                  onChange={(e) => setTarget30DaysHigh(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  placeholder="High"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Month 6 Target MRR ($/mo)
              </label>
              <input
                type="number"
                value={targetMrrMonth6}
                onChange={(e) => setTargetMrrMonth6(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Month 12 Target MRR ($/mo)
              </label>
              <input
                type="number"
                value={targetMrrMonth12}
                onChange={(e) => setTargetMrrMonth12(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          {savedSuccess && (
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Settings updated and saved successfully!</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/10">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
            >
              {saving ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MongoDB Configuration */}
      {activeSubTab === 'database' && (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 backdrop-blur-xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`rounded-2xl p-3 border ${
                  isMongoConnected
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  MongoDB Status:{' '}
                  <span className={isMongoConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {isMongoConnected ? 'Active (Connected)' : 'Local Persistent Storage Mode'}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {isMongoConnected
                    ? 'Connected directly to your MongoDB Atlas cluster.'
                    : 'Currently persisting to src/data/db.json. Connect MongoDB anytime.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5 space-y-3">
            <h4 className="text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider flex items-center">
              <Server className="h-4 w-4 mr-2" />
              How to Connect MongoDB Atlas:
            </h4>
            <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2.5">
              <li>
                Open the <code className="text-[#6324FC] dark:text-cyan-300 bg-slate-200/80 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono">.env.local</code> file in your project root.
              </li>
              <li>
                Enter your MongoDB connection string:
                <pre className="mt-2 p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                  MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/hvac_leadgen?retryWrites=true&amp;w=majority
                </pre>
              </li>
              <li>
                Restart the Next.js server or refresh the browser. The system will automatically detect MongoDB and sync data directly to the cloud.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 3: Guide Sheet text */}
      {activeSubTab === 'guide' && (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 backdrop-blur-xl space-y-6 shadow-sm">
          <div className="border-b border-black/10 dark:border-white/10 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-[#6324FC] dark:text-[#00E5FF]" />
              Injaazh US HVAC Business Tracker: Operational SOP Guide
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Standard operating procedures, routine checklists, and compliance rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            {/* Daily Routine */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5 space-y-3.5">
              <h4 className="font-bold text-[#6324FC] dark:text-[#00E5FF] text-base">Daily 10-Minute Routine</h4>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                <li><strong className="text-slate-900 dark:text-white">1. Daily Log:</strong> Record sent volume, bounces, and replies daily.</li>
                <li><strong className="text-slate-900 dark:text-white">2. Prospects:</strong> Tag newly received replies. If contact asks to unsubscribe, immediately flag as Suppressed.</li>
                <li><strong className="text-slate-900 dark:text-white">3. Time Log:</strong> Record fulfilled hours to accurately calculate hourly yields.</li>
                <li><strong className="text-slate-900 dark:text-white">4. Team Tasks &amp; Calendar:</strong> Review yellow or red alert overdue items.</li>
                <li><strong className="text-slate-900 dark:text-white">5. Dashboard:</strong> Conduct a weekly Friday review of MRR progress.</li>
              </ul>
            </div>

            {/* Compliance & Rules */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5 space-y-3.5">
              <h4 className="font-bold text-amber-600 dark:text-amber-400 text-base">Compliance &amp; Best Practices</h4>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                <li><strong className="text-slate-900 dark:text-white">B2B Emails Only:</strong> Target verified corporate domains only, strictly within the United States.</li>
                <li><strong className="text-slate-900 dark:text-white">Bounce Limits:</strong> If bounce rates exceed 2%, pause sending immediately and re-verify email batches.</li>
                <li><strong className="text-slate-900 dark:text-white">Unsubscribe Requests:</strong> Honor opt-outs immediately by assigning the Suppressed stage.</li>
                <li><strong className="text-slate-900 dark:text-white">Consistent Naming:</strong> Keep client company names consistent across Clients, Time Log, and Invoices.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
