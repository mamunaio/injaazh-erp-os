import React from 'react';
import WorkspaceLoader from '@/components/ui/WorkspaceLoader';

export default function Loading() {
  return (
    <div className="h-screen w-screen bg-[#09090B] flex items-center justify-center overflow-hidden">
      <WorkspaceLoader />
    </div>
  );
}
