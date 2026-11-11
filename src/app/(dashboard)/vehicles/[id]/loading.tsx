import { Skeleton } from "@/components/ui/skeleton"

export default function VehicleLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading vehicle">
      <Skeleton className="h-5 w-24 rounded bg-border" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded bg-border" />
          <Skeleton className="h-5 w-80 max-w-full rounded bg-border" />
        </div>
        <Skeleton className="h-9 w-48 rounded-lg bg-border max-sm:hidden" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] lg:gap-x-5">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-video rounded-xl bg-muted max-sm:-mx-4 max-sm:rounded-none" />
          <div className="hidden grid-rows-2 gap-2 sm:grid">
            <Skeleton className="rounded-xl bg-muted" />
            <Skeleton className="rounded-xl bg-muted" />
          </div>
        </div>
        <div className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Skeleton className="h-32 rounded-xl border border-border bg-card" />
          <Skeleton className="h-28 rounded-xl border border-border bg-card" />
          <Skeleton className="h-64 rounded-xl border border-border bg-card max-lg:hidden" />
        </div>
        <div className="space-y-4 lg:col-start-1 lg:row-start-2">
          <div className="flex gap-5 border-b border-muted pb-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-16 rounded bg-border" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl border border-border bg-card" />
        </div>
      </div>
    </div>
  )
}
