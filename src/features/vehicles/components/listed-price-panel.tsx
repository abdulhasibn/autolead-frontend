"use client"

import { useState } from "react"
import { Globe, Pencil } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiError } from "@/hooks/use-api-error"
import { formatCurrency } from "@/lib/format"
import { setListedPriceAction } from "../actions"
import { listedPriceFormSchema } from "../schemas"
import type { VehicleStatus } from "../types"
import { useSaveTransition } from "@/hooks/use-save-transition"

interface ListedPricePanelProps {
  vehicleId: string
  listedPrice: number | null
  status: VehicleStatus
  canEdit: boolean
}

/**
 * The asking price buyers see on the customer website. Open and linked cars
 * are on the website; sold and dropped ones are not.
 */
export function ListedPricePanel({ vehicleId, listedPrice, status, canEdit }: ListedPricePanelProps) {
  const onWebsite = status === "open" || status === "linked"

  return (
    <section aria-label="Listed price" className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Listed price</p>
        <p className="font-mono-data text-lg font-semibold text-foreground">
          {listedPrice == null ? <span className="text-sm font-medium text-subtle-foreground">Not priced</span> : formatCurrency(listedPrice)}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe aria-hidden className="size-3" />
          {onWebsite
            ? listedPrice == null
              ? "On website as “Price on request”"
              : "Shown on the website"
            : "Not on the website"}
        </p>
      </div>
      {canEdit && <ListedPriceDialog vehicleId={vehicleId} listedPrice={listedPrice} />}
    </section>
  )
}

function ListedPriceDialog({ vehicleId, listedPrice }: { vehicleId: string; listedPrice: number | null }) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setValue(listedPrice == null ? "" : listedPrice.toLocaleString("en-IN"))
      setError(null)
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = listedPriceFormSchema.safeParse(value)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid price")
      return
    }
    startTransition(async () => {
      const result = await setListedPriceAction(vehicleId, { listedPrice: parsed.data })
      if (!result.ok) {
        handleError(result.error, "Could not save the listed price.")
        return
      }
      toast.success(parsed.data == null ? "Listed price cleared." : "Listed price saved.")
      refresh(() => setOpen(false))
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" className="h-9 shrink-0 border-border bg-card hover:border-primary" />}>
        <Pencil />
        {listedPrice == null ? "Set price" : "Edit"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Listed price</DialogTitle>
            <DialogDescription>
              The asking price buyers see on the website. Leave it blank to show “Price on request”.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="listed-price">Price (₹)</Label>
            <Input
              id="listed-price"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 12,50,000"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              aria-invalid={error !== null}
              aria-describedby={error ? "listed-price-error" : undefined}
            />
            {error && (
              <p id="listed-price-error" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
