import type { EntryTotals } from "../../types"
import { Money } from "../money"

/** Totals over every matching entry, not just this page. */
export function TotalsBar({ totals, count }: { totals: EntryTotals; count: number }) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-muted rounded-xl border border-border bg-card">
      <div className="px-3 py-3 sm:px-4">
        <dt className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Money in</dt>
        <dd className="mt-1 text-base font-semibold sm:text-lg">
          <Money value={totals.income} />
        </dd>
      </div>
      <div className="px-3 py-3 sm:px-4">
        <dt className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Money out</dt>
        <dd className="mt-1 text-base font-semibold sm:text-lg">
          <Money value={totals.expense} />
        </dd>
      </div>
      <div className="px-3 py-3 sm:px-4">
        <dt className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
          Net <span className="normal-case">· {count} {count === 1 ? "entry" : "entries"}</span>
        </dt>
        <dd className="mt-1 text-base font-semibold sm:text-lg">
          <Money value={totals.net} signed tone />
        </dd>
      </div>
    </dl>
  )
}
