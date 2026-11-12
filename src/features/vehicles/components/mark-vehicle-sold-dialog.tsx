"use client"

import { useState, useTransition } from "react"
import { BadgeCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { OptionSelect } from "@/components/option-select"
import { useApiError } from "@/hooks/use-api-error"
import { cn } from "@/lib/utils"
import { getSaleCandidateLeadsAction, markVehicleSoldAction } from "@/features/leads/actions"
import { isLeadClosed, LEAD_STATUS_LABELS } from "@/features/leads/constants"
import { FormField } from "@/features/leads/components/form-field"
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge"
import type { LeadReadModel } from "@/features/leads/types"
import { useSaveTransition } from "@/hooks/use-save-transition"

type Buyer = Pick<LeadReadModel, "id" | "contactFullName" | "contactPhone" | "status" | "vehicleId">

const OTHER = "__other__"

/** The steps the sale will take for this lead, in order. */
function saleSteps(lead: Buyer, vehicleId: string): string[] {
  return [
    lead.vehicleId !== vehicleId &&
      (lead.vehicleId ? "Move the lead from its current car to this one" : "Link the lead to this car"),
    lead.status !== "booking_confirmed" && "Confirm the booking",
    "Mark the lead converted, which marks this car sold",
  ].filter((step): step is string => Boolean(step))
}

/** Pre-select the booking that's already confirmed; otherwise make the user choose. */
function defaultChoice(linked: Buyer[]): string {
  const booked = linked.filter((l) => l.status === "booking_confirmed")
  const only = booked.length === 1 ? booked[0] : linked.length === 1 ? linked[0] : undefined
  if (only) return only.id
  return linked.length === 0 ? OTHER : ""
}

/**
 * Sells the car from its own page. A car is sold by converting the lead that
 * bought it, so this confirms one of the linked leads (or picks any other open
 * lead) and walks it to Converted. The lead page does the same from its side.
 */
export function MarkVehicleSoldDialog({
  vehicleId,
  title,
  linkedLeads,
}: {
  vehicleId: string
  title: string
  linkedLeads: Buyer[]
}) {
  const { handleError } = useApiError()
  const linked = linkedLeads.filter((l) => !isLeadClosed(l.status))

  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState(() => defaultChoice(linked))
  const [otherId, setOtherId] = useState("")
  const [notes, setNotes] = useState("")
  const [candidates, setCandidates] = useState<Buyer[] | null>(null)
  const [loadingCandidates, startLoading] = useTransition()
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  function loadCandidates() {
    if (candidates) return
    startLoading(async () => {
      const result = await getSaleCandidateLeadsAction()
      if (!result.ok) {
        handleError(result.error, "Could not load leads.")
        setCandidates([])
        return
      }
      const linkedIds = new Set(linked.map((l) => l.id))
      setCandidates(result.data.filter((l) => !linkedIds.has(l.id)))
    })
  }

  function choose(next: string) {
    setChoice(next)
    if (next === OTHER) loadCandidates()
  }

  function reset() {
    setChoice(defaultChoice(linked))
    setOtherId("")
    setNotes("")
  }

  const buyer: Buyer | undefined =
    choice === OTHER ? candidates?.find((l) => l.id === otherId) : linked.find((l) => l.id === choice)

  const otherOptions = (candidates ?? []).map((l) => ({
    value: l.id,
    label: [
      l.contactFullName,
      l.contactPhone,
      LEAD_STATUS_LABELS[l.status],
      l.vehicleId && l.vehicleId !== vehicleId ? "on another car" : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!buyer) return
    startTransition(async () => {
      const result = await markVehicleSoldAction({
        vehicleId,
        leadId: buyer.id,
        notes: notes.trim() || null,
      })
      if (!result.ok) {
        handleError(result.error, "Could not mark the car sold. Check the lead and try again.")
        refresh()
        return
      }
      toast.success(`Sold to ${buyer.contactFullName}.`)
      refresh(() => {
        setOpen(false)
        reset()
      })
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next && choice === OTHER) loadCandidates()
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button />}>
        <BadgeCheck />
        <span className="sm:hidden">Sold</span>
        <span className="max-sm:hidden">Mark as sold</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as sold</DialogTitle>
          <DialogDescription>
            Who bought {title}? A car is sold through the lead that bought it.
          </DialogDescription>
        </DialogHeader>

        <form id="mark-sold-form" onSubmit={submit} className="space-y-4" noValidate>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
              Buyer
            </legend>
            {linked.map((lead) => (
              <BuyerOption
                key={lead.id}
                checked={choice === lead.id}
                onSelect={() => choose(lead.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{lead.contactFullName}</span>
                  <span className="block truncate text-xs text-subtle-foreground">{lead.contactPhone}</span>
                </span>
                <LeadStatusBadge status={lead.status} />
              </BuyerOption>
            ))}
            <BuyerOption checked={choice === OTHER} onSelect={() => choose(OTHER)}>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">
                  {linked.length ? "Another lead" : "Pick a lead"}
                </span>
                <span className="block text-xs text-subtle-foreground">
                  {linked.length ? "Someone not linked to this car yet" : "No open leads are linked to this car"}
                </span>
              </span>
            </BuyerOption>
            {choice === OTHER && (
              <FormField id="mark-sold-lead" label="Lead">
                <OptionSelect
                  id="mark-sold-lead"
                  value={otherId}
                  onValueChange={setOtherId}
                  options={otherOptions}
                  searchable
                  title="Pick the buyer"
                  disabled={loadingCandidates || otherOptions.length === 0}
                  placeholder={
                    loadingCandidates
                      ? "Loading leads…"
                      : otherOptions.length
                        ? "Search by name or phone"
                        : "No other open leads"
                  }
                />
              </FormField>
            )}
          </fieldset>

          {buyer && (
            <div className="rounded-lg bg-accent/60 px-3 py-2.5 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">This will:</p>
              <ol className="list-decimal space-y-0.5 pl-4">
                {saleSteps(buyer, vehicleId).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {linked.length > (linked.some((l) => l.id === buyer.id) ? 1 : 0) && (
                <p className="mt-1.5">Other leads on this car are marked Vehicle unavailable.</p>
              )}
            </div>
          )}

          <FormField id="mark-sold-notes" label="Notes">
            <Textarea
              id="mark-sold-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional, saved on the lead's history"
            />
          </FormField>
        </form>

        <DialogFooter>
          <Button type="submit" form="mark-sold-form" disabled={isPending || !buyer}>
            {isPending ? "Saving…" : "Mark as sold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BuyerOption({
  checked,
  onSelect,
  children,
}: {
  checked: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors pointer-coarse:py-3",
        checked ? "border-primary bg-accent" : "border-border hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      <input
        type="radio"
        name="mark-sold-buyer"
        checked={checked}
        onChange={onSelect}
        className="size-4 shrink-0 accent-primary"
      />
      {children}
    </label>
  )
}
