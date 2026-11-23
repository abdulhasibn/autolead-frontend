"use client"

import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { OptionSelect } from "@/components/option-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useApiError } from "@/hooks/use-api-error"
import { updateLeadAction } from "../actions"
import { LEAD_SOURCE_LABELS, SELECTABLE_LEAD_SOURCES } from "../constants"
import { editLeadFormSchema, type EditLeadFormInput, type UpdateLeadInput } from "../schemas"
import type { LeadReadModel } from "../types"
import { FormField } from "./form-field"
import { SegmentedChoice } from "./segmented-choice"

const YES_NO_OPTIONS = [
  { value: "", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

function yesNo(value: boolean | null): "" | "yes" | "no" {
  return value === null ? "" : value ? "yes" : "no"
}

function formValues(lead: LeadReadModel): EditLeadFormInput {
  return {
    fullName: lead.contactFullName,
    phone: lead.contactPhone,
    email: lead.contactEmail ?? "",
    source: lead.source,
    budget: lead.budget === null ? "" : String(lead.budget),
    purchaseTimeline: lead.purchaseTimeline ?? "",
    currentVehicle: lead.currentVehicle ?? "",
    financeRequired: yesNo(lead.financeRequired),
    tradeInRequired: yesNo(lead.tradeInRequired),
    notes: lead.notes ?? "",
  }
}

/**
 * Fixes a lead's contact and requirement details (#21). The API replaces every
 * field, so the whole form is sent. The car, status, assignee and preference
 * have their own actions.
 */
export function EditLeadSheet({ lead, disabled }: { lead: LeadReadModel; disabled?: boolean }) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Older channels (marketplace, mobile app) stay pickable for the lead that has one.
  const sourceOptions = [
    ...(SELECTABLE_LEAD_SOURCES as readonly string[]).includes(lead.source) ? [] : [lead.source],
    ...SELECTABLE_LEAD_SOURCES,
  ].map((s) => ({ value: s, label: LEAD_SOURCE_LABELS[s] ?? s }))

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditLeadFormInput, unknown, UpdateLeadInput>({
    resolver: zodResolver(editLeadFormSchema),
    defaultValues: formValues(lead),
    mode: "onTouched",
  })

  function submit(data: UpdateLeadInput) {
    startTransition(async () => {
      const result = await updateLeadAction(lead.id, data)
      if (!result.ok) {
        handleError(result.error, "Could not save the lead.")
        return
      }
      toast.success("Lead updated.")
      setOpen(false)
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (isPending) return
        if (next) reset(formValues(lead))
        setOpen(next)
      }}
    >
      <SheetTrigger
        disabled={disabled || isPending}
        render={
          <Button
            variant="outline"
            aria-label="Edit lead"
            className="border-border bg-card text-foreground hover:border-primary/20 hover:bg-accent hover:text-primary max-sm:flex-none!"
          />
        }
      >
        <Pencil />
        <span className="max-sm:sr-only">Edit lead</span>
      </SheetTrigger>

      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b border-border/50 px-4 py-4 sm:px-5">
          <SheetTitle className="text-lg font-semibold">Edit lead</SheetTitle>
          <SheetDescription className="text-xs">
            Name and email belong to the contact, so they change on every lead with this phone
            number. A new phone number moves the lead to that contact.
          </SheetDescription>
        </SheetHeader>

        <form
          id="edit-lead-form"
          noValidate
          onSubmit={handleSubmit(submit)}
          className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="edit-fullName" label="Full name *" error={errors.fullName?.message}>
              <Input id="edit-fullName" autoComplete="off" aria-invalid={!!errors.fullName} {...register("fullName")} />
            </FormField>
            <FormField id="edit-phone" label="Phone *" error={errors.phone?.message}>
              <Input id="edit-phone" type="tel" autoComplete="off" maxLength={16} aria-invalid={!!errors.phone} {...register("phone")} />
            </FormField>
            <FormField id="edit-email" label="Email" error={errors.email?.message}>
              <Input id="edit-email" type="email" autoComplete="off" aria-invalid={!!errors.email} {...register("email")} />
            </FormField>
            <FormField id="edit-source" label="Source *" error={errors.source?.message}>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <OptionSelect
                    id="edit-source"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={sourceOptions}
                    invalid={!!errors.source}
                  />
                )}
              />
            </FormField>
            <FormField id="edit-budget" label="Max budget (₹)" error={errors.budget?.message}>
              <Input id="edit-budget" inputMode="numeric" aria-invalid={!!errors.budget} {...register("budget")} />
            </FormField>
            <FormField id="edit-purchaseTimeline" label="Purchase timeline">
              <Input id="edit-purchaseTimeline" {...register("purchaseTimeline")} />
            </FormField>
            <FormField id="edit-currentVehicle" label="Current vehicle" className="sm:col-span-2">
              <Input id="edit-currentVehicle" {...register("currentVehicle")} />
            </FormField>
            {(["financeRequired", "tradeInRequired"] as const).map((name) => {
              const label = name === "financeRequired" ? "Finance required" : "Trade-in required"
              return (
                <FormField key={name} id={`edit-${name}`} label={label}>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <SegmentedChoice
                        id={`edit-${name}`}
                        aria-label={label}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={YES_NO_OPTIONS}
                      />
                    )}
                  />
                </FormField>
              )
            })}
          </div>
          <FormField id="edit-notes" label="Notes">
            <Textarea id="edit-notes" rows={3} {...register("notes")} />
          </FormField>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-lead-form" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
