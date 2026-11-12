import Link from "next/link"
import { Lock } from "lucide-react"
import { Money } from "../money"
import { EntriesPanel } from "../ledger/entries-panel"
import type { CarMoney, EntryPage, FinanceTag, ShowroomOption } from "../../types"
import { DealCard } from "./deal-card"
import { NumbersCard } from "./numbers-card"
import { QuotesCard } from "./quotes-card"
import { SaleCard } from "./sale-card"

export function MoneyLocked({ vehicleId }: { vehicleId: string }) {
  const next = encodeURIComponent(`/vehicles/${vehicleId}?tab=money`)
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary">
        <Lock className="size-4" />
      </span>
      <p className="text-sm text-muted-foreground">Unlock finance to see money for this car.</p>
      <Link
        href={`/finance/unlock?next=${next}`}
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 pointer-coarse:h-11"
      >
        Unlock finance
      </Link>
    </div>
  )
}

export function MoneyTab({
  money,
  entries,
  tags,
  showrooms,
}: {
  money: CarMoney
  entries: EntryPage
  tags: FinanceTag[]
  showrooms: ShowroomOption[]
}) {
  return (
    <div className="space-y-4">
      <NumbersCard money={money} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DealCard vehicleId={money.vehicleId} deal={money.deal} saleModel={money.vehicle.saleModel} />
        <SaleCard
          vehicleId={money.vehicleId}
          sale={money.sale}
          suggestedPrice={money.currentQuote?.amount ?? money.listedPrice}
          receivedFromBuyer={money.receivedFromBuyer}
        />
      </div>
      <QuotesCard vehicleId={money.vehicleId} quotes={money.quotes} />
      <section aria-label="Entries for this car" className="rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-muted px-4 py-3">
          <h3 className="text-sm font-semibold">Entries</h3>
          <p className="text-xs text-muted-foreground">
            In <Money value={entries.totals.income} /> · Out <Money value={entries.totals.expense} /> · Net{" "}
            <Money value={entries.totals.net} tone signed />
          </p>
        </div>
        <div className="sm:p-4">
          <EntriesPanel
            entries={entries.items}
            tags={tags}
            showrooms={showrooms}
            vehicle={money.vehicle}
            showAddButtons
            emptyMessage="No money in or out on this car yet."
          />
        </div>
        {entries.total > entries.items.length && (
          <div className="border-t border-muted px-4 py-3 text-center">
            <Link
              href={`/finance/entries?vehicleId=${money.vehicleId}&vehicleLabel=${encodeURIComponent(money.vehicle.label)}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              See all {entries.total} entries in the ledger →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
