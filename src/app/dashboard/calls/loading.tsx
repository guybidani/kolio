import { CallCardSkeleton } from '@/components/dashboard/call-card'

export default function CallsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-20 rounded" />
          <div className="skeleton h-4 w-48 rounded" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="skeleton h-10 flex-1 rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <CallCardSkeleton />
        <CallCardSkeleton />
        <CallCardSkeleton />
        <CallCardSkeleton />
      </div>
    </div>
  )
}
