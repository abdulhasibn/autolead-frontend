import Link from "next/link"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { buildOwnersHref, OWNERS_PAGE_SIZE, type OwnersSearchParams } from "../search-params"

interface OwnersPaginationProps {
  params: OwnersSearchParams
  total: number
  pageSize?: number
}

const LINK_CLASS =
  "border-border bg-background text-secondary-foreground hover:border-accent-border hover:bg-accent hover:text-accent-foreground"

export function OwnersPagination({
  params,
  total,
  pageSize = OWNERS_PAGE_SIZE,
}: OwnersPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(params.page, pageCount)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const atStart = page <= 1
  const atEnd = page >= pageCount

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent className="gap-2">
          <PaginationItem>
            <PaginationPrevious
              render={<Link href={buildOwnersHref({ ...params, page: page - 1 })} />}
              aria-disabled={atStart}
              tabIndex={atStart ? -1 : undefined}
              className={cn(LINK_CLASS, "h-7 border", atStart && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="font-mono-data text-xs text-muted-foreground">
              Page {page} of {pageCount}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              render={<Link href={buildOwnersHref({ ...params, page: page + 1 })} />}
              aria-disabled={atEnd}
              tabIndex={atEnd ? -1 : undefined}
              className={cn(LINK_CLASS, "h-7 border", atEnd && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
