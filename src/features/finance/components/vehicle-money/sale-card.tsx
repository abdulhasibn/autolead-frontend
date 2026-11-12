"use client"

import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { DatePicker, pastDateYears } from "@/components/ui/date-picker"
import { FormField } from "@/features/leads/components/form-field"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import { recordSaleAction, removeSaleAction } from "../../actions"
import { formatYmd, todayIST } from "../../logic/dates"
import { financeErrorMessage } from "../../logic/errors"
import { formatMoney, formatMoneyInput, parseMoneyInput } from "../../logic/money"
import { PAID_OPTIONS } from "../../logic/payment"
import { buildSale, type BuyerPaid, type SaleForm } from "../../logic/sale"
import type { VehicleSale } from "../../types"
import { Money } from "../money"
import { MoneyInput } from "../money-input"
import { useSaveTransition } from "@/hooks/use-save-transition"

const EMPTY_FORM: SaleForm = { price: "", soldOn: "", paid: "none", paidAmount: "", paidOn: "" }

/**
 * Finalised price and date, plus what the buyer has paid so far — that is saved
 * as a "payment from buyer" entry so it shows in the ledger and cash flow.
 * Recording a sale doesn’t change the car’s status (that follows leads).
 */
export function SaleCard({
  vehicleId,
  sale,
  suggestedPrice,
  receivedFromBuyer,
}: {
  vehicleId: string
  sale: VehicleSale | null
  suggestedPrice: number | null
  /** Sum of the car's payments from the buyer so far. */
  receivedFromBuyer: number
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<SaleForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof SaleForm, string>>>({})
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  const set = <K extends keyof SaleForm>(key: K, value: SaleForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors({})
  }

  function startEdit() {
    const today = todayIST()
    setForm({
      price: formatMoneyInput(sale?.finalisedPrice ?? suggestedPrice),
      soldOn: sale?.soldOn ?? today,
      paid: "none",
      paidAmount: "",
      paidOn: today,
    })
    setErrors({})
    setEditing(true)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const result = buildSale(form, receivedFromBuyer)
    if (!result.ok) return setErrors(result.errors)
    startTransition(async () => {
      const saved = await recordSaleAction(vehicleId, result.payload)
      if (!saved.ok) return void toast.error(financeErrorMessage(saved.error))
      toast.success(result.payload.payment ? "Sale and buyer payment recorded." : "Sale recorded.")
      refresh(() => setEditing(false))
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await removeSaleAction(vehicleId)
      if (!result.ok) return void toast.error(financeErrorMessage(result.error))
      toast.success("Sale removed.")
      refresh(() => setConfirmRemove(false))
    })
  }

  if (editing) {
    const price = parseMoneyInput(form.price)
    const due = price === null ? null : price - receivedFromBuyer
    const partAmount = parseMoneyInput(form.paidAmount)
    const firstError = errors.price ?? errors.soldOn ?? errors.paid
    return (
      <form onSubmit={submit} aria-label="Record sale" className="space-y-3 rounded-xl border border-primary/40 p-4">
        <h3 className="text-sm font-semibold">Sale</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="sale-price" label="Finalised price">
            <MoneyInput id="sale-price" value={form.price} onValueChange={(v) => set("price", v)} aria-invalid={errors.price ? true : undefined} />
          </FormField>
          <FormField id="sale-date" label="Sold on">
            <DatePicker {...pastDateYears()} id="sale-date" value={form.soldOn} onChange={(v) => set("soldOn", v)} />
          </FormField>
        </div>

        <FormField id="sale-paid" label={receivedFromBuyer > 0 ? "Received from the buyer now" : "Received from the buyer"}>
          <SegmentedChoice
            id="sale-paid"
            aria-label="Received from the buyer"
            value={form.paid}
            onValueChange={(v) => set("paid", v as BuyerPaid)}
            options={PAID_OPTIONS}
          />
        </FormField>

        {form.paid !== "none" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {form.paid === "part" && (
              <FormField id="sale-paid-amount" label="Amount received" error={errors.paidAmount}>
                <MoneyInput
                  id="sale-paid-amount"
                  value={form.paidAmount}
                  onValueChange={(v) => set("paidAmount", v)}
                  aria-invalid={errors.paidAmount ? true : undefined}
                />
              </FormField>
            )}
            <FormField id="sale-paid-on" label="Received on" error={errors.paidOn}>
              <DatePicker {...pastDateYears()} id="sale-paid-on" value={form.paidOn} onChange={(v) => set("paidOn", v)} invalid={!!errors.paidOn} />
            </FormField>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {receivedFromBuyer > 0 && `${formatMoney(receivedFromBuyer)} already received. `}
          {form.paid === "full" && due !== null && due > 0
            ? `${formatMoney(due)} will be recorded as received from the buyer.`
            : form.paid === "part" && due !== null && partAmount !== null && partAmount > 0 && partAmount < due
              ? `${formatMoney(due - partAmount)} will still be owed by the buyer.`
              : "Later payments go in Entries as “Payment from buyer”."}
        </p>

        {firstError && <p className="text-xs text-destructive">{firstError}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={isPending}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="animate-spin" />}Save sale</Button>
        </div>
      </form>
    )
  }

  return (
    <section aria-label="Sale" className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Sale</h3>
        <div className="flex gap-1">
          {sale && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmRemove(true)}>
              <Trash2 /> Remove
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={startEdit}>{sale ? "Edit" : "Record sale"}</Button>
        </div>
      </div>
      {sale ? (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Finalised price</dt>
            <dd className="font-semibold"><Money value={sale.finalisedPrice} /></dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sold on</dt>
            <dd>{formatYmd(sale.soldOn)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Not recorded. The car’s status still follows its leads.</p>
      )}
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={(o) => !isPending && setConfirmRemove(o)}
        title="Remove this sale?"
        description="Use this only for a sale recorded by mistake. Profit goes back to “—” until a sale is recorded again."
        confirmLabel="Remove sale"
        pendingLabel="Removing…"
        pending={isPending}
        onConfirm={remove}
      />
    </section>
  )
}
