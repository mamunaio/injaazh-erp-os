export default function ProposalsLoading() {
  return (
    <div className="min-h-screen p-8 text-slate-200">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="h-10 w-64 neu-pressed rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-96 neu-pressed rounded animate-pulse" />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Stat Badges Skeleton */}
          <div className="flex neu-pressed rounded-xl overflow-hidden p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-2">
                <div className="h-3 w-12 bg-slate-300 dark:bg-slate-700/50 rounded animate-pulse mb-1" />
                <div className="h-4 w-8 bg-slate-300 dark:bg-slate-700/50 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="h-10 w-40 neu-button rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="neu-flat rounded-2xl p-6"
          >
            {/* Top Row */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl neu-pressed animate-pulse" />
                <div>
                  <div className="h-3 w-20 bg-slate-300 dark:bg-slate-700/50 rounded animate-pulse mb-1" />
                  <div className="h-2 w-16 bg-slate-300 dark:bg-slate-700/50 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-6 h-6 rounded neu-pressed animate-pulse" />
            </div>

            {/* Title */}
            <div className="h-6 w-full neu-pressed rounded animate-pulse mb-2" />
            <div className="h-6 w-3/4 neu-pressed rounded animate-pulse mb-6" />

            {/* Meta Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-20 bg-slate-300 dark:bg-slate-700/50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-300 dark:bg-slate-700/50 rounded animate-pulse" />
            </div>

            {/* Status Badge */}
            <div className="h-7 w-24 neu-pressed rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
