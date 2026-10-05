"use client"

import { useState, useTransition } from "react"
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
import { associateVehicleAction } from "../actions"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"
import type { VehicleOption } from "./types"

interface LinkVehicleDialogProps {
  leadId: string
  currentVehicleId: string | null
  vehicles: VehicleOption[]
  disabled?: boolean
}

export function LinkVehicleDialog({
  leadId,
  currentVehicleId,
  vehicles,
  disabled,
}: LinkVehicleDialogProps) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [vehicleId, setVehicleId] = useState("")
  const [isPending, startTransition] = useTransition()

  const options = vehicles
    .filter((v) => v.linkable && v.id !== currentVehicleId)
    .map((v) => ({ value: v.id, label: v.label }))

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vehicleId) return
    startTransition(async () => {
      const result = await associateVehicleAction(leadId, { vehicleId })
      if (!result.ok) {
        handleError(result.error, "Could not link the vehicle.")
        return
      }
      toast.success("Vehicle linked.")
      setVehicleId("")
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setVehicleId("")
      }}
    >
      <DialogTrigger render={<Button variant="outline" disabled={disabled} />}>
        {currentVehicleId ? "Change vehicle" : "Link vehicle"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentVehicleId ? "Change vehicle" : "Link vehicle"}
          </DialogTitle>
          <DialogDescription>
            Only open or linked vehicles can be linked to a lead.
          </DialogDescription>
        </DialogHeader>
        <form id="link-vehicle-form" onSubmit={onSubmit} noValidate>
          <FormField id="link-vehicle" label="Vehicle">
            <OptionSelect
              id="link-vehicle"
              value={vehicleId}
              onValueChange={setVehicleId}
              options={options}
              placeholder={options.length ? "Select a vehicle" : "No vehicles available"}
              disabled={options.length === 0}
            />
          </FormField>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="link-vehicle-form"
            disabled={isPending || !vehicleId}
          >
            {isPending ? "Linking…" : "Link vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
