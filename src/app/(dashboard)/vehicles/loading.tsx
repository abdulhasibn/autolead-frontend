export default function VehiclesLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading vehicles">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-4 w-36 animate-pulse rounded bg-[#E5E7EB]" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-[#E5E7EB]" />
      </div>
      <div className="h-9 w-96 max-w-full animate-pulse rounded-lg bg-[#E5E7EB]" />
      <div className="flex gap-2">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-[#E5E7EB]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E2E8F0]" />
        ))}
      </div>
    </div>
  )
}
