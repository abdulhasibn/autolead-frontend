"use client"

import { useState, useTransition } from "react"
import { Undo2 } from "lucide-react"
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
import { useApiError } from "@/hooks/use-api-error"
import { reopenLeadAction } from "../actions"

/**
 * Admin-only undo of a mistaken conversion: the lead goes back to booking
 * confirmed and its car from sold to linked. Refused while Finance has the
 * sale price.
 */
export function UndoSaleDialog({ leadId }: { leadId: string }) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await reopenLeadAction(leadId)
      if (!result.ok) {
        handleError(result.error, "Could not undo the sale.")
        return
      }
      toast.success("Sale undone. The lead is back to booking confirmed.")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <DialogTrigger
        render={<Button variant="outline" className="border-border bg-card text-foreground hover:border-primary/20 hover:bg-accent hover:text-primary" />}
      >
        <Undo2 />
        <span className="sm:hidden">Undo</span>
        <span className="max-sm:hidden">Undo sale</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undo this sale?</DialogTitle>
          <DialogDescription>
            Use this only for a sale converted by mistake. The lead goes back to “Booking confirmed” and the car
            back to linked, so it’s listed again.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Other leads that became “Vehicle unavailable” stay that way; link them again by hand.</li>
          <li>Follow-ups cancelled when the lead converted don’t come back.</li>
          <li>If Finance has a sale price for this car, remove it there first.</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Undoing…" : "Undo sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
