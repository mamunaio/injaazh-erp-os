'use client';

import { useState } from 'react';
import { fixProposalIndex } from '@/app/actions/fixProposalIndex';

export default function FixIndexPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    setResult('Fixing index...');
    
    try {
      const res = await fixProposalIndex();
      if (res.success) {
        setResult('✅ Success: ' + res.message);
      } else {
        setResult('❌ Error: ' + res.error);
      }
    } catch (error: any) {
      setResult('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center neu-base-bg p-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg max-w-md w-full">
        <h1 className="mb-4">
          Fix Proposal Index
        </h1>
        <p className="text-slate-600 dark:text-gray-400 mb-6">
          This will fix the shareToken index issue in the proposals collection.
        </p>
        
        <button
          onClick={handleFix}
          disabled={loading}
          className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Fixing...' : 'Fix Index'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <pre className="text-sm text-white whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500 dark:text-gray-500">
          After fixing, you can navigate back to <a href="/proposals" className="text-indigo-600 hover:underline">Proposals</a>
        </p>
      </div>
    </div>
  );
}
