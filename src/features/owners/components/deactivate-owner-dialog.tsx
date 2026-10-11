"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
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
import { deactivateOwnerAction } from "../actions"

export function DeactivateOwnerDialog({
  ownerId,
  ownerName,
}: {
  ownerId: string
  ownerName: string
}) {
  const { handleError } = useApiError()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await deactivateOwnerAction(ownerId)
      if (!result.ok) {
        handleError(result.error)
        return
      }
      toast.success("Owner deactivated")
      setOpen(false)
      router.push("/owners")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" className="gap-1.5" />}>
        <Trash2 className="size-4" />
        Deactivate
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate owner?</DialogTitle>
          <DialogDescription>
            This will deactivate <strong>{ownerName}</strong>. Their vehicles will
            remain in the system. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
