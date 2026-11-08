import Link from "next/link"
import { Lock } from "lucide-react"
import { getSummarySoft } from "../api"
import { hasFinanceSession } from "../session"
import { Money } from "./money"
import { Tile } from "./summary-tiles"

/**
 * Compact money row for /dashboard. No cookie → no finance call, just a small
 * unlock link. Locked (423) → the same link; never a redirect.
 */
export async function DashboardMoneyRow() {
  const summary = (await hasFinanceSession()) ? await getSummarySoft().catch(() => null) : null
  if (!summary) {
    return (
      <Link
        href="/finance/unlock?next=%2Fdashboard"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <Lock className="size-3" /> Unlock finance to see money this month
      </Link>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Tile label="Sales this month" href="/finance" footer={<>Last month <Money value={summary.lastMonth.sales} /></>}>
        <Money value={summary.thisMonth.sales} />
      </Tile>
      <Tile label="Net profit this month" href="/finance" footer={<>Last month <Money value={summary.lastMonth.netProfit} /></>}>
        <Money value={summary.thisMonth.netProfit} tone />
      </Tile>
      <Tile label="Money in stock" href="/finance/reports?tab=stock">
        <Money value={summary.moneyInStock} />
      </Tile>
      <Tile label="Owed to sellers" href="/finance/reports?tab=dues" footer={<>Owed by buyers <Money value={summary.owedByBuyers} /></>}>
        <Money value={summary.owedToSellers} />
      </Tile>
    </div>
  )
}
