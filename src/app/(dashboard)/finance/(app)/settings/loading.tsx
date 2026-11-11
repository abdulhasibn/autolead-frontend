import { Skeleton } from "@/components/ui/skeleton"

function CardHeader({ width }: { width: string }) {
  return (
    <div className="border-b border-border px-4 py-3">
      <Skeleton className={`h-4 rounded bg-border ${width}`} />
    </div>
  )
}

export default function FinanceSettingsLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Loading finance settings">
      <div className="rounded-xl border border-border bg-card lg:row-span-2">
        <CardHeader width="w-16" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-3 w-full max-w-sm rounded bg-muted" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg bg-border" />
            <Skeleton className="h-9 w-20 rounded-lg bg-border" />
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <Skeleton className="h-6 w-24 rounded-full bg-accent" />
              <Skeleton className="size-8 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <CardHeader width="w-36" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-9 w-full rounded-lg bg-border" />
          <Skeleton className="h-9 w-32 rounded-lg bg-border" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <CardHeader width="w-12" />
        <div className="flex items-center justify-between gap-3 p-4">
          <Skeleton className="h-4 w-56 max-w-full rounded bg-muted" />
          <Skeleton className="h-9 w-24 rounded-lg bg-border" />
        </div>
      </div>
    </div>
  )
}
