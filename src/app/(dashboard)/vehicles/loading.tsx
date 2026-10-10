import { Skeleton } from "@/components/ui/skeleton"

export default function VehiclesLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading vehicles">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28 rounded bg-border" />
          <Skeleton className="h-4 w-36 rounded bg-border" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg bg-border" />
      </div>
      <Skeleton className="h-9 w-96 max-w-full rounded-lg bg-border" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-72 rounded-lg bg-border" />
        <Skeleton className="h-9 w-24 rounded-lg bg-border" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl bg-[#E2E8F0]" />
        ))}
      </div>
    </div>
  )
}
