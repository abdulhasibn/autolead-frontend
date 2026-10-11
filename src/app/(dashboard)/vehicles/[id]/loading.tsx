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
        <Skeleton className="h-9 w-48 rounded-lg bg-border" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[260px] rounded-xl bg-muted sm:h-[400px]" />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl bg-card" />
          <Skeleton className="h-52 rounded-xl bg-card" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-xl bg-card" />
    </div>
  )
}
