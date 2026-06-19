'use client';

import React from 'react';

/**
 * Props for the PlatformProjectAnalytics component
 */
interface PlatformProjectAnalyticsProps {
  /**
   * Project count analytics grouped by platform
   * Each platform key contains the total number of projects for that platform
   */
  analytics: {
    /** Number of projects on Freelancer platform */
    Freelancer: number;
    /** Number of projects on Direct/Local platform */
    Direct: number;
    /** Number of projects on Upwork platform */
    Upwork: number;
    /** Number of projects on Fiverr platform */
    Fiverr: number;
  };
}

/**
 * PlatformProjectAnalytics Component
 * 
 * Displays project count statistics grouped by platform on the Money page.
 * Shows a visual grid with circular badges for each platform (Freelancer, Direct, Upwork, Fiverr)
 * displaying the total number of projects per platform.
 * 
 * @component
 * @example
 * ```tsx
 * <PlatformProjectAnalytics 
 *   analytics={{ 
 *     Freelancer: 5, 
 *     Direct: 3, 
 *     Upwork: 8, 
 *     Fiverr: 2 
 *   }} 
 * />
 * ```
 * 
 * Features:
 * - Responsive grid layout (2 columns on mobile, 4 columns on desktop)
 * - Color-coded platform badges with gradient backgrounds
 * - Displays zero counts for platforms with no projects
 * - Matches Money page theme with backdrop blur and border styling
 * 
 * @param {PlatformProjectAnalyticsProps} props - Component props
 * @returns {JSX.Element} Rendered analytics display component
 */
export default function PlatformProjectAnalytics({ analytics }: PlatformProjectAnalyticsProps) {
  const platforms = [
    { 
      name: 'Freelancer', 
      count: analytics.Freelancer, 
      color: 'text-blue-500' 
    },
    { 
      name: 'Direct', 
      count: analytics.Direct, 
      color: 'text-purple-500' 
    },
    { 
      name: 'Upwork', 
      count: analytics.Upwork, 
      color: 'text-green-500' 
    },
    { 
      name: 'Fiverr', 
      count: analytics.Fiverr, 
      color: 'text-teal-500' 
    },
  ];

  return (
    <div className="neu-flat rounded-[2rem] p-6 mb-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Project Count by Platform
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {platforms.map((platform) => (
          <div key={platform.name} className="text-center">
            <div 
              className={`w-16 h-16 mx-auto rounded-full neu-pressed flex items-center justify-center ${platform.color} text-2xl font-bold mb-2`}
            >
              {platform.count}
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {platform.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
