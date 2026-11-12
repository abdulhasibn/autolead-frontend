"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker, pastDateYears } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/features/leads/components/form-field"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import { setDealAction } from "../../actions"
import { DEFAULT_COMMISSION_PERCENT, parsePercent } from "../../logic/acquisition"
import { formatYmd, todayIST } from "../../logic/dates"
import { financeErrorMessage } from "../../logic/errors"
import { formatMoney, formatMoneyInput, parseMoneyInput } from "../../logic/money"
import { buildPayment, PAID_OPTIONS, type PaidChoice, type PaymentErrors } from "../../logic/payment"
import { commissionPercent as commissionPercentSchema } from "../../schemas"
import type { DealTerms, SaleModel } from "../../types"
import { Money } from "../money"
import { MoneyInput } from "../money-input"

/**
 * Terms agreed with the owner: a purchase rate for a car we buy outright, or
 * a commission % for a car we sell for them. PUT replaces these fields; the
 * listed price is edited in its own panel. For a purchase car the form also
 * takes a payment to the seller, saved as a "payment to seller" entry.
 */
export function DealCard({
  vehicleId,
  deal,
  saleModel,
  paidToSeller,
}: {
  vehicleId: string
  deal: DealTerms | null
  saleModel: SaleModel
  /** Sum of the car's payments to the seller so far. */
  paidToSeller: number
}) {
  const commission = saleModel === "commission"
  const termsSet = commission ? deal?.commissionPercent != null : deal?.purchaseRate != null
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(() => toForm(deal))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function toForm(d: DealTerms | null) {
    return {
      purchaseRate: formatMoneyInput(d?.purchaseRate),
      commissionPercent: d?.commissionPercent == null ? DEFAULT_COMMISSION_PERCENT : String(d.commissionPercent),
      purchasedOn: d?.purchasedOn ?? "",
      ownerExpectedPrice: formatMoneyInput(d?.ownerExpectedPrice),
      minimumSellingPrice: formatMoneyInput(d?.minimumSellingPrice),
      note: d?.note ?? "",
      paid: "none" as PaidChoice,
      paidAmount: "",
      paidOn: todayIST(),
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const purchaseRate = commission ? null : parseMoneyInput(form.purchaseRate)
    const percent = commission ? parsePercent(form.commissionPercent) : null
    const optional = (v: string) => (v.trim() === "" ? null : parseMoneyInput(v))
    const ownerExpectedPrice = optional(form.ownerExpectedPrice)
    const minimumSellingPrice = optional(form.minimumSellingPrice)
    const next: Record<string, string> = {}
    if (commission) {
      const check = commissionPercentSchema.safeParse(percent)
      if (percent === null) next.commissionPercent = "Enter the commission %, e.g. 3.5"
      else if (!check.success) next.commissionPercent = check.error.issues[0]?.message ?? "Enter a valid %"
    } else if (purchaseRate === null || purchaseRate <= 0) next.purchaseRate = "Enter the purchase rate"
    if (form.ownerExpectedPrice.trim() && (ownerExpectedPrice === null || ownerExpectedPrice <= 0)) next.ownerExpectedPrice = "Enter an amount or leave blank"
    if (form.minimumSellingPrice.trim() && (minimumSellingPrice === null || minimumSellingPrice <= 0)) next.minimumSellingPrice = "Enter an amount or leave blank"
    const paymentErrors: PaymentErrors = {}
    const payment = commission
      ? null
      : buildPayment(form, purchaseRate === null || purchaseRate <= 0 ? null : purchaseRate - paidToSeller, paymentErrors, {
          amountLabel: "amount paid",
          alreadyFull: "The seller has already been paid the full rate",
        })
    Object.assign(next, paymentErrors)
    setErrors(next)
    if (Object.keys(next).length) return
    startTransition(async () => {
      const result = await setDealAction(vehicleId, {
        purchaseRate,
        commissionPercent: percent,
        purchasedOn: form.purchasedOn || null,
        ownerExpectedPrice,
        minimumSellingPrice,
        note: form.note.trim() || null,
        payment,
      })
      if (!result.ok) {
        toast.error(financeErrorMessage(result.error))
        return
      }
      toast.success(payment ? "Deal and payment to the seller saved." : "Deal saved.")
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <section aria-label="Deal" className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{commission ? "Deal with the owner" : "Deal with the seller"}</h3>
          <Button variant="outline" size="sm" onClick={() => { setForm(toForm(deal)); setErrors({}); setEditing(true) }}>
            <Pencil /> {deal ? "Edit" : "Add deal"}
          </Button>
        </div>
        {deal && termsSet ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {commission ? (
              <div>
                <dt className="text-xs text-muted-foreground">Our commission</dt>
                <dd className="font-semibold">{deal.commissionPercent}% of the sale price</dd>
              </div>
            ) : (
              <div>
                <dt className="text-xs text-muted-foreground">Purchase rate</dt>
                <dd className="font-semibold"><Money value={deal.purchaseRate} /></dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">{commission ? "Agreed on" : "Purchased on"}</dt>
              <dd>{formatYmd(deal.purchasedOn)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Owner expected</dt>
              <dd><Money value={deal.ownerExpectedPrice} /></dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Minimum selling price</dt>
              <dd><Money value={deal.minimumSellingPrice} /></dd>
            </div>
            {deal.note && <p className="col-span-2 text-xs whitespace-pre-wrap text-muted-foreground">{deal.note}</p>}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {commission
              ? "No commission % yet. Commission and the owner’s payout can’t be worked out without it."
              : "No purchase rate yet. Profit can’t be worked out without it."}
          </p>
        )}
      </section>
    )
  }

  return (
    <form onSubmit={submit} aria-label="Edit deal" className="space-y-3 rounded-xl border border-primary/40 p-4">
      <h3 className="text-sm font-semibold">{commission ? "Deal with the owner" : "Deal with the seller"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {commission ? (
          <FormField id="deal-commission" label="Our commission (% of sale price)" error={errors.commissionPercent}>
            <div className="relative">
              <Input
                id="deal-commission"
                inputMode="decimal"
                placeholder="e.g. 3.5"
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                aria-invalid={errors.commissionPercent ? true : undefined}
                className="pr-8"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
            </div>
          </FormField>
        ) : (
          <FormField id="deal-rate" label="Purchase rate" error={errors.purchaseRate}>
            <MoneyInput id="deal-rate" value={form.purchaseRate} onValueChange={(v) => setForm({ ...form, purchaseRate: v })} aria-invalid={errors.purchaseRate ? true : undefined} />
          </FormField>
        )}
        <FormField id="deal-date" label={commission ? "Agreed on (optional)" : "Purchased on (optional)"}>
          <DatePicker {...pastDateYears()} id="deal-date" value={form.purchasedOn} onChange={(v) => setForm({ ...form, purchasedOn: v })} />
        </FormField>
        <FormField id="deal-owner" label="Owner’s expected price (optional)" error={errors.ownerExpectedPrice}>
          <MoneyInput id="deal-owner" value={form.ownerExpectedPrice} onValueChange={(v) => setForm({ ...form, ownerExpectedPrice: v })} />
        </FormField>
        <FormField id="deal-min" label="Minimum selling price (optional)" error={errors.minimumSellingPrice}>
          <MoneyInput id="deal-min" value={form.minimumSellingPrice} onValueChange={(v) => setForm({ ...form, minimumSellingPrice: v })} />
        </FormField>
      </div>
      {!commission && <SellerPayment form={form} setForm={setForm} errors={errors} paidToSeller={paidToSeller} />}
      <FormField id="deal-note" label="Note (optional)">
        <Textarea id="deal-note" rows={2} maxLength={1000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </FormField>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="animate-spin" />}Save deal</Button>
      </div>
    </form>
  )
}

type PaymentForm = { purchaseRate: string; paid: PaidChoice; paidAmount: string; paidOn: string }

/** "Paid to the seller" on the deal form: records a payment entry against the purchase rate. */
function SellerPayment<F extends PaymentForm>({
  form,
  setForm,
  errors,
  paidToSeller,
}: {
  form: F
  setForm: (next: F) => void
  errors: Record<string, string>
  paidToSeller: number
}) {
  const rate = parseMoneyInput(form.purchaseRate)
  const due = rate === null || rate <= 0 ? null : rate - paidToSeller
  const partAmount = parseMoneyInput(form.paidAmount)
  const settled = due !== null && due <= 0 && paidToSeller > 0
  return (
    <div className="space-y-3">
      <FormField id="deal-paid" label={paidToSeller > 0 ? "Paid to the seller now" : "Paid to the seller"} error={errors.paid}>
        <SegmentedChoice
          id="deal-paid"
          aria-label="Paid to the seller"
          value={form.paid}
          onValueChange={(v) => setForm({ ...form, paid: v as PaidChoice })}
          options={PAID_OPTIONS}
        />
      </FormField>
      {form.paid !== "none" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {form.paid === "part" && (
            <FormField id="deal-paid-amount" label="Amount paid" error={errors.paidAmount}>
              <MoneyInput
                id="deal-paid-amount"
                value={form.paidAmount}
                onValueChange={(v) => setForm({ ...form, paidAmount: v })}
                aria-invalid={errors.paidAmount ? true : undefined}
              />
            </FormField>
          )}
          <FormField id="deal-paid-on" label="Paid on" error={errors.paidOn}>
            <DatePicker {...pastDateYears()} id="deal-paid-on" value={form.paidOn} onChange={(v) => setForm({ ...form, paidOn: v })} invalid={!!errors.paidOn} />
          </FormField>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {paidToSeller > 0 && `${formatMoney(paidToSeller)} already paid. `}
        {settled
          ? "The seller is fully paid."
          : form.paid === "full" && due !== null && due > 0
            ? `${formatMoney(due)} will be recorded as paid to the seller.`
            : form.paid === "part" && due !== null && partAmount !== null && partAmount > 0 && partAmount < due
              ? `${formatMoney(due - partAmount)} will still be owed to the seller.`
              : "Later payments go in Entries as “Payment to seller”."}
      </p>
    </div>
  )
}
