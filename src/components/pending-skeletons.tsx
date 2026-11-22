import { Skeleton } from "@/components/ui/skeleton"

/**
 * Data-area skeletons shared by each route's `loading.tsx` (first load) and
 * its `<RoutePending>` fallback (filter / tab / page changes).
 */

export function TableRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card" aria-busy="true" aria-label="Loading">
      <div className="h-10 border-b border-border/50 bg-card/50" />
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8 rounded-full bg-accent" />
            <Skeleton className="h-4 w-40 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/5] rounded-2xl bg-muted" />
      ))}
    </div>
  )
}

export function DashboardBodySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <Skeleton className="h-3 w-20 bg-muted rounded" />
            <Skeleton className="h-8 w-16 bg-border rounded" />
            <Skeleton className="h-3 w-28 bg-muted rounded" />
          </div>
        ))}
      </div>
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

export function LedgerBodySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading entries">
      <div className="grid grid-cols-3 divide-x divide-muted rounded-xl border border-border bg-card">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2 px-3 py-3 sm:px-4">
            <Skeleton className="h-3 w-16 rounded bg-muted" />
            <Skeleton className="h-6 w-20 rounded bg-border" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-10 border-b border-border/50 bg-card/50" />
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-3 w-16 rounded bg-muted" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full bg-accent" />
                  <Skeleton className="h-5 w-12 rounded-full bg-accent" />
                </div>
                <Skeleton className="h-3 w-40 max-w-full rounded bg-muted" />
              </div>
              <Skeleton className="h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReportBodySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading report">
      <Skeleton className="h-72 rounded-xl border border-border bg-card" />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-10 border-b border-border/50 bg-card/50" />
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <Skeleton className="h-4 w-40 rounded bg-muted" />
              <Skeleton className="h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
