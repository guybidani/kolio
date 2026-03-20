export default function ExecutiveLoading() {
  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-36 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-10 w-10 rounded-xl" />
            </div>
            <div className="skeleton h-8 w-20 rounded" />
            <div className="flex items-center gap-2">
              <div className="skeleton h-5 w-14 rounded-md" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="skeleton h-5 w-32 rounded mb-6" />
            <div className="skeleton h-[280px] w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-6 pb-4">
          <div className="skeleton h-5 w-28 rounded" />
        </div>
        <div className="px-6 pb-4">
          <div className="flex gap-4 py-3 border-b border-white/10">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-16 rounded" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-white/5">
              <div className="skeleton h-4 w-6 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-4 w-10 rounded" />
              <div className="skeleton h-4 w-10 rounded" />
              <div className="skeleton h-4 w-14 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Insights + Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="skeleton h-5 w-28 rounded mb-5" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="skeleton h-4 w-4 rounded shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Radar */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="skeleton h-5 w-28 rounded mb-2" />
        <div className="skeleton h-3 w-40 rounded mb-6" />
        <div className="skeleton h-[320px] w-full rounded-lg" />
      </div>
    </div>
  )
}
