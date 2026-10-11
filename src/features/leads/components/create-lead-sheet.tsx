"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
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
import type { MakeReadModel } from "@/features/catalog/types"
import { useApiError } from "@/hooks/use-api-error"
import { cn } from "@/lib/utils"
import { createLeadAction } from "../actions"
import { LEAD_SOURCES, LEAD_SOURCE_LABELS } from "../constants"
import { EMPTY_PREFERENCE_FORM } from "../preference"
import {
  createLeadFormSchema,
  type CreateLeadFormInput,
  type CreateLeadInput,
} from "../schemas"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"
import { PreferenceFields, preferenceErrors } from "./preference-fields"
import { SegmentedChoice } from "./segmented-choice"
import type { VehicleOption } from "./types"

const SOURCE_OPTIONS = LEAD_SOURCES.map((s) => ({
  value: s,
  label: LEAD_SOURCE_LABELS[s],
}))

const YES_NO_OPTIONS = [
  { value: "", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

const STEPS = ["Contact", "Requirements", "Details"] as const

const STEP_FIELDS: Array<Array<keyof CreateLeadFormInput>> = [
  ["fullName", "phone", "email", "source"],
  [
    "budget",
    "purchaseTimeline",
    "preferredColours",
    "preferredYearMin",
    "preferredYearMax",
    "preferredKmMax",
    "preferredMaxOwners",
  ],
  ["vehicleId", "financeRequired", "tradeInRequired", "currentVehicle", "preferredVehicle", "notes"],
]

const LAST_STEP = STEPS.length - 1

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
  ...EMPTY_PREFERENCE_FORM,
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">{children}</h3>
  )
}

/**
 * New lead in three steps. Only the contact step is required, so "Create
 * now" lets a quick walk-in be saved without the rest.
 */
export function CreateLeadSheet({
  vehicles,
  makes,
}: {
  vehicles: VehicleOption[]
  makes: MakeReadModel[]
}) {
  const router = useRouter()
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<CreateLeadFormInput, unknown, CreateLeadInput>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  })
  const values = useWatch({ control })

  const vehicleOptions = vehicles
    .filter((v) => v.linkable)
    .map((v) => ({ value: v.id, label: v.label }))

  function close() {
    setOpen(false)
    setStep(0)
    reset(DEFAULT_VALUES)
  }

  async function next() {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => s + 1)
  }

  function submit(data: CreateLeadInput) {
    startTransition(async () => {
      const result = await createLeadAction(data)
      if (!result.ok) {
        handleError(result.error, "Could not create the lead.")
        return
      }
      toast.success(`Lead created for ${result.data.contactFullName}.`)
      close()
      router.push(`/leads/${result.data.id}`)
    })
  }

  /** Validates everything; jumps back to the first step with an error. */
  function createNow() {
    void handleSubmit(submit, (fieldErrors) => {
      const first = STEP_FIELDS.findIndex((fields) => fields.some((f) => f in fieldErrors))
      if (first !== -1) setStep(first)
    })()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true)
        else close()
      }}
    >
      <SheetTrigger render={<Button />}>
        <Plus />
        New lead
      </SheetTrigger>

      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b border-border/50 px-5 py-4">
          <SheetTitle className="text-lg font-semibold">New lead</SheetTitle>
          <SheetDescription className="text-xs">
            Only contact details are required. An existing contact with the same phone number is
            reused.
          </SheetDescription>
          <ol className="mt-3 flex gap-2 text-xs font-medium">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  aria-current={i === step ? "step" : undefined}
                  // Earlier steps are always reachable; later ones go through Continue.
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-center gap-1.5 disabled:cursor-default",
                    i <= step ? "text-primary" : "text-subtle-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                      i < step
                        ? "bg-accent text-primary/80"
                        : i === step
                          ? "bg-primary text-white"
                          : "border border-border"
                    )}
                  >
                    {i < step ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </SheetHeader>

        <form
          id="create-lead-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (step < LAST_STEP) void next()
            else createNow()
          }}
          className="flex-1 space-y-6 overflow-y-auto p-5"
        >
          {step === 0 && (
            <>
              <section className="space-y-3">
                <SectionTitle>Who</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField id="fullName" label="Full name *" error={errors.fullName?.message}>
                    <Input id="fullName" autoComplete="off" autoFocus aria-invalid={!!errors.fullName} {...register("fullName")} />
                  </FormField>
                  <FormField id="phone" label="Phone *" error={errors.phone?.message}>
                    <Input id="phone" type="tel" placeholder="+919876543210" aria-invalid={!!errors.phone} {...register("phone")} />
                  </FormField>
                  <FormField id="email" label="Email" error={errors.email?.message} className="sm:col-span-2">
                    <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
                  </FormField>
                </div>
              </section>
              <section className="space-y-3">
                <SectionTitle>How they found us</SectionTitle>
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
              </section>
            </>
          )}

          {step === 1 && (
            <>
              <section className="space-y-3">
                <SectionTitle>Budget &amp; timing</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField id="budget" label="Max budget (₹)" error={errors.budget?.message}>
                    <Input id="budget" type="number" min={0} step={1000} inputMode="numeric" placeholder="e.g. 650000" aria-invalid={!!errors.budget} {...register("budget")} />
                  </FormField>
                  <FormField id="purchaseTimeline" label="Purchase timeline">
                    <Input id="purchaseTimeline" placeholder="e.g. Within a month" {...register("purchaseTimeline")} />
                  </FormField>
                </div>
              </section>
              <div className="rounded-lg bg-accent px-3 py-2 text-xs text-primary/80">
                Everything below is optional. Leave a field empty for &ldquo;any&rdquo;. Cars are
                scored against these.
              </div>
              <PreferenceFields
                values={values}
                onChange={(name, value) =>
                  // RHF can't resolve PathValue for a generic key.
                  setValue(name, value as never, { shouldValidate: isSubmitted, shouldDirty: true })
                }
                errors={preferenceErrors(errors)}
                makes={makes}
              />
            </>
          )}

          {step === 2 && (
            <>
              <section className="space-y-3">
                <SectionTitle>Vehicle</SectionTitle>
                <FormField id="vehicleId" label="Link a car in stock" error={errors.vehicleId?.message}>
                  <Controller
                    control={control}
                    name="vehicleId"
                    render={({ field }) => (
                      <OptionSelect
                        id="vehicleId"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[{ value: "", label: "No vehicle" }, ...vehicleOptions]}
                        placeholder={vehicleOptions.length ? "No vehicle" : "No vehicles available"}
                      />
                    )}
                  />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField id="currentVehicle" label="Current vehicle">
                    <Input id="currentVehicle" placeholder="e.g. 2015 Maruti Swift" {...register("currentVehicle")} />
                  </FormField>
                  <FormField id="preferredVehicle" label="Car mentioned (free text)">
                    <Input id="preferredVehicle" placeholder="e.g. Hyundai Creta 2021" {...register("preferredVehicle")} />
                  </FormField>
                </div>
              </section>
              <section className="space-y-3">
                <SectionTitle>Deal</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["financeRequired", "tradeInRequired"] as const).map((name) => (
                    <FormField
                      key={name}
                      id={name}
                      label={name === "financeRequired" ? "Finance required" : "Trade-in required"}
                    >
                      <Controller
                        control={control}
                        name={name}
                        render={({ field }) => (
                          <SegmentedChoice
                            id={name}
                            aria-label={name === "financeRequired" ? "Finance required" : "Trade-in required"}
                            value={field.value}
                            onValueChange={field.onChange}
                            options={YES_NO_OPTIONS}
                          />
                        )}
                      />
                    </FormField>
                  ))}
                </div>
                <FormField id="notes" label="Notes">
                  <Textarea id="notes" rows={3} {...register("notes")} />
                </FormField>
              </section>
            </>
          )}
        </form>

        <div className="flex items-center justify-between gap-2 border-t border-border/50 px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}
            disabled={isPending}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <div className="flex gap-2">
            {step < LAST_STEP && (
              <Button
                type="button"
                variant="outline"
                onClick={createNow}
                disabled={isPending}
                className="border-border bg-card text-foreground hover:border-primary/20 hover:bg-accent hover:text-primary"
              >
                Create now
              </Button>
            )}
            <Button type="submit" form="create-lead-form" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {step < LAST_STEP ? "Continue" : "Create lead"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
