'use client';

import { useEffect, useRef } from 'react';
import { triggerCronJobsLocally } from '@/app/actions/warmupActions';

export default function WarmupWorker() {
  const isRunning = useRef(false);

  useEffect(() => {
    // We only want to set this up once
    if (isRunning.current) return;
    isRunning.current = true;

    console.log('[WarmupWorker] Background worker started. Will ping every 10 minutes.');

    const runWarmup = async () => {
      try {
        console.log('[WarmupWorker] Triggering warmup cycle...');
        await triggerCronJobsLocally();
      } catch (err) {
        console.error('[WarmupWorker] Error triggering warmup:', err);
      }
    };

    // Run immediately on mount (Disabled for local dev spam)
    // runWarmup();

    // Then run every 10 minutes (600000 ms)
    const interval = setInterval(runWarmup, 600000);

    return () => {
      clearInterval(interval);
      isRunning.current = false;
    };
  }, []);

  // Invisible component
  return null;
}
