export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-[#E5E7EB] rounded-lg" />
          <div className="h-4 w-36 bg-[#F3F4F6] rounded" />
        </div>
        <div className="h-9 w-64 bg-[#F0FDFA] rounded-lg" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3"
          >
            <div className="h-3 w-20 bg-[#F3F4F6] rounded" />
            <div className="h-8 w-16 bg-[#E5E7EB] rounded" />
            <div className="h-3 w-28 bg-[#F3F4F6] rounded" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] h-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] h-48" />
            <div className="bg-white rounded-xl border border-[#E5E7EB] h-48" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] h-40" />
          <div className="bg-white rounded-xl border border-[#E5E7EB] h-36" />
          <div className="bg-white rounded-xl border border-[#E5E7EB] h-48" />
        </div>
      </div>
    </div>
  )
}
