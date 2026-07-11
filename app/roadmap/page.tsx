'use client';

import React, { useEffect, useState } from 'react';
import RoadmapClient from './RoadmapClient';
import { getRoadmapProjects } from '@/app/actions/roadmapActions';
import { Loader2 } from 'lucide-react';

export default function RoadmapPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const result = await getRoadmapProjects();
      if (result.success) {
        setProjects(result.data);
      }
      setIsLoading(false);
    }
    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return <RoadmapClient initialProjects={projects} />;
}
