import type { Metadata } from "next"
import { Users2 } from "lucide-react"
import { getLeads } from "@/features/leads/api"
import {
  LEADS_PAGE_SIZE,
  LEADS_SEARCH_SCAN_LIMIT,
} from "@/features/leads/constants"
import {
  matchesLeadSearch,
  pageToOffset,
  parseLeadsSearchParams,
  type RawSearchParams,
} from "@/features/leads/search-params"
import { getVehicleOptions } from "@/features/leads/vehicle-options"
import { CreateLeadDialog } from "@/features/leads/components/create-lead-dialog"
import { LeadsPagination } from "@/features/leads/components/leads-pagination"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadsToolbar } from "@/features/leads/components/leads-toolbar"

export const metadata: Metadata = { title: "Leads" }

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const params = parseLeadsSearchParams(await searchParams)

  // The API has no text search, so a search scans the newest leads (with the
  // other filters applied) and matches on the server instead of paginating.
  const [leadsPage, vehicles] = await Promise.all([
    getLeads({
      status: params.status,
      vehicleId: params.vehicleId,
      limit: params.q ? LEADS_SEARCH_SCAN_LIMIT : LEADS_PAGE_SIZE,
      offset: params.q ? 0 : pageToOffset(params.page),
    }),
    getVehicleOptions(),
  ])

  const leads = params.q
    ? leadsPage.items.filter((lead) => matchesLeadSearch(lead, params.q!))
    : leadsPage.items
  const searchTruncated = Boolean(params.q) && leadsPage.total > leadsPage.items.length
  const vehicleLabels = Object.fromEntries(vehicles.map((v) => [v.id, v.label]))
  const hasFilters = Boolean(params.q || params.status || params.vehicleId)
  const resultCount = params.q ? leads.length : leadsPage.total

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm">
            {resultCount} {resultCount === 1 ? "lead" : "leads"}
            {hasFilters ? " match the filters" : ""}
          </p>
        </div>
        <CreateLeadDialog vehicles={vehicles} />
      </div>

      <LeadsToolbar params={params} vehicles={vehicles} />

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Users2 className="text-muted-foreground size-8" />
          <p className="font-medium">No leads found</p>
          <p className="text-muted-foreground text-sm">
            {hasFilters
              ? "Try a different search or clear the filters."
              : "Create your first lead to get started."}
          </p>
        </div>
      ) : (
        <LeadsTable leads={leads} vehicleLabels={vehicleLabels} />
      )}

      {params.q ? (
        searchTruncated && (
          <p className="text-muted-foreground text-sm">
            Search covers the {LEADS_SEARCH_SCAN_LIMIT} most recent leads.
            Narrow it with the status or vehicle filter.
          </p>
        )
      ) : (
        leadsPage.total > 0 && (
          <LeadsPagination
            params={params}
            total={leadsPage.total}
            pageSize={LEADS_PAGE_SIZE}
          />
        )
      )}
    </div>
  )
}
