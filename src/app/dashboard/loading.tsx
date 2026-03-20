import { StatsOverviewSkeleton } from '@/components/dashboard/stats-overview'
import { CallCardSkeleton } from '@/components/dashboard/call-card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-7 w-32 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      <StatsOverviewSkeleton />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-5 pb-3">
              <div className="skeleton h-5 w-24 rounded" />
            </div>
            <div className="px-5 pb-5 space-y-3">
              <CallCardSkeleton />
              <CallCardSkeleton />
              <CallCardSkeleton />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="skeleton h-5 w-32 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-4 w-4 rounded" />
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
              <div className="skeleton h-5 w-10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
