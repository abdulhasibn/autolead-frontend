"use client"

import { useState } from "react"
import { UserX } from "lucide-react"
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
import { useSaveTransition } from "@/hooks/use-save-transition"
import { deactivateUserAction } from "../actions"

/** Soft-deactivates a staff account: they can't sign in and every session ends. */
export function DeactivateStaffDialog({ userId, fullName }: { userId: string; fullName: string }) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const { isPending, run, refresh } = useSaveTransition()

  function confirm() {
    run(async () => {
      const result = await deactivateUserAction(userId)
      if (!result.ok) {
        handleError(result.error, "Could not deactivate the account.")
        return
      }
      toast.success(`${fullName} can no longer sign in.`)
      refresh(() => setOpen(false))
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={`Deactivate ${fullName}`}
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <UserX />
        Deactivate
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate {fullName}?</DialogTitle>
          <DialogDescription>
            They can’t sign in any more, and every device they’re signed in on is signed out.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Their leads stay assigned to them and nobody else sees them as a salesperson. Reassign
            those leads from each lead’s page (Assign).
          </li>
          <li>Their past follow-ups and history keep their name.</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={isPending}>
            {isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
