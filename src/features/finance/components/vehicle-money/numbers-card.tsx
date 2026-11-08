import type { CarMoney } from "../../types"
import { Money } from "../money"

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-sm text-muted-foreground">
        {label}
        {hint && <span className="block text-[11px] text-subtle-foreground">{hint}</span>}
      </dt>
      <dd className="text-right text-sm font-semibold">{children}</dd>
    </div>
  )
}

function owedHint(value: number | null, who: "seller" | "buyer"): string | undefined {
  if (value == null || value >= 0) return undefined
  return who === "seller" ? "Negative: you paid the seller more than the purchase rate" : "Negative: the buyer paid more than the sale price"
}

function profitHint(money: CarMoney): string {
  const missing = [
    money.flags.purchaseRateMissing && "the purchase rate",
    !money.flags.saleRecorded && "the sale",
  ].filter(Boolean)
  return `Profit shows once ${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} recorded`
}

/** Landing cost, profit and dues for one car. */
export function NumbersCard({ money }: { money: CarMoney }) {
  return (
    <section aria-label="Numbers" className="rounded-xl border border-border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Landing cost</p>
          <p className="mt-1 text-2xl font-bold">
            <Money value={money.flags.purchaseRateMissing ? null : money.landingCost} nullHint="Enter the purchase rate" />
          </p>
          <p className="text-xs text-muted-foreground">
            Purchase rate <Money value={money.deal?.purchaseRate ?? null} /> + costs <Money value={money.costs} />
          </p>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Profit</p>
          <p className="mt-1 text-2xl font-bold">
            <Money value={money.profit} tone signed nullHint={profitHint(money)} />
          </p>
          <p className="text-xs text-muted-foreground">
            {money.profit == null ? profitHint(money) : money.profit < 0 ? "Loss on this car" : "Sale price − landing cost"}
          </p>
        </div>
      </div>

      {money.costBreakdown.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Costs by tag</h4>
          <dl className="mt-1 divide-y divide-muted">
            {money.costBreakdown.map((g) => (
              <Row key={g.tag?.id ?? "untagged"} label={`${g.tag?.name ?? "Untagged"}${g.count > 1 ? ` ×${g.count}` : ""}`}>
                <Money value={g.amount} />
              </Row>
            ))}
          </dl>
        </div>
      )}

      <dl className="mt-4 grid gap-x-6 border-t border-muted pt-3 sm:grid-cols-2">
        <div>
          <Row label="Paid to seller">
            <Money value={money.paidToSeller} />
          </Row>
          <Row label="Owed to seller" hint={owedHint(money.owedToSeller, "seller")}>
            <Money value={money.owedToSeller} tone nullHint="Needs a purchase rate" />
          </Row>
        </div>
        <div>
          <Row label="Received from buyer">
            <Money value={money.receivedFromBuyer} />
          </Row>
          <Row label="Owed by buyer" hint={owedHint(money.owedByBuyer, "buyer")}>
            <Money value={money.owedByBuyer} tone nullHint="Needs the sale" />
          </Row>
        </div>
      </dl>
    </section>
  )
}
