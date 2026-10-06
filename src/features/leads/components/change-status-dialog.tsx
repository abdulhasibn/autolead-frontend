"use client"

import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Textarea } from "@/components/ui/textarea"
import { useApiError } from "@/hooks/use-api-error"
import { changeLeadStatusAction } from "../actions"
import {
  getNextLeadStatuses,
  LEAD_STATUS_LABELS,
  VEHICLE_REQUIRED_STATUSES,
} from "../constants"
import {
  changeLeadStatusFormSchema,
  type ChangeLeadStatusFormInput,
  type ChangeLeadStatusInput,
} from "../schemas"
import type { LeadReadModel } from "../types"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"

const DEFAULT_VALUES: ChangeLeadStatusFormInput = {
  status: "" as ChangeLeadStatusFormInput["status"],
  notes: "",
}

export function ChangeStatusDialog({
  lead,
}: {
  lead: Pick<LeadReadModel, "id" | "status" | "vehicleId">
}) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeLeadStatusFormInput, unknown, ChangeLeadStatusInput>({
    resolver: zodResolver(changeLeadStatusFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const nextStatuses = getNextLeadStatuses(lead.status)
  const options = nextStatuses.map((status) => {
    const needsVehicle =
      VEHICLE_REQUIRED_STATUSES.includes(status) && lead.vehicleId === null
    return {
      value: status,
      label: needsVehicle
        ? `${LEAD_STATUS_LABELS[status]} (link a vehicle first)`
        : LEAD_STATUS_LABELS[status],
      disabled: needsVehicle,
    }
  })

  function onSubmit(values: ChangeLeadStatusInput) {
    startTransition(async () => {
      const result = await changeLeadStatusAction(lead.id, values)
      if (!result.ok) {
        handleError(result.error, "Could not change the status.")
        return
      }
      toast.success(`Status changed to ${LEAD_STATUS_LABELS[values.status]}.`)
      reset(DEFAULT_VALUES)
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(DEFAULT_VALUES)
      }}
    >
      <DialogTrigger
        render={<Button variant="outline" disabled={nextStatuses.length === 0} />}
      >
        Change status
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            Currently {LEAD_STATUS_LABELS[lead.status]}. Converted and lost
            leads are closed for good.
          </DialogDescription>
        </DialogHeader>
        <form
          id="change-status-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField id="status" label="New status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <OptionSelect
                  id="status"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={options}
                  placeholder="Select a status"
                  invalid={!!errors.status}
                />
              )}
            />
          </FormField>
          <FormField id="status-notes" label="Notes">
            <Textarea id="status-notes" rows={3} {...register("notes")} />
          </FormField>
        </form>
        <DialogFooter>
          <Button type="submit" form="change-status-form" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
