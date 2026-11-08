import { Skeleton } from "@/components/ui/skeleton"

export default function InsightsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading insights">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32 bg-border rounded-lg" />
            <Skeleton className="h-4 w-56 bg-muted rounded" />
          </div>
          <Skeleton className="h-9 w-64 bg-accent rounded-lg" />
        </div>
        <Skeleton className="h-8 w-60 bg-muted rounded-lg" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <Skeleton className="h-3 w-20 bg-muted rounded" />
            <Skeleton className="h-8 w-16 bg-border rounded" />
          </div>
        ))}
      </div>

      <Skeleton className="bg-card rounded-xl border border-border h-72" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="bg-card rounded-xl border border-border h-72" />
        <Skeleton className="bg-card rounded-xl border border-border h-72" />
      </div>
    </div>
  )
}
