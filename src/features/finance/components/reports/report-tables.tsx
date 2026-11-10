import Link from "next/link"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatBucketLabel, formatYmd } from "../../logic/dates"
import type { CashFlowReport, DuesReport, PnlLine, PnlReport, SaleModel, StockReport, VehicleProfitReport } from "../../types"
import { Money } from "../money"

const NUM = "text-right font-mono-data whitespace-nowrap"

function CarLink({ id, label }: { id: string; label: string }) {
  return (
    <Link href={`/vehicles/${id}?tab=money#vehicle-tabs`} className="font-medium hover:text-primary hover:underline">
      {label}
    </Link>
  )
}

/** Purchase rate, or "4% commission" for a car sold for the owner. */
function TermsCell({ row, missing }: { row: { saleModel: SaleModel; purchaseRate: number | null; commissionPercent: number | null }; missing?: boolean }) {
  const value = row.saleModel === "commission" ? row.commissionPercent : row.purchaseRate
  if (value == null) return missing ? <span className="text-xs text-warning">Missing</span> : <Money value={null} />
  return row.saleModel === "commission" ? (
    <span className="text-xs font-medium whitespace-nowrap">{row.commissionPercent}% commission</span>
  ) : (
    <Money value={row.purchaseRate} />
  )
}

/** Wide tables scroll sideways inside their card on phones, never the page. */
function Scroll({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}

const PNL_ROWS: Array<{ key: keyof PnlLine; label: string; tone?: boolean; strong?: boolean; count?: boolean; negate?: boolean }> = [
  { key: "sales", label: "Sales" },
  { key: "costOfSales", label: "Cost of sales", negate: true },
  { key: "commissions", label: "Commissions" },
  { key: "grossProfit", label: "Gross profit", tone: true, strong: true },
  { key: "laterCarCosts", label: "Later car costs", negate: true },
  { key: "otherIncome", label: "Other income" },
  { key: "businessExpenses", label: "Business expenses", negate: true },
  { key: "netProfit", label: "Net profit", tone: true, strong: true },
  { key: "carsSold", label: "Cars sold", count: true },
]

/** Periods as columns, lines as rows (reads like a P&L statement). */
export function PnlTable({ report }: { report: PnlReport }) {
  return (
    <Scroll>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card">Line</TableHead>
            {report.buckets.map((b) => (
              <TableHead key={b.start} className="text-right whitespace-nowrap">
                {formatBucketLabel(b.label, report.period)}
              </TableHead>
            ))}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PNL_ROWS.map((row) => (
            <TableRow key={row.key} className={cn(row.strong && "bg-muted/40 font-semibold")}>
              <TableCell className="sticky left-0 bg-card whitespace-nowrap">{row.label}</TableCell>
              {[...report.buckets, report.totals].map((b, i) => (
                <TableCell key={i} className={cn(NUM, i === report.buckets.length && "font-semibold")}>
                  {row.count ? (
                    <>
                      {b.carsSold}
                      {b.carsMissingPurchaseRate > 0 && (
                        <span className="text-warning" title="Cars without a purchase rate or commission %">
                          {" "}
                          (+{b.carsMissingPurchaseRate})
                        </span>
                      )}
                    </>
                  ) : (
                    <Money value={row.negate && b[row.key] ? -b[row.key] : b[row.key]} tone={row.tone || row.negate} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Scroll>
  )
}

export function CashFlowTable({ report }: { report: CashFlowReport }) {
  return (
    <Scroll>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">From buyers</TableHead>
            <TableHead className="text-right">Other in</TableHead>
            <TableHead className="text-right">To sellers</TableHead>
            <TableHead className="text-right">Car costs</TableHead>
            <TableHead className="text-right">Business</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="text-right">Running net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.buckets.map((b) => (
            <TableRow key={b.start}>
              <TableCell className="whitespace-nowrap">{formatBucketLabel(b.label, report.period)}</TableCell>
              <TableCell className={NUM}><Money value={b.inFromBuyers} /></TableCell>
              <TableCell className={NUM}><Money value={b.inOther} /></TableCell>
              <TableCell className={NUM}><Money value={b.outToSellers} /></TableCell>
              <TableCell className={NUM}><Money value={b.outCarCosts} /></TableCell>
              <TableCell className={NUM}><Money value={b.outBusiness} /></TableCell>
              <TableCell className={NUM}><Money value={b.net} tone signed /></TableCell>
              <TableCell className={NUM}><Money value={b.cumulative} tone /></TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell className={NUM}><Money value={report.totals.inFromBuyers} /></TableCell>
            <TableCell className={NUM}><Money value={report.totals.inOther} /></TableCell>
            <TableCell className={NUM}><Money value={report.totals.outToSellers} /></TableCell>
            <TableCell className={NUM}><Money value={report.totals.outCarCosts} /></TableCell>
            <TableCell className={NUM}><Money value={report.totals.outBusiness} /></TableCell>
            <TableCell className={NUM}><Money value={report.totals.net} tone signed /></TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </Scroll>
  )
}

export function VehicleProfitTable({ report }: { report: VehicleProfitReport }) {
  if (report.items.length === 0) return <p className="px-4 py-8 text-center text-xs text-subtle-foreground">No cars sold in this range.</p>
  return (
    <Scroll>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Sold on</TableHead>
            <TableHead className="text-right">Terms</TableHead>
            <TableHead className="text-right">Costs</TableHead>
            <TableHead className="text-right">Landing cost</TableHead>
            <TableHead className="text-right">Sale price</TableHead>
            <TableHead className="text-right">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.items.map((r) => (
            <TableRow key={r.vehicle.id}>
              <TableCell className="max-w-56 truncate"><CarLink id={r.vehicle.id} label={r.vehicle.label} /></TableCell>
              <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatYmd(r.soldOn)}</TableCell>
              <TableCell className={NUM}><TermsCell row={r} missing /></TableCell>
              <TableCell className={NUM}><Money value={r.costs} /></TableCell>
              <TableCell className={NUM}>
                {r.saleModel === "commission" ? (
                  <span className="text-xs text-muted-foreground" title="Costs come out of the owner's payout">Owner pays</span>
                ) : (
                  <Money value={r.purchaseRate == null ? null : r.landingCost} />
                )}
              </TableCell>
              <TableCell className={NUM}><Money value={r.finalisedPrice} /></TableCell>
              <TableCell className={NUM}>
                {r.profit == null ? (
                  <Link href={`/vehicles/${r.vehicle.id}?tab=money#vehicle-tabs`} className="text-xs text-warning underline-offset-2 hover:underline">
                    {r.saleModel === "commission" ? "% missing" : "rate missing"}
                  </Link>
                ) : (
                  <Money value={r.profit} tone signed className="font-semibold" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>
              {report.totals.cars} {report.totals.cars === 1 ? "car" : "cars"}
              {report.totals.carsMissingPurchaseRate > 0 && (
                <span className="text-xs font-normal text-muted-foreground"> · totals exclude {report.totals.carsMissingPurchaseRate} without a purchase rate or commission %</span>
              )}
            </TableCell>
            <TableCell className={NUM}><Money value={report.totals.landingCost} /></TableCell>
            <TableCell className={NUM}><Money value={report.totals.sales} /></TableCell>
            <TableCell className={NUM}><Money value={report.totals.profit} tone signed /></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Scroll>
  )
}

export function DuesTable({ report }: { report: DuesReport }) {
  if (report.items.length === 0) return <p className="px-4 py-8 text-center text-xs text-subtle-foreground">Nothing owed either way.</p>
  return (
    <Scroll>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead className="text-right">Terms</TableHead>
            <TableHead className="text-right">Paid to seller / owner</TableHead>
            <TableHead className="text-right">Owed to seller / owner</TableHead>
            <TableHead className="text-right">Sale price</TableHead>
            <TableHead className="text-right">From buyer</TableHead>
            <TableHead className="text-right">Owed by buyer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.items.map((r) => (
            <TableRow key={r.vehicle.id}>
              <TableCell className="max-w-56 truncate"><CarLink id={r.vehicle.id} label={r.vehicle.label} /></TableCell>
              <TableCell className={NUM}><TermsCell row={r} /></TableCell>
              <TableCell className={NUM}><Money value={r.paidToSeller} /></TableCell>
              <TableCell className={NUM}><Money value={r.owedToSeller} tone className="font-semibold" /></TableCell>
              <TableCell className={NUM}><Money value={r.finalisedPrice} /></TableCell>
              <TableCell className={NUM}><Money value={r.receivedFromBuyer} /></TableCell>
              <TableCell className={NUM}><Money value={r.owedByBuyer} tone className="font-semibold" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Still owed</TableCell>
            <TableCell className={NUM}><Money value={report.totals.owedToSellers} /></TableCell>
            <TableCell colSpan={2} />
            <TableCell className={NUM}><Money value={report.totals.owedByBuyers} /></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <p className="px-4 py-2 text-[11px] text-subtle-foreground">
        Negative means overpaid. A commission car’s owner is owed the sale price minus our commission and the costs we paid.
      </p>
    </Scroll>
  )
}

const STATUS_LABEL: Record<string, string> = { open: "Open", linked: "Linked", dropped: "Dropped", sold: "Sold" }

export function StockTable({ report }: { report: StockReport }) {
  if (report.items.length === 0) return <p className="px-4 py-8 text-center text-xs text-subtle-foreground">No money tied up in unsold cars.</p>
  return (
    <Scroll>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Terms</TableHead>
            <TableHead className="text-right">Costs</TableHead>
            <TableHead className="text-right">Landing cost</TableHead>
            <TableHead className="text-right">Current quote</TableHead>
            <TableHead className="text-right">Listed price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.items.map((r) => (
            <TableRow key={r.vehicle.id}>
              <TableCell className="max-w-56 truncate"><CarLink id={r.vehicle.id} label={r.vehicle.label} /></TableCell>
              <TableCell className={cn("text-xs", r.status === "dropped" ? "text-warning" : "text-muted-foreground")}>
                {STATUS_LABEL[r.status] ?? r.status}
              </TableCell>
              <TableCell className={NUM}><TermsCell row={r} /></TableCell>
              <TableCell className={NUM}><Money value={r.costs} /></TableCell>
              <TableCell className={NUM}><Money value={r.landingCost} className="font-semibold" /></TableCell>
              <TableCell className={NUM}><Money value={r.currentQuote} /></TableCell>
              <TableCell className={NUM}><Money value={r.listedPrice} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>
              Money in stock · {report.totals.cars} {report.totals.cars === 1 ? "car" : "cars"}
            </TableCell>
            <TableCell className={NUM}><Money value={report.totals.moneyInStock} /></TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
    </Scroll>
  )
}
