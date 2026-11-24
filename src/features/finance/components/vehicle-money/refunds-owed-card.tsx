"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "@/features/leads/components/form-field"
import { useSaveTransition } from "@/hooks/use-save-transition"
import { assignBuyerMoneyAction } from "../../actions"
import { leadName } from "../../logic/buyers"
import { financeErrorMessage } from "../../logic/errors"
import type { CarMoney, FinanceTag, FinanceVehicleRef, ShowroomOption, RefundOwedRow } from "../../types"
import { EntrySheet } from "../entry-sheet"
import { Money } from "../money"
import { LeadPicker } from "../pickers"
import type { PickerOption } from "../search-picker"

/**
 * Money buyers who left are owed back, and money no lead is tied to yet.
 * Renders nothing when there is neither.
 */
export function RefundsOwedCard({
  money,
  tags,
  showrooms,
}: {
  money: Pick<CarMoney, "vehicleId" | "vehicle" | "buyers" | "refundsOwed">
  tags: FinanceTag[]
  showrooms: ShowroomOption[]
}) {
  const [refund, setRefund] = useState<RefundOwedRow | null>(null)
  const [assigning, setAssigning] = useState(false)
  const owedBack = money.refundsOwed.filter((r) => r.lead !== null)
  const unassigned = money.refundsOwed.find((r) => r.lead === null) ?? null
  if (owedBack.length === 0 && !unassigned) return null
  const vehicle: FinanceVehicleRef = { id: money.vehicleId, label: money.vehicle.label }

  return (
    <>
      {owedBack.length > 0 && (
        <section aria-label="Refunds owed" data-testid="refunds-owed" className="rounded-xl border border-warning/40 p-4">
          <h3 className="text-sm font-semibold">Refunds owed</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Buyers who left this car and are owed their money back.</p>
          <ul className="mt-2 divide-y divide-muted">
            {owedBack.map((row) => (
              <li key={row.lead?.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{leadName(row.lead)}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid <Money value={row.paid} /> · refunded <Money value={row.refunded} />
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Money value={row.owed} tone signed className="text-sm font-semibold" />
                  {row.owed > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setRefund(row)}>
                      Record refund
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {unassigned && (
        <section aria-label="Unassigned buyer money" data-testid="unassigned-buyer-money" className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Unassigned buyer money</h3>
              <p className="text-xs text-muted-foreground">
                Payments from a buyer that aren’t tied to a lead yet. Assign them so they count for the right buyer.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Money value={unassigned.owed} tone signed className="text-sm font-semibold" />
              <Button variant="outline" size="sm" onClick={() => setAssigning(true)}>
                Assign to lead
              </Button>
            </div>
          </div>
        </section>
      )}
      {refund && refund.lead && (
        <EntrySheet
          open
          onOpenChange={(open) => !open && setRefund(null)}
          key={refund.lead.id}
          tags={tags}
          showrooms={showrooms}
          defaultKind="expense"
          defaultVehicle={vehicle}
          lockVehicle
          carBuyers={{ buyers: money.buyers, refundsOwed: money.refundsOwed }}
          prefill={{ purpose: "refund", leadId: refund.lead.id, amount: refund.owed }}
        />
      )}
      <AssignLeadDialog vehicleId={money.vehicleId} open={assigning} onOpenChange={setAssigning} />
    </>
  )
}

function AssignLeadDialog({
  vehicleId,
  open,
  onOpenChange,
}: {
  vehicleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [lead, setLead] = useState<PickerOption | null>(null)
  const { isPending, run, refresh } = useSaveTransition()

  function assign() {
    if (!lead) return
    run(async () => {
      const result = await assignBuyerMoneyAction(vehicleId, lead.id)
      if (!result.ok) return void toast.error(financeErrorMessage(result.error))
      const { assigned, total } = result.data
      if (result.data.failed > 0) {
        const { firstError } = result.data
        if (assigned === 0 && firstError) {
          toast.error(`Assigned 0 of ${total}: ${firstError}`)
          return refresh()
        }
        toast.error(`Assigned ${assigned} of ${total}. Press Assign again to finish.`)
        return refresh()
      }
      toast.success(`Payments assigned to ${lead.label}.`)
      refresh(() => {
        setLead(null)
        onOpenChange(false)
      })
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isPending) return
        if (!o) setLead(null)
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to lead</DialogTitle>
          <DialogDescription>
            Pick the lead who paid. If they have left this car, the money shows as a refund owed to them.
          </DialogDescription>
        </DialogHeader>
        <FormField id="assign-lead" label="Lead">
          <LeadPicker id="assign-lead" value={lead} onChange={setLead} />
        </FormField>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setLead(null)
              onOpenChange(false)
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={assign} disabled={!lead || isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
