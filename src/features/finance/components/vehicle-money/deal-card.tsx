"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/features/leads/components/form-field"
import { setDealAction } from "../../actions"
import { formatYmd } from "../../logic/dates"
import { financeErrorMessage } from "../../logic/errors"
import { formatMoneyInput, parseMoneyInput } from "../../logic/money"
import type { DealTerms } from "../../types"
import { Money } from "../money"
import { MoneyInput } from "../money-input"

/** Purchase rate and terms. PUT replaces these fields; the listed price is edited in its own panel. */
export function DealCard({ vehicleId, deal }: { vehicleId: string; deal: DealTerms | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(() => toForm(deal))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function toForm(d: DealTerms | null) {
    return {
      purchaseRate: formatMoneyInput(d?.purchaseRate),
      purchasedOn: d?.purchasedOn ?? "",
      ownerExpectedPrice: formatMoneyInput(d?.ownerExpectedPrice),
      minimumSellingPrice: formatMoneyInput(d?.minimumSellingPrice),
      note: d?.note ?? "",
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const purchaseRate = parseMoneyInput(form.purchaseRate)
    const optional = (v: string) => (v.trim() === "" ? null : parseMoneyInput(v))
    const ownerExpectedPrice = optional(form.ownerExpectedPrice)
    const minimumSellingPrice = optional(form.minimumSellingPrice)
    const next: Record<string, string> = {}
    if (purchaseRate === null || purchaseRate <= 0) next.purchaseRate = "Enter the purchase rate"
    if (form.ownerExpectedPrice.trim() && (ownerExpectedPrice === null || ownerExpectedPrice <= 0)) next.ownerExpectedPrice = "Enter an amount or leave blank"
    if (form.minimumSellingPrice.trim() && (minimumSellingPrice === null || minimumSellingPrice <= 0)) next.minimumSellingPrice = "Enter an amount or leave blank"
    setErrors(next)
    if (Object.keys(next).length) return
    startTransition(async () => {
      const result = await setDealAction(vehicleId, {
        purchaseRate,
        purchasedOn: form.purchasedOn || null,
        ownerExpectedPrice,
        minimumSellingPrice,
        note: form.note.trim() || null,
      })
      if (!result.ok) {
        toast.error(financeErrorMessage(result.error))
        return
      }
      toast.success("Deal saved.")
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <section aria-label="Deal" className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Deal with the seller</h3>
          <Button variant="outline" size="sm" onClick={() => { setForm(toForm(deal)); setErrors({}); setEditing(true) }}>
            <Pencil /> {deal ? "Edit" : "Add deal"}
          </Button>
        </div>
        {deal ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Purchase rate</dt>
              <dd className="font-semibold"><Money value={deal.purchaseRate} /></dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Purchased on</dt>
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
          <p className="mt-2 text-sm text-muted-foreground">No purchase rate yet. Profit can’t be worked out without it.</p>
        )}
      </section>
    )
  }

  return (
    <form onSubmit={submit} aria-label="Edit deal" className="space-y-3 rounded-xl border border-primary/40 p-4">
      <h3 className="text-sm font-semibold">Deal with the seller</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="deal-rate" label="Purchase rate" error={errors.purchaseRate}>
          <MoneyInput id="deal-rate" value={form.purchaseRate} onValueChange={(v) => setForm({ ...form, purchaseRate: v })} aria-invalid={errors.purchaseRate ? true : undefined} />
        </FormField>
        <FormField id="deal-date" label="Purchased on (optional)">
          <DatePicker id="deal-date" value={form.purchasedOn} onChange={(v) => setForm({ ...form, purchasedOn: v })} />
        </FormField>
        <FormField id="deal-owner" label="Owner’s expected price (optional)" error={errors.ownerExpectedPrice}>
          <MoneyInput id="deal-owner" value={form.ownerExpectedPrice} onValueChange={(v) => setForm({ ...form, ownerExpectedPrice: v })} />
        </FormField>
        <FormField id="deal-min" label="Minimum selling price (optional)" error={errors.minimumSellingPrice}>
          <MoneyInput id="deal-min" value={form.minimumSellingPrice} onValueChange={(v) => setForm({ ...form, minimumSellingPrice: v })} />
        </FormField>
      </div>
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
