import Link from "next/link"
import { SearchX } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export default function VehicleNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white py-16 text-center">
      <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-[#F0FDFA]">
        <SearchX className="size-5 text-[#0D9488]" />
      </div>
      <p className="text-sm font-semibold text-[#111827]">Vehicle not found</p>
      <p className="text-xs text-[#9CA3AF]">
        It may have been removed, or you may not have access to it.
      </p>
      <Link href="/vehicles" className={buttonVariants({ className: "mt-2" })}>
        Back to vehicles
      </Link>
    </div>
  )
}
