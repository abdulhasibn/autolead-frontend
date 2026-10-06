import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buildLeadsHref, type LeadsSearchParams } from "../search-params"

interface LeadsPaginationProps {
  params: LeadsSearchParams
  total: number
  pageSize: number
}

export function LeadsPagination({ params, total, pageSize }: LeadsPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(params.page, pageCount)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const linkClass = (disabled: boolean) =>
    cn(
      buttonVariants({ variant: "outline", size: "sm" }),
      disabled && "pointer-events-none opacity-50"
    )

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 text-sm"
    >
      <p className="text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildLeadsHref({ ...params, page: page - 1 })}
          className={linkClass(page <= 1)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
        >
          <ChevronLeft />
          Previous
        </Link>
        <span className="text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Link
          href={buildLeadsHref({ ...params, page: page + 1 })}
          className={linkClass(page >= pageCount)}
          aria-disabled={page >= pageCount}
          tabIndex={page >= pageCount ? -1 : undefined}
        >
          Next
          <ChevronRight />
        </Link>
      </div>
    </nav>
  )
}
