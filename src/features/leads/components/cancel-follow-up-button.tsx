"use client"

import { useState, useTransition } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { useApiError } from "@/hooks/use-api-error"
import { cancelFollowUpAction } from "../actions"

export function CancelFollowUpButton({
  leadId,
  followUpId,
}: {
  leadId: string
  followUpId: string
}) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await cancelFollowUpAction(leadId, followUpId)
      if (!result.ok) {
        handleError(result.error, "Could not cancel the follow-up.")
        return
      }
      toast.success("Follow-up cancelled.")
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <X />
        Cancel
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancel this follow-up?"
        description="It moves to the lead's history and its reminder is cleared. To reschedule, cancel it and schedule a new one."
        cancelLabel="Keep it"
        confirmLabel="Cancel follow-up"
        pendingLabel="Cancelling…"
        pending={isPending}
        onConfirm={onConfirm}
      />
    </>
  )
}
