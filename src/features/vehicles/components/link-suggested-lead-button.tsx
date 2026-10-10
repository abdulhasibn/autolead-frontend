"use client"

import { useTransition } from "react"
import { Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { associateVehicleAction } from "@/features/leads/actions"
import { useApiError } from "@/hooks/use-api-error"

/** Links a suggested lead to this car; the page revalidates and it moves to "Linked". */
export function LinkSuggestedLeadButton({
  leadId,
  leadName,
  vehicleId,
}: {
  leadId: string
  leadName: string
  vehicleId: string
}) {
  const { handleError } = useApiError()
  const [isPending, startTransition] = useTransition()

  function link() {
    startTransition(async () => {
      const result = await associateVehicleAction(leadId, { vehicleId })
      if (!result.ok) {
        handleError(result.error, "Could not link the lead.")
        return
      }
      toast.success(`${leadName} linked to this car.`)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={link}
      disabled={isPending}
      className="border-[#E5E7EB] bg-white text-[#374151] hover:border-[#CCFBF1] hover:bg-[#F0FDFA] hover:text-[#0D9488]"
    >
      <Link2 />
      {isPending ? "Linking…" : "Link to this car"}
    </Button>
  )
}
