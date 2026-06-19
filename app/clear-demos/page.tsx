'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearDemoProposals, clearAllProposals } from '@/app/actions/clearDemoProposals';
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function ClearDemosPage() {
  const router = useRouter();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'demo' | 'all' | null>(null);

  const handleClearDemo = async () => {
    setLoading(true);
    setResult('Clearing demo proposals...');
    
    try {
      const res = await clearDemoProposals();
      if (res.success) {
        setResult(`✅ Success: ${res.message}`);
        setTimeout(() => {
          router.push('/proposals');
        }, 2000);
      } else {
        setResult('❌ Error: ' + res.error);
      }
    } catch (error: any) {
      setResult('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    setResult('Clearing all proposals...');
    
    try {
      const res = await clearAllProposals();
      if (res.success) {
        setResult(`✅ Success: ${res.message}`);
        setTimeout(() => {
          router.push('/proposals');
        }, 2000);
      } else {
        setResult('❌ Error: ' + res.error);
      }
    } catch (error: any) {
      setResult('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center neu-base-bg p-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <Trash2 size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="">
              Clear Demo Data
            </h1>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Remove demo/seed proposals from database
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Clear Demo Proposals */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="mb-2">
              Clear Demo Proposals Only
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              This will delete only the seed/demo proposals (Acme Corp, Globex Inc, Initech, Soylent Corp, Wayne Enterprises).
              Your real proposals will be safe.
            </p>
            <button
              onClick={() => setShowConfirm('demo')}
              disabled={loading}
              className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Clear Demo Proposals
            </button>
          </div>

          {/* Clear All Proposals */}
          <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-6 border border-red-200 dark:border-red-500/30">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="mb-2">
                  Clear ALL Proposals (Danger Zone)
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                  ⚠️ This will delete ALL proposals including your real data. This action cannot be undone!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConfirm('all')}
              disabled={loading}
              className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18} />
              Clear ALL Proposals
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 backdrop-blur-2xl border border-red-200 dark:border-red-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                  <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
                </div>
                
                <h3 className="mb-2">
                  Are You Sure?
                </h3>
                
                <p className="text-slate-600 dark:text-gray-400 mb-6">
                  {showConfirm === 'demo' 
                    ? 'This will delete all demo proposals (Acme Corp, Globex Inc, etc.)'
                    : '⚠️ This will delete ALL proposals including your real data!'
                  }
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowConfirm(null)}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showConfirm === 'demo' ? handleClearDemo : handleClearAll}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Confirm Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-lg ${
            result.startsWith('✅') 
              ? 'bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30' 
              : 'bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {result.startsWith('✅') ? (
                <CheckCircle size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <pre className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap flex-1">
                {result}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => router.push('/proposals')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Back to Proposals
          </button>
        </div>
      </div>
    </div>
  );
}
