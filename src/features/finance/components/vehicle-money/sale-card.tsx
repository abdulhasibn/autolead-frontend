"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { FormField } from "@/features/leads/components/form-field"
import { recordSaleAction, removeSaleAction } from "../../actions"
import { formatYmd, todayIST } from "../../logic/dates"
import { financeErrorMessage } from "../../logic/errors"
import { formatMoneyInput, parseMoneyInput } from "../../logic/money"
import type { VehicleSale } from "../../types"
import { Money } from "../money"
import { MoneyInput } from "../money-input"

/** Finalised price and date. Recording a sale doesn’t change the car’s status (that follows leads). */
export function SaleCard({ vehicleId, sale, suggestedPrice }: { vehicleId: string; sale: VehicleSale | null; suggestedPrice: number | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState("")
  const [soldOn, setSoldOn] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [isPending, startTransition] = useTransition()

  function startEdit() {
    setPrice(formatMoneyInput(sale?.finalisedPrice ?? suggestedPrice))
    setSoldOn(sale?.soldOn ?? todayIST())
    setError(null)
    setEditing(true)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const finalisedPrice = parseMoneyInput(price)
    if (finalisedPrice === null || finalisedPrice <= 0) return setError("Enter the finalised price")
    if (!soldOn) return setError("Pick the sale date")
    startTransition(async () => {
      const result = await recordSaleAction(vehicleId, { finalisedPrice, soldOn })
      if (!result.ok) return void toast.error(financeErrorMessage(result.error))
      toast.success("Sale recorded.")
      setEditing(false)
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await removeSaleAction(vehicleId)
      if (!result.ok) return void toast.error(financeErrorMessage(result.error))
      toast.success("Sale removed.")
      setConfirmRemove(false)
      router.refresh()
    })
  }

  if (editing) {
    return (
      <form onSubmit={submit} aria-label="Record sale" className="space-y-3 rounded-xl border border-primary/40 p-4">
        <h3 className="text-sm font-semibold">Sale</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="sale-price" label="Finalised price">
            <MoneyInput id="sale-price" value={price} onValueChange={(v) => { setPrice(v); setError(null) }} aria-invalid={error ? true : undefined} />
          </FormField>
          <FormField id="sale-date" label="Sold on">
            <DatePicker id="sale-date" value={soldOn} onChange={(v) => { setSoldOn(v); setError(null) }} />
          </FormField>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
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
