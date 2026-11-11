import { Skeleton } from "@/components/ui/skeleton"

/** Body of an insights tab: KPI grid, a wide chart and two half-width cards. */
export function InsightsTabSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6" aria-busy="true" aria-label="Loading insights">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-20 rounded bg-muted" />
            <Skeleton className="h-8 w-16 rounded bg-border" />
          </div>
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl border border-border bg-card" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl border border-border bg-card" />
        <Skeleton className="h-72 rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}
