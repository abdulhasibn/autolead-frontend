export default function VehicleLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading vehicle">
      <div className="h-5 w-24 animate-pulse rounded bg-[#E5E7EB]" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-5 w-80 max-w-full animate-pulse rounded bg-[#E5E7EB]" />
        </div>
        <div className="h-9 w-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[260px] animate-pulse rounded-xl bg-[#E2E8F0] sm:h-[400px]" />
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-white" />
          <div className="h-52 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-white" />
    </div>
  )
}
