import React from 'react';
import WorkspaceLoader from '@/components/ui/WorkspaceLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-[#09090B] flex items-center justify-center overflow-hidden">
      <WorkspaceLoader />
    </div>
  );
}
