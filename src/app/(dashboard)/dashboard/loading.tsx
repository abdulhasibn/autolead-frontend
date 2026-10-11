import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 bg-border rounded-lg" />
          <Skeleton className="h-4 w-36 bg-muted rounded" />
        </div>
        <Skeleton className="h-9 w-64 bg-accent rounded-lg" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <Skeleton className="h-3 w-20 bg-muted rounded" />
            <Skeleton className="h-8 w-16 bg-border rounded" />
            <Skeleton className="h-3 w-28 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="bg-card rounded-xl border border-border h-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="bg-card rounded-xl border border-border h-48" />
            <Skeleton className="bg-card rounded-xl border border-border h-48" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="bg-card rounded-xl border border-border h-40" />
          <Skeleton className="bg-card rounded-xl border border-border h-36" />
          <Skeleton className="bg-card rounded-xl border border-border h-48" />
        </div>
      </div>
    </div>
  )
}
