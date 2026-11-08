"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQueryState } from "../use-query-state"

export function LedgerPagination({ page, total, pageSize }: { page: number; total: number; pageSize: number }) {
  const { update, isPending } = useQueryState()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-muted px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => update({ page: page - 1 })}>
          <ChevronLeft /> Prev
        </Button>
        <span className="font-mono-data text-xs text-muted-foreground">
          {page}/{pageCount}
        </span>
        <Button variant="outline" size="sm" disabled={page >= pageCount || isPending} onClick={() => update({ page: page + 1 })}>
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
