"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArchiveRestore, ArchiveX, TriangleAlert } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApiError } from "@/hooks/use-api-error"
import { changeVehicleStatusAction } from "../actions"
import type { VehicleStatus } from "../types"

interface ChangeVehicleStatusDialogProps {
  vehicleId: string
  title: string
  status: VehicleStatus
  linkedLeadCount: number
}

/**
 * Admin-only drop / re-list. Linked and sold follow the leads, so those are
 * never offered. The lead count is known up front, so the unlink warning is
 * shown before submitting instead of after a 422.
 */
export function ChangeVehicleStatusDialog({
  vehicleId,
  title,
  status,
  linkedLeadCount,
}: ChangeVehicleStatusDialogProps) {
  const router = useRouter()
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  if (status === "sold") return null
  const next = status === "dropped" ? "open" : "dropped"
  const dropping = next === "dropped"
  const leads = dropping ? linkedLeadCount : 0

  function submit() {
    startTransition(async () => {
      const result = await changeVehicleStatusAction(vehicleId, {
        status: next,
        reason: reason.trim() || null,
        confirmUnlinkLeads: leads > 0,
      })
      if (!result.ok) {
        if (result.error.code === "VEHICLE_HAS_LINKED_LEADS") {
          // A lead was linked after the page loaded.
          toast.error("New leads were linked to this vehicle. Review them and try again.")
          router.refresh()
        } else {
          handleError(result.error, "Could not change the vehicle status.")
        }
        return
      }
      const unlinked = result.data.unlinkedLeadCount
      toast.success(
        dropping
          ? `Vehicle dropped${unlinked ? ` and ${unlinked} ${unlinked === 1 ? "lead" : "leads"} unlinked` : ""}.`
          : "Vehicle re-listed."
      )
      setOpen(false)
      setReason("")
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className={
              dropping
                ? "h-9 border-border bg-card text-destructive hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                : "h-9 border-border bg-card hover:border-primary"
            }
          />
        }
      >
        {dropping ? <ArchiveX /> : <ArchiveRestore />}
        {dropping ? "Drop" : "Re-list"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dropping ? `Drop ${title}?` : `Re-list ${title}?`}</DialogTitle>
          <DialogDescription>
            {dropping
              ? "It leaves active stock. You can re-list it later."
              : "It goes back into stock as Open and can be linked to leads again."}
          </DialogDescription>
        </DialogHeader>

        {leads > 0 && (
          <div className="flex gap-2.5 rounded-lg border border-[#FDE68A] bg-warning-muted p-3 text-sm text-[#92400E]">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">
                {leads} active {leads === 1 ? "lead" : "leads"} will be unlinked
              </p>
              <p className="mt-0.5 text-xs">They keep their status but lose this vehicle.</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="status-reason">
            Reason <span className="font-normal text-subtle-foreground">(optional)</span>
          </Label>
          <Textarea
            id="status-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={dropping ? "e.g. Owner withdrew the car" : "e.g. Owner agreed to new terms"}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={isPending}
            className={dropping ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]" : undefined}
          >
            {isPending
              ? "Saving…"
              : dropping
                ? leads > 0
                  ? `Drop & unlink ${leads} ${leads === 1 ? "lead" : "leads"}`
                  : "Drop vehicle"
                : "Re-list vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
