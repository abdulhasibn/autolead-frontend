"use client"

import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DatePicker, pastDateYears } from "@/components/ui/date-picker"
import { FormField } from "@/features/leads/components/form-field"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import { recordSaleAction, removeSaleAction } from "../../actions"
import { formatYmd, todayIST } from "../../logic/dates"
import { financeErrorMessage } from "../../logic/errors"
import { formatMoney, formatMoneyInput, parseMoneyInput } from "../../logic/money"
import { PAID_OPTIONS } from "../../logic/payment"
import { buildSale, type BuyerPaid, type BuyerPaymentsChoice, type SaleForm, type SalePayload } from "../../logic/sale"
import type { BookedLead, VehicleSale } from "../../types"
import { saleBelowMinimumWarning } from "../../logic/price-warnings"
import { Money } from "../money"
import { MoneyInput } from "../money-input"
import { PriceWarning } from "../price-warning"
import { useSaveTransition } from "@/hooks/use-save-transition"

const EMPTY_FORM: SaleForm = { price: "", soldOn: "", paid: "none", paidAmount: "", paidOn: "", leadId: "" }

/**
 * Finalised price and date, plus what the buyer has paid so far — that is saved
 * as a "payment from buyer" entry so it shows in the ledger and cash flow.
 *
 * A sale closes against a lead. If the car is already sold (its lead was
 * converted from the CRM), only the price is recorded. Otherwise it needs a
 * lead whose booking is confirmed on this car: recording the sale converts
 * that lead, which marks the car sold.
 */
function leadLabel(lead: BookedLead): string {
  return [lead.name ?? "Unnamed lead", lead.phone].filter(Boolean).join(" · ")
}

export function SaleCard({
  vehicleId,
  sale,
  suggestedPrice,
  receivedFromBuyer,
  minimumSellingPrice,
  carSold,
  bookedLeads,
}: {
  vehicleId: string
  sale: VehicleSale | null
  suggestedPrice: number | null
  /** Sum of the car's payments from the buyer so far. */
  receivedFromBuyer: number
  /** The car's minimum selling price, if one is set; a lower sale price only warns. */
  minimumSellingPrice: number | null
  /** The car is already sold through a converted lead. */
  carSold: boolean
  /** Booking-confirmed leads on this car while it isn't sold. */
  bookedLeads: BookedLead[]
}) {
  const needsLead = !carSold
  const canRecord = carSold || bookedLeads.length > 0
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<SaleForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof SaleForm, string>>>({})
  const [confirmRemove, setConfirmRemove] = useState(false)
  /** A price below what the buyer has paid, waiting for "reduce" or "keep" (#31). */
  const [overpaid, setOverpaid] = useState<SalePayload | null>(null)
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
      // One booked lead is the buyer; with several, the admin picks.
      leadId: bookedLeads.length === 1 ? (bookedLeads[0]?.id ?? "") : "",
    })
    setErrors({})
    setEditing(true)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const result = buildSale(form, receivedFromBuyer, needsLead)
    if (!result.ok) return setErrors(result.errors)
    // The buyer has paid more than the new price: ask whether that payment was a mistake
    // or a real overpayment, instead of silently leaving a negative "owed by buyer".
    if (result.payload.finalisedPrice < receivedFromBuyer) return setOverpaid(result.payload)
    save(result.payload)
  }

  function save(payload: SalePayload, buyerPayments: BuyerPaymentsChoice | null = null) {
    startTransition(async () => {
      const saved = await recordSaleAction(vehicleId, { ...payload, buyerPayments })
      if (!saved.ok) {
        toast.error(financeErrorMessage(saved.error))
        // Stale payments, or a trim that landed without the price: show the real numbers.
        if (saved.error.code === "SALE_PRICE_BELOW_RECEIVED" || saved.error.code === "SALE_PAYMENT_TRIMMED_PRICE_NOT_SAVED") {
          refresh(() => setOverpaid(null))
        }
        return
      }
      const recorded =
        buyerPayments === "adjust"
          ? `Sale saved and the buyer’s payment reduced to ${formatMoney(payload.finalisedPrice)}`
          : buyerPayments === "keep"
            ? `Sale saved. The buyer is owed ${formatMoney(receivedFromBuyer - payload.finalisedPrice)} back`
            : payload.payment
              ? "Sale and buyer payment recorded"
              : "Sale recorded"
      toast.success(payload.leadId ? `${recorded}. The lead is converted and the car marked sold.` : `${recorded}.`)
      refresh(() => {
        setOverpaid(null)
        setEditing(false)
      })
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
    const firstError = errors.leadId ?? errors.price ?? errors.soldOn ?? errors.paid
    return (
      <form onSubmit={submit} aria-label="Record sale" className="space-y-3 rounded-xl border border-primary/40 p-4">
        <h3 className="text-sm font-semibold">Sale</h3>
        {needsLead && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Buyer</legend>
            {bookedLeads.length === 1 && bookedLeads[0] ? (
              <p className="text-sm">{leadLabel(bookedLeads[0])}</p>
            ) : (
              <div className="space-y-1.5" role="radiogroup" aria-label="Buyer's lead">
                {bookedLeads.map((lead) => (
                  <label key={lead.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="sale-lead"
                      value={lead.id}
                      checked={form.leadId === lead.id}
                      onChange={() => set("leadId", lead.id)}
                      className="size-4 accent-primary"
                    />
                    {leadLabel(lead)}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Saving converts this lead and marks the car sold. Other leads on this car become “Vehicle unavailable”.
            </p>
          </fieldset>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="sale-price" label="Finalised price">
            <MoneyInput id="sale-price" value={form.price} onValueChange={(v) => set("price", v)} aria-invalid={errors.price ? true : undefined} />
          </FormField>
          <FormField id="sale-date" label="Sold on">
            <DatePicker {...pastDateYears()} id="sale-date" value={form.soldOn} onChange={(v) => set("soldOn", v)} />
          </FormField>
        </div>

        <PriceWarning>{saleBelowMinimumWarning(price, minimumSellingPrice)}</PriceWarning>

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
        <AlertDialog open={overpaid !== null} onOpenChange={(o) => !isPending && !o && setOverpaid(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>The buyer has paid more than this price</AlertDialogTitle>
              <AlertDialogDescription>
                {overpaid &&
                  `${formatMoney(receivedFromBuyer)} is recorded as received from the buyer, but the new price is ${formatMoney(overpaid.finalisedPrice)}. Was the payment entered wrong, or did the buyer really pay more?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:flex-col sm:items-stretch">
              <Button onClick={() => overpaid && save(overpaid, "adjust")} disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Entered wrong: reduce it to {overpaid && formatMoney(overpaid.finalisedPrice)}
              </Button>
              <Button variant="outline" onClick={() => overpaid && save(overpaid, "keep")} disabled={isPending}>
                Buyer overpaid: keep it (refund {overpaid && formatMoney(receivedFromBuyer - overpaid.finalisedPrice)})
              </Button>
              <Button variant="ghost" onClick={() => setOverpaid(null)} disabled={isPending}>
                Cancel
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
          <Button variant="outline" size="sm" onClick={startEdit} disabled={!canRecord}>
            {sale ? "Edit" : "Record sale"}
          </Button>
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
          <div className="col-span-2 empty:hidden">
            <PriceWarning>{saleBelowMinimumWarning(sale.finalisedPrice, minimumSellingPrice)}</PriceWarning>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {canRecord
            ? "Not recorded."
            : "Not recorded. Confirm a lead’s booking on this car first; the sale is recorded against that lead."}
        </p>
      )}
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={(o) => !isPending && setConfirmRemove(o)}
        title="Remove this sale?"
        description={
          receivedFromBuyer > 0
            ? `Use this only for a price recorded by mistake. The car stays sold; to undo the sale itself, use Undo sale on the buyer’s lead. The ${formatMoney(receivedFromBuyer)} received from the buyer will also be deleted from Entries. Profit goes back to “—” until a sale is recorded again.`
            : "Use this only for a price recorded by mistake. The car stays sold; to undo the sale itself, use Undo sale on the buyer’s lead. Profit goes back to “—” until a sale is recorded again."
        }
        confirmLabel="Remove sale"
        pendingLabel="Removing…"
        pending={isPending}
        onConfirm={remove}
      />
    </section>
  )
}
