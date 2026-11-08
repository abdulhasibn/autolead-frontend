"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { lockAction } from "../../actions"

export function LockButton({ label = "Lock", variant = "outline" }: { label?: string; variant?: "outline" | "default" }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant={variant}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await lockAction()
          if (!result.ok) toast.error("Couldn’t reach the server, but finance is locked on this device.")
          router.replace("/finance/unlock")
          router.refresh()
        })
      }
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Lock />}
      {label}
    </Button>
  )
}
