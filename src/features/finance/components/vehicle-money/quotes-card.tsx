"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { DatePicker, pastDateYears } from "@/components/ui/date-picker"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/features/leads/components/form-field"
import { addQuoteAction, deleteQuoteAction } from "../../actions"
import { formatYmd, todayIST } from "../../logic/dates"
import { financeErrorMessage } from "../../logic/errors"
import { parseMoneyInput } from "../../logic/money"
import type { VehicleQuote } from "../../types"
import { Money } from "../money"
import { MoneyInput } from "../money-input"
import { LeadPicker } from "../pickers"
import type { PickerOption } from "../search-picker"
import { useSaveTransition } from "@/hooks/use-save-transition"

/** Prices offered to leads; the newest is the current quote. */
export function QuotesCard({ vehicleId, quotes }: { vehicleId: string; quotes: VehicleQuote[] }) {
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<VehicleQuote | null>(null)
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  function remove() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteQuoteAction(vehicleId, deleting.id)
      if (!result.ok) return void toast.error(financeErrorMessage(result.error))
      toast.success("Quote deleted.")
      refresh(() => setDeleting(null))
    })
  }

  return (
    <section aria-label="Quotes" className="rounded-xl border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-muted px-4 py-3">
        <h3 className="text-sm font-semibold">Quotes <span className="font-mono-data text-xs text-subtle-foreground">{quotes.length}</span></h3>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus /> Add quote</Button>
      </div>
      {quotes.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-subtle-foreground">No prices offered yet.</p>
      ) : (
        <ul className="divide-y divide-muted">
          {quotes.map((q, i) => (
            <li key={q.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Money value={q.amount} className="font-semibold" />
                  {i === 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">Current</span>}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {formatYmd(q.quotedOn)}
                  {q.lead ? (
                    <>
                      {" · "}
                      <Link href={`/leads/${q.lead.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                        {q.lead.name ?? "Lead"}
                      </Link>
                      {q.lead.phone && <> · <a href={`tel:${q.lead.phone}`} className="hover:text-primary">{q.lead.phone}</a></>}
                    </>
                  ) : null}
                  {q.quotedTo && <> · to {q.quotedTo}</>}
                </p>
                {q.note && <p className="truncate text-xs text-subtle-foreground">{q.note}</p>}
              </div>
              <Button variant="ghost" size="icon" aria-label="Delete quote" onClick={() => setDeleting(q)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <AddQuoteDialog vehicleId={vehicleId} open={adding} onOpenChange={setAdding} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && !isPending && setDeleting(null)}
        title="Delete this quote?"
        description={deleting ? `The ${deleting.amount.toLocaleString("en-IN")} rupee quote${deleting.lead?.name ? ` to ${deleting.lead.name}` : ""} will be removed.` : ""}
        confirmLabel="Delete"
        pending={isPending}
        onConfirm={remove}
      />
    </section>
  )
}

function AddQuoteDialog({ vehicleId, open, onOpenChange }: { vehicleId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [amount, setAmount] = useState("")
  const [quotedOn, setQuotedOn] = useState(todayIST())
  const [lead, setLead] = useState<PickerOption | null>(null)
  const [quotedTo, setQuotedTo] = useState("")
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  function reset() {
    setAmount("")
    setQuotedOn(todayIST())
    setLead(null)
    setQuotedTo("")
    setNote("")
    setErrors({})
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = parseMoneyInput(amount)
    const next: Record<string, string> = {}
    if (value === null || value <= 0) next.amount = "Enter the price offered"
    if (!quotedOn) next.quotedOn = "Pick a date"
    if (!lead) next.lead = "Pick the lead this price was offered to"
    setErrors(next)
    if (Object.keys(next).length || !lead) return
    startTransition(async () => {
      const result = await addQuoteAction(vehicleId, {
        amount: value,
        quotedOn,
        leadId: lead.id,
        quotedTo: quotedTo.trim() || null,
        note: note.trim() || null,
      })
      if (!result.ok) {
        if (result.error.status === 404) {
          setLead(null)
          setErrors({ lead: "That lead no longer exists. Pick another." })
          return
        }
        toast.error(financeErrorMessage(result.error))
        return
      }
      toast.success("Quote added.")
      refresh(() => {
        reset()
        onOpenChange(false)
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add quote</DialogTitle>
            <DialogDescription>A price offered to a lead for this car.</DialogDescription>
          </DialogHeader>
          <FormField id="quote-lead" label="Lead" error={errors.lead}>
            <LeadPicker id="quote-lead" value={lead} onChange={(o) => { setLead(o); setErrors((e) => ({ ...e, lead: "" })) }} invalid={Boolean(errors.lead)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="quote-amount" label="Price" error={errors.amount}>
              <MoneyInput id="quote-amount" value={amount} onValueChange={setAmount} aria-invalid={errors.amount ? true : undefined} />
            </FormField>
            <FormField id="quote-date" label="Date" error={errors.quotedOn}>
              <DatePicker {...pastDateYears()} id="quote-date" value={quotedOn} onChange={setQuotedOn} />
            </FormField>
          </div>
          <FormField id="quote-to" label="Display name (optional)">
            <Input id="quote-to" maxLength={120} value={quotedTo} onChange={(e) => setQuotedTo(e.target.value)} placeholder="e.g. Anil’s brother" />
          </FormField>
          <FormField id="quote-note" label="Note (optional)">
            <Textarea id="quote-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="animate-spin" />}Add quote</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
