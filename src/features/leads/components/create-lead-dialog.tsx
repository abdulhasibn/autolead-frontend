"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useApiError } from "@/hooks/use-api-error"
import { createLeadAction } from "../actions"
import { LEAD_SOURCES, LEAD_SOURCE_LABELS } from "../constants"
import {
  createLeadFormSchema,
  type CreateLeadFormInput,
  type CreateLeadInput,
} from "../schemas"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"
import type { VehicleOption } from "./types"

const SOURCE_OPTIONS = LEAD_SOURCES.map((s) => ({
  value: s,
  label: LEAD_SOURCE_LABELS[s],
}))

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

const DEFAULT_VALUES: CreateLeadFormInput = {
  fullName: "",
  phone: "",
  email: "",
  source: "" as CreateLeadFormInput["source"],
  vehicleId: "",
  budget: "",
  preferredVehicle: "",
  purchaseTimeline: "",
  currentVehicle: "",
  financeRequired: "",
  tradeInRequired: "",
  notes: "",
}

export function CreateLeadDialog({ vehicles }: { vehicles: VehicleOption[] }) {
  const router = useRouter()
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLeadFormInput, unknown, CreateLeadInput>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const vehicleOptions = vehicles
    .filter((v) => v.linkable)
    .map((v) => ({ value: v.id, label: v.label }))

  function onSubmit(values: CreateLeadInput) {
    startTransition(async () => {
      const result = await createLeadAction(values)
      if (!result.ok) {
        handleError(result.error, "Could not create the lead.")
        return
      }
      toast.success(`Lead created for ${result.data.contactFullName}.`)
      reset(DEFAULT_VALUES)
      setOpen(false)
      router.push(`/leads/${result.data.id}`)
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
      <DialogTrigger render={<Button />}>
        <Plus />
        New lead
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
          <DialogDescription>
            An existing contact with the same phone number is reused.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-lead-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <FormField id="fullName" label="Full name *" error={errors.fullName?.message}>
            <Input id="fullName" autoComplete="off" aria-invalid={!!errors.fullName} {...register("fullName")} />
          </FormField>
          <FormField id="phone" label="Phone *" error={errors.phone?.message}>
            <Input id="phone" type="tel" placeholder="+919876543210" aria-invalid={!!errors.phone} {...register("phone")} />
          </FormField>
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
          </FormField>
          <FormField id="source" label="Source *" error={errors.source?.message}>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <OptionSelect
                  id="source"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={SOURCE_OPTIONS}
                  placeholder="Select a source"
                  invalid={!!errors.source}
                />
              )}
            />
          </FormField>
          <FormField id="vehicleId" label="Vehicle" error={errors.vehicleId?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="vehicleId"
              render={({ field }) => (
                <OptionSelect
                  id="vehicleId"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[{ value: "", label: "No vehicle" }, ...vehicleOptions]}
                  placeholder={vehicleOptions.length ? "Link a vehicle (optional)" : "No vehicles available"}
                />
              )}
            />
          </FormField>
          <FormField id="budget" label="Budget (₹)" error={errors.budget?.message}>
            <Input id="budget" type="number" min={0} step={1000} inputMode="numeric" aria-invalid={!!errors.budget} {...register("budget")} />
          </FormField>
          <FormField id="purchaseTimeline" label="Purchase timeline">
            <Input id="purchaseTimeline" placeholder="e.g. Within a month" {...register("purchaseTimeline")} />
          </FormField>
          <FormField id="preferredVehicle" label="Preferred vehicle">
            <Input id="preferredVehicle" placeholder="e.g. Hyundai Creta 2021" {...register("preferredVehicle")} />
          </FormField>
          <FormField id="currentVehicle" label="Current vehicle">
            <Input id="currentVehicle" {...register("currentVehicle")} />
          </FormField>
          <FormField id="financeRequired" label="Finance required">
            <Controller
              control={control}
              name="financeRequired"
              render={({ field }) => (
                <OptionSelect
                  id="financeRequired"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[{ value: "", label: "Unknown" }, ...YES_NO_OPTIONS]}
                  placeholder="Unknown"
                />
              )}
            />
          </FormField>
          <FormField id="tradeInRequired" label="Trade-in required">
            <Controller
              control={control}
              name="tradeInRequired"
              render={({ field }) => (
                <OptionSelect
                  id="tradeInRequired"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[{ value: "", label: "Unknown" }, ...YES_NO_OPTIONS]}
                  placeholder="Unknown"
                />
              )}
            />
          </FormField>
          <FormField id="notes" label="Notes" className="sm:col-span-2">
            <Textarea id="notes" rows={3} {...register("notes")} />
          </FormField>
        </form>

        <DialogFooter>
          <Button type="submit" form="create-lead-form" disabled={isPending}>
            {isPending ? "Creating…" : "Create lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
