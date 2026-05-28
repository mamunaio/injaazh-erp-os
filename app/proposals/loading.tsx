export default function ProposalsLoading() {
  return (
    <div className="min-h-screen p-8 text-slate-800 dark:text-slate-200">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Stat Badges Skeleton */}
          <div className="flex bg-white/70 dark:bg-purple-950/10 backdrop-blur-md border border-slate-200 dark:border-purple-500/10 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10 last:border-r-0">
                <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="h-10 w-40 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-purple-950/20 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 shadow-sm dark:shadow-none"
          >
            {/* Top Row */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div>
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                  <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>

            {/* Title */}
            <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />

            {/* Meta Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>

            {/* Status Badge */}
            <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
