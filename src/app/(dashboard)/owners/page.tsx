import type { Metadata } from "next"
import { Users } from "lucide-react"
import { getOwners } from "@/features/owners/api"
import { CreateOwnerSheet } from "@/features/owners/components/create-owner-sheet"
import { OwnersPagination } from "@/features/owners/components/owners-pagination"
import { OwnersTable } from "@/features/owners/components/owners-table"
import { OwnersToolbar } from "@/features/owners/components/owners-toolbar"
import {
  OWNERS_PAGE_SIZE,
  pageToOffset,
  parseOwnersSearchParams,
  type RawSearchParams,
} from "@/features/owners/search-params"

export const metadata: Metadata = { title: "Owners" }

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const params = parseOwnersSearchParams(await searchParams)

  const ownersPage = await getOwners({
    search: params.q,
    city: params.city,
    limit: OWNERS_PAGE_SIZE,
    offset: pageToOffset(params.page),
  })

  const { items: owners, total } = ownersPage
  const hasFilters = Boolean(params.q || params.city)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Owners</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {total === 1 ? "owner" : "owners"}
            {hasFilters ? " match the filters" : ""}
          </p>
        </div>
        <CreateOwnerSheet />
      </div>

      <OwnersToolbar params={params} />

      {owners.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-accent">
            <Users className="size-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No owners found</p>
          <p className="text-xs text-subtle-foreground">
            {hasFilters
              ? "Try a different search or clear the filters."
              : "Add your first owner to get started."}
          </p>
        </div>
      ) : (
        <OwnersTable owners={owners} />
      )}

      {total > 0 && (
        <OwnersPagination params={params} total={total} />
      )}
    </div>
  )
}
