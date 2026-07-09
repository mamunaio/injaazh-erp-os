'use client';

import { useState } from 'react';

export default function FixDebtAmountsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runFix = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-debt-amounts', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Fix failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen neu-base-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h1 className="mb-4">
            Fix Debt Original Amounts
          </h1>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <h3 className="mb-2">⚠️ When to use this:</h3>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
              <li>You made payments BEFORE running the migration</li>
              <li>The "Original" amount is showing incorrectly (less than it should be)</li>
              <li>The "Paid" amount is correct but "Original" is wrong</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <h3 className="mb-2">🔧 What this does:</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Recalculates the correct Original Amount by adding: <br/>
              <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mt-2 inline-block">
                Original Amount = Current Remaining + Total Paid
              </code>
            </p>
          </div>

          <button
            onClick={runFix}
            disabled={isRunning}
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? 'Fixing Amounts...' : 'Fix Debt Amounts'}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-xl ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <h3 className={`font-bold mb-2 ${
                result.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
              }`}>
                {result.success ? '✅ Fix Completed' : '❌ Fix Failed'}
              </h3>
              
              {result.success && (
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1 mb-4">
                  <p>✅ Fixed: {result.fixedCount}</p>
                  <p>✓ Already correct: {result.alreadyCorrectCount}</p>
                  <p>📊 Total processed: {result.totalProcessed}</p>
                </div>
              )}

              {result.error && (
                <p className="text-sm text-red-700 dark:text-red-400">
                  Error: {result.error}
                </p>
              )}

              {result.details && result.details.length > 0 && (
                <div className="mt-4 max-h-96 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <h4 className="mb-2">Details:</h4>
                  <ul className="text-xs space-y-2 font-mono">
                    {result.details.map((detail: string, index: number) => (
                      <li 
                        key={index} 
                        className={`${
                          detail.startsWith('✅') 
                            ? 'text-green-600 dark:text-green-400' 
                            : detail.startsWith('⏭️')
                            ? 'text-slate-600 dark:text-slate-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <h3 className="mb-2">📝 Example:</h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
              <p>Before Fix:</p>
              <p className="text-red-600 dark:text-red-400">  Original: ৳9,760 (WRONG!)</p>
              <p className="text-green-600 dark:text-green-400">  Paid: ৳5,000</p>
              <p>  Remaining: ৳9,760</p>
              <p className="mt-2">After Fix:</p>
              <p className="text-green-600 dark:text-green-400">  Original: ৳14,760 (CORRECT!)</p>
              <p className="text-green-600 dark:text-green-400">  Paid: ৳5,000</p>
              <p>  Remaining: ৳9,760</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
