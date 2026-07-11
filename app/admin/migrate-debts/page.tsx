'use client';

import { useState } from 'react';

export default function MigrateDebtsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-debts', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Migration failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen neu-base-bg p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h1 className="mb-4">
            Migrate Personal Debts
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This will update all existing debt records to include originalAmount, paidAmount, and paymentHistory fields.
          </p>

          <button
            onClick={runMigration}
            disabled={isRunning}
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-900 dark:text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
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
                {result.success ? '✅ Migration Successful' : '❌ Migration Failed'}
              </h3>
              
              {result.success && (
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <p>✅ Successfully migrated: {result.successCount}</p>
                  <p>❌ Failed: {result.errorCount}</p>
                  <p>📊 Total processed: {result.totalProcessed}</p>
                </div>
              )}

              {result.error && (
                <p className="text-sm text-red-700 dark:text-red-400">
                  Error: {result.error}
                </p>
              )}

              {result.details && result.details.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto">
                  <h4 className="mb-2">Migration Details:</h4>
                  <ul className="text-xs space-y-1">
                    {result.details.map((detail: string, index: number) => (
                      <li key={index} className="text-slate-600 dark:text-slate-400">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
