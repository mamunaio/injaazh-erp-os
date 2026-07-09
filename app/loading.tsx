import React from 'react';
import WorkspaceLoader from '@/components/ui/WorkspaceLoader';

export default function Loading() {
  return (
    <div className="min-h-screen neu-base-bg p-8 flex items-center justify-center">
      <WorkspaceLoader />
    </div>
  );
}
