import type { Metadata } from "next"
import { Suspense } from "react"
import { MobileActionBar } from "@/components/mobile-action-bar"
import { ApiError } from "@/lib/api-error"
import { getEntries, getShowrooms, getTags } from "@/features/finance/api"
import { EntriesPanel, AddEntryButtons } from "@/features/finance/components/ledger/entries-panel"
import { LedgerPagination } from "@/features/finance/components/ledger/ledger-pagination"
import { LedgerToolbar } from "@/features/finance/components/ledger/ledger-toolbar"
import { TotalsBar } from "@/features/finance/components/ledger/totals-bar"
import { TruncatedBanner } from "@/features/finance/components/notices"
import { financeErrorMessage } from "@/features/finance/logic/errors"
import {
  ENTRIES_PAGE_SIZE,
  parseEntrySearchParams,
  toEntryQuery,
  type RawSearchParams,
} from "@/features/finance/search-params"
import type { EntryPage } from "@/features/finance/types"

export const metadata: Metadata = { title: "Ledger" }

const RANGE_CODES = new Set(["DATE_RANGE_TOO_LONG", "DATE_RANGE_REQUIRED", "INVALID_DATE_RANGE"])

export default async function LedgerPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams
  const filters = parseEntrySearchParams(raw)
  const [tags, showrooms] = await Promise.all([getTags(true), getShowrooms()])

  let page: EntryPage | null = null
  let rangeError = filters.rangeError
  if (!rangeError) {
    try {
      page = await getEntries(toEntryQuery(filters))
    } catch (err) {
      if (ApiError.isApiError(err) && RANGE_CODES.has(err.code)) {
        rangeError = financeErrorMessage(err)
      } else {
        throw err
      }
    }
  }

  const toolbarKey = JSON.stringify(raw)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Every rupee in or out.</p>
        <MobileActionBar>
          <AddEntryButtons tags={tags} showrooms={showrooms} />
        </MobileActionBar>
      </div>
      <Suspense>
        <LedgerToolbar key={toolbarKey} filters={{ ...filters, rangeError }} tags={tags} showrooms={showrooms} />
      </Suspense>
      {page && (
        <>
          <TruncatedBanner truncated={page.truncated} />
          <TotalsBar totals={page.totals} count={page.total} />
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <EntriesPanel
              entries={page.items}
              tags={tags}
              showrooms={showrooms}
              emptyMessage="No entries match these filters."
              footer={
                <Suspense>
                  <LedgerPagination page={filters.page} total={page.total} pageSize={ENTRIES_PAGE_SIZE} />
                </Suspense>
              }
            />
          </div>
        </>
      )}
    </div>
  )
}
