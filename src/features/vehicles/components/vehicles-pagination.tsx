import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buildVehiclesHref, type VehiclesSearchParams } from "../search-params"

interface VehiclesPaginationProps {
  params: VehiclesSearchParams
  total: number
  pageSize: number
}

export function VehiclesPagination({ params, total, pageSize }: VehiclesPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(params.page, pageCount)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const linkClass = (disabled: boolean) =>
    cn(
      buttonVariants({ variant: "outline", size: "sm" }),
      "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#CCFBF1] hover:bg-[#F0FDFA] hover:text-[#0D9488]",
      disabled && "pointer-events-none opacity-50"
    )

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm">
      <p className="text-xs text-[#6B7280]">
        Showing {from}–{to} of {total}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <Link
            href={buildVehiclesHref({ ...params, page: page - 1 })}
            className={linkClass(page <= 1)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
          >
            <ChevronLeft />
            Previous
          </Link>
          <span className="font-mono-data text-xs text-[#6B7280]">
            Page {page} of {pageCount}
          </span>
          <Link
            href={buildVehiclesHref({ ...params, page: page + 1 })}
            className={linkClass(page >= pageCount)}
            aria-disabled={page >= pageCount}
            tabIndex={page >= pageCount ? -1 : undefined}
          >
            Next
            <ChevronRight />
          </Link>
        </div>
      )}
    </nav>
  )
}
