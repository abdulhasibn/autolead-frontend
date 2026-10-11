"use client"

import { useTransition } from "react"
import { Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { associateVehicleAction } from "@/features/leads/actions"
import { useApiError } from "@/hooks/use-api-error"

/** Links a suggested car to this lead; the page revalidates and it moves to "Linked car". */
export function LinkSuggestedVehicleButton({
  leadId,
  vehicleId,
  vehicleName,
}: {
  leadId: string
  vehicleId: string
  vehicleName: string
}) {
  const { handleError } = useApiError()
  const [isPending, startTransition] = useTransition()

  function link() {
    startTransition(async () => {
      const result = await associateVehicleAction(leadId, { vehicleId })
      if (!result.ok) {
        handleError(result.error, "Could not link the car.")
        return
      }
      toast.success(`${vehicleName} linked to this lead.`)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={link}
      disabled={isPending}
      className="border-border bg-card text-foreground hover:border-primary/20 hover:bg-accent hover:text-primary"
    >
      <Link2 />
      {isPending ? "Linking…" : "Link to this lead"}
    </Button>
  )
}
