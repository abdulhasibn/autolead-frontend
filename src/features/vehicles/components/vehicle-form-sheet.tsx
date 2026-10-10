"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2, Pencil, Plus, Search, Sparkles, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
import type { MakeReadModel, ModelReadModel, VariantReadModel } from "@/features/catalog/types"
import { FormField } from "@/features/leads/components/form-field"
import { OptionSelect } from "@/features/leads/components/option-select"
import type { OwnerDto } from "@/features/owners/types"
import { useApiError } from "@/hooks/use-api-error"
import { cn } from "@/lib/utils"
import {
  createOwnerQuickAction,
  createVehicleAction,
  getModelsAction,
  getVariantsAction,
  updateVehicleAction,
} from "../actions"
import {
  ACQUISITION_TYPES,
  ACQUISITION_TYPE_LABELS,
  FUEL_TYPES,
  FUEL_TYPE_LABELS,
  RC_STATUSES,
  RC_STATUS_LABELS,
  SERVICE_HISTORIES,
  SERVICE_HISTORY_LABELS,
  TRANSMISSIONS,
  TRANSMISSION_LABELS,
  isFuelType,
  isTransmission,
} from "../constants"
import {
  createVehicleFormSchema,
  toVehicleDetails,
  vehicleFormSchema,
  type VehicleFormInput,
  type VehicleFormOutput,
} from "../schemas"
import type { VehicleDto } from "../types"
import { formatPlate, formatVehicleTitle } from "../utils"
import { PhotoManager } from "./photo-manager"

type Props =
  | { mode: "create"; makes: MakeReadModel[]; owners: OwnerDto[] }
  | { mode: "edit"; vehicle: VehicleDto }

const STEPS = {
  create: ["Vehicle", "Condition", "Owner", "Photos"],
  edit: ["Vehicle", "Condition"],
} as const

const STEP_FIELDS: Array<Array<keyof VehicleFormInput>> = [
  ["makeId", "modelId", "variantId", "registrationNumber", "year", "fuelType", "transmission", "kmDriven", "numPreviousOwners", "colour"],
  ["insuranceValidUntil", "rcStatus", "serviceHistory", "accidentHistory", "location", "description"],
  ["ownerId", "acquisitionType"],
]

const EMPTY: VehicleFormInput = {
  makeId: "",
  modelId: "",
  variantId: "",
  year: "",
  registrationNumber: "",
  fuelType: "" as VehicleFormInput["fuelType"],
  transmission: "" as VehicleFormInput["transmission"],
  kmDriven: "",
  numPreviousOwners: "1",
  colour: "",
  insuranceValidUntil: "",
  rcStatus: "",
  serviceHistory: "",
  accidentHistory: "no",
  location: "",
  description: "",
  ownerId: "",
  acquisitionType: "",
}

function fromVehicle(v: VehicleDto): VehicleFormInput {
  return {
    ...EMPTY,
    year: String(v.year),
    registrationNumber: formatPlate(v.registrationNumber),
    fuelType: v.fuelType,
    transmission: v.transmission,
    kmDriven: String(v.kmDriven),
    numPreviousOwners: String(v.numPreviousOwners),
    colour: v.colour,
    insuranceValidUntil: v.insuranceValidUntil ?? "",
    rcStatus: v.rcStatus ?? "",
    serviceHistory: v.serviceHistory ?? "",
    accidentHistory: v.accidentHistory ? "yes" : "no",
    location: v.location ?? "",
    description: v.description ?? "",
  }
}

/** Single-choice pill group; clicking the selected pill clears an optional one. */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  optional,
  ariaLabel,
}: {
  value: string
  onChange: (value: T | "") => void
  options: ReadonlyArray<{ value: T; label: string }>
  optional?: boolean
  ariaLabel: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected && optional ? "" : option.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              selected
                ? "border-[#0D9488] bg-[#F0FDFA] font-semibold text-[#0D9488]"
                : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#99F6E4]"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function labelled<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }))
}

export function VehicleFormSheet(props: Props) {
  const router = useRouter()
  const { handleError } = useApiError()
  const isCreate = props.mode === "create"
  const steps = STEPS[props.mode]

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [created, setCreated] = useState<VehicleDto | null>(null)

  const [models, setModels] = useState<ModelReadModel[]>([])
  const [variants, setVariants] = useState<VariantReadModel[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  const [owners, setOwners] = useState<OwnerDto[]>(isCreate ? props.owners : [])
  const [ownerQuery, setOwnerQuery] = useState("")
  const [newOwner, setNewOwner] = useState<{ fullName: string; phone: string; city: string } | null>(null)
  const [savingOwner, setSavingOwner] = useState(false)

  const defaults = props.mode === "edit" ? fromVehicle(props.vehicle) : EMPTY
  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormInput, unknown, VehicleFormOutput>({
    resolver: zodResolver(
      isCreate ? createVehicleFormSchema : vehicleFormSchema
    ) as Resolver<VehicleFormInput, unknown, VehicleFormOutput>,
    defaultValues: defaults,
    mode: "onTouched",
  })

  function resetAll() {
    reset(defaults)
    setStep(0)
    setCreated(null)
    setModels([])
    setVariants([])
    setPrefilled(false)
    setOwnerQuery("")
    setNewOwner(null)
  }

  function finish(vehicle: VehicleDto | null) {
    setOpen(false)
    resetAll()
    if (vehicle) router.push(`/vehicles/${vehicle.id}`)
  }

  async function chooseMake(makeId: string) {
    setValue("makeId", makeId, { shouldValidate: true })
    setValue("modelId", "")
    setValue("variantId", "")
    setModels([])
    setVariants([])
    if (!makeId) return
    setLoadingCatalog(true)
    const result = await getModelsAction(makeId)
    setLoadingCatalog(false)
    if (result.ok) setModels(result.data)
    else handleError(result.error, "Could not load models.")
  }

  async function chooseModel(modelId: string) {
    setValue("modelId", modelId, { shouldValidate: true })
    setValue("variantId", "")
    setVariants([])
    if (!modelId) return
    setLoadingCatalog(true)
    const result = await getVariantsAction(modelId)
    setLoadingCatalog(false)
    if (result.ok) setVariants(result.data)
    else handleError(result.error, "Could not load variants.")
  }

  function chooseVariant(variantId: string) {
    setValue("variantId", variantId, { shouldValidate: true })
    const variant = variants.find((v) => v.id === variantId)
    let filled = false
    if (variant && isFuelType(variant.fuelType)) {
      setValue("fuelType", variant.fuelType, { shouldValidate: true })
      filled = true
    }
    if (variant && isTransmission(variant.transmission)) {
      setValue("transmission", variant.transmission, { shouldValidate: true })
      filled = true
    }
    setPrefilled(filled)
  }

  async function saveNewOwner() {
    if (!newOwner) return
    setSavingOwner(true)
    const result = await createOwnerQuickAction(newOwner)
    setSavingOwner(false)
    if (!result.ok) {
      handleError(result.error, "Could not add the owner. Check the name and phone (+91…).")
      return
    }
    setOwners((list) => [result.data, ...list])
    setValue("ownerId", result.data.id, { shouldValidate: true })
    setNewOwner(null)
    setOwnerQuery("")
  }

  async function next() {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  function submit(values: VehicleFormOutput) {
    startTransition(async () => {
      const details = toVehicleDetails(values)
      if (props.mode === "edit") {
        const result = await updateVehicleAction(props.vehicle.id, details)
        if (!result.ok) {
          handleError(result.error, "Could not save the changes.")
          return
        }
        toast.success("Vehicle updated.")
        setOpen(false)
        setStep(0)
        router.refresh()
        return
      }
      const result = await createVehicleAction({
        ...details,
        variantId: values.variantId,
        ownerId: values.ownerId,
        acquisitionType: values.acquisitionType,
      })
      if (!result.ok) {
        if (result.error.status === 409) {
          setStep(0)
          toast.error("A vehicle with this registration number already exists.")
        } else {
          handleError(result.error, "Could not add the vehicle.")
        }
        return
      }
      toast.success("Vehicle added. Now add its photos.")
      setCreated(result.data)
      setStep(3)
    })
  }

  const lastFormStep = isCreate ? 2 : 1
  const values = useWatch({ control })
  const q = ownerQuery.trim().toLowerCase()
  const filteredOwners = owners
    .filter(
      (o) =>
        !q ||
        o.fullName.toLowerCase().includes(q) ||
        o.phone.includes(q.replace(/\s/g, "")) ||
        o.city?.toLowerCase().includes(q)
    )
    .slice(0, 50)
  const selectedOwner = owners.find((o) => o.id === values.ownerId)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && created) {
          finish(created)
          return
        }
        setOpen(next)
        if (!next) resetAll()
      }}
    >
      <SheetTrigger
        render={
          isCreate ? (
            <Button className="h-9" />
          ) : (
            <Button variant="outline" className="h-9 border-[#E5E7EB] bg-white hover:border-[#0D9488]" />
          )
        }
      >
        {isCreate ? <Plus /> : <Pencil />}
        {isCreate ? "Add vehicle" : "Edit details"}
      </SheetTrigger>

      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b border-[#F3F4F6] px-5 py-4">
          <SheetTitle className="text-lg font-semibold">
            {isCreate ? "Add vehicle" : `Edit ${formatVehicleTitle(props.vehicle)}`}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {isCreate ? "Add a vehicle to inventory in four steps." : "Edit the vehicle's details."}
          </SheetDescription>
          <ol className="mt-3 flex gap-2 text-xs font-medium">
            {steps.map((label, i) => (
              <li
                key={label}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex flex-1 items-center gap-1.5",
                  i <= step ? "text-[#0D9488]" : "text-[#9CA3AF]"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                    i < step
                      ? "bg-[#CCFBF1] text-[#0F766E]"
                      : i === step
                        ? "bg-[#0D9488] text-white"
                        : "border border-[#D1D5DB]"
                  )}
                >
                  {i < step ? <Check className="size-3" /> : i + 1}
                </span>
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ol>
        </SheetHeader>

        <form
          id="vehicle-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (step < lastFormStep) void next()
            else void handleSubmit(submit)(e)
          }}
          className="flex-1 space-y-5 overflow-y-auto p-5"
        >
          {step === 0 && (
            <>
              {isCreate ? (
                <div className="space-y-2">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormField id="makeId" label="Make *" error={errors.makeId?.message}>
                      <OptionSelect
                        id="makeId"
                        value={values.makeId ?? ""}
                        onValueChange={chooseMake}
                        options={props.makes.map((m) => ({ value: m.id, label: m.name }))}
                        placeholder="Select make"
                        invalid={!!errors.makeId}
                      />
                    </FormField>
                    <FormField id="modelId" label="Model *" error={errors.modelId?.message}>
                      <OptionSelect
                        id="modelId"
                        value={values.modelId ?? ""}
                        onValueChange={chooseModel}
                        options={models.map((m) => ({ value: m.id, label: m.name }))}
                        placeholder={values.makeId ? "Select model" : "Pick a make first"}
                        disabled={!values.makeId || loadingCatalog}
                        invalid={!!errors.modelId}
                      />
                    </FormField>
                    <FormField id="variantId" label="Variant *" error={errors.variantId?.message}>
                      <OptionSelect
                        id="variantId"
                        value={values.variantId ?? ""}
                        onValueChange={chooseVariant}
                        options={variants.map((v) => ({ value: v.id, label: v.name }))}
                        placeholder={values.modelId ? "Select variant" : "Pick a model first"}
                        disabled={!values.modelId || loadingCatalog}
                        invalid={!!errors.variantId}
                      />
                    </FormField>
                  </div>
                  {prefilled && (
                    <p className="flex items-center gap-1.5 text-xs text-[#0D9488]">
                      <Sparkles className="size-3.5" />
                      Fuel and transmission filled in from the variant
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-xs text-[#6B7280]">
                  {[props.vehicle.makeName, props.vehicle.modelName, props.vehicle.variantName]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  — the model, owner and acquisition type can&apos;t be changed after adding.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="registrationNumber" label="Registration number *" error={errors.registrationNumber?.message}>
                  <Input
                    id="registrationNumber"
                    autoComplete="off"
                    placeholder="KL 07 CU 4521"
                    className="font-mono-data tracking-[0.06em] uppercase"
                    aria-invalid={!!errors.registrationNumber}
                    {...register("registrationNumber")}
                  />
                </FormField>
                <FormField id="year" label="Year *" error={errors.year?.message}>
                  <Input id="year" inputMode="numeric" placeholder="2021" className="font-mono-data" aria-invalid={!!errors.year} {...register("year")} />
                </FormField>
                <FormField id="fuelType" label="Fuel *" error={errors.fuelType?.message}>
                  <Controller
                    control={control}
                    name="fuelType"
                    render={({ field }) => (
                      <OptionSelect id="fuelType" value={field.value} onValueChange={field.onChange}
                        options={labelled(FUEL_TYPES, FUEL_TYPE_LABELS)} placeholder="Select fuel" invalid={!!errors.fuelType} />
                    )}
                  />
                </FormField>
                <FormField id="transmission" label="Transmission *" error={errors.transmission?.message}>
                  <Controller
                    control={control}
                    name="transmission"
                    render={({ field }) => (
                      <OptionSelect id="transmission" value={field.value} onValueChange={field.onChange}
                        options={labelled(TRANSMISSIONS, TRANSMISSION_LABELS)} placeholder="Select transmission" invalid={!!errors.transmission} />
                    )}
                  />
                </FormField>
                <FormField id="kmDriven" label="Km driven *" error={errors.kmDriven?.message}>
                  <Input id="kmDriven" inputMode="numeric" placeholder="42,150" className="font-mono-data" aria-invalid={!!errors.kmDriven} {...register("kmDriven")} />
                </FormField>
                <FormField id="numPreviousOwners" label="Previous owners *" error={errors.numPreviousOwners?.message}>
                  <Input id="numPreviousOwners" inputMode="numeric" className="font-mono-data" aria-invalid={!!errors.numPreviousOwners} {...register("numPreviousOwners")} />
                </FormField>
                <FormField id="colour" label="Colour *" error={errors.colour?.message} className="sm:col-span-2">
                  <Input id="colour" placeholder="e.g. Polar White" aria-invalid={!!errors.colour} {...register("colour")} />
                </FormField>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-xs text-[#6B7280]">All optional. Fill in what you know now.</p>
              <FormField id="insuranceValidUntil" label="Insurance valid until" error={errors.insuranceValidUntil?.message}>
                <Controller control={control} name="insuranceValidUntil" render={({ field }) => (
                  <DatePicker
                    id="insuranceValidUntil"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.insuranceValidUntil}
                    className="sm:w-56"
                  />
                )} />
              </FormField>
              <FormField id="rcStatus" label="RC status">
                <Controller control={control} name="rcStatus" render={({ field }) => (
                  <Segmented ariaLabel="RC status" optional value={field.value} onChange={field.onChange} options={labelled(RC_STATUSES, RC_STATUS_LABELS)} />
                )} />
              </FormField>
              <FormField id="serviceHistory" label="Service history">
                <Controller control={control} name="serviceHistory" render={({ field }) => (
                  <Segmented ariaLabel="Service history" optional value={field.value} onChange={field.onChange} options={labelled(SERVICE_HISTORIES, SERVICE_HISTORY_LABELS)} />
                )} />
              </FormField>
              <FormField id="accidentHistory" label="Accident history">
                <Controller control={control} name="accidentHistory" render={({ field }) => (
                  <Segmented ariaLabel="Accident history" value={field.value}
                    onChange={(v) => field.onChange(v || "no")}
                    options={[{ value: "no", label: "No accidents" }, { value: "yes", label: "Reported" }]} />
                )} />
              </FormField>
              <FormField id="location" label="Location">
                <Input id="location" placeholder="e.g. Kochi showroom, bay 3" {...register("location")} />
              </FormField>
              <FormField id="description" label="Description">
                <Textarea id="description" rows={4} placeholder="Features, condition notes, anything a buyer should know" {...register("description")} />
              </FormField>
            </>
          )}

          {step === 2 && isCreate && (
            <>
              <FormField id="ownerId" label="Owner *" error={errors.ownerId?.message}>
                {selectedOwner && !newOwner ? (
                  <div className="flex items-center gap-3 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3 py-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-white font-semibold text-[#0D9488]">
                      {selectedOwner.fullName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#111827]">{selectedOwner.fullName}</p>
                      <p className="text-xs text-[#6B7280]">
                        {selectedOwner.phone}
                        {selectedOwner.city ? ` · ${selectedOwner.city}` : ""}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setValue("ownerId", "")}>
                      Change
                    </Button>
                  </div>
                ) : newOwner ? (
                  <div className="space-y-3 rounded-lg border border-[#E5E7EB] p-3">
                    <p className="text-sm font-semibold text-[#111827]">New owner</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input aria-label="Owner full name" placeholder="Full name" value={newOwner.fullName}
                        onChange={(e) => setNewOwner({ ...newOwner, fullName: e.target.value })} />
                      <Input aria-label="Owner phone" type="tel" placeholder="+919876543210" value={newOwner.phone}
                        onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value.replace(/\s/g, "") })} />
                      <Input aria-label="Owner city" placeholder="City (optional)" value={newOwner.city}
                        onChange={(e) => setNewOwner({ ...newOwner, city: e.target.value })} className="sm:col-span-2" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setNewOwner(null)}>
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={saveNewOwner}
                        disabled={savingOwner || !newOwner.fullName.trim() || !newOwner.phone.trim()}>
                        {savingOwner && <Loader2 className="animate-spin" />}
                        Save owner
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <Input aria-label="Search owners" placeholder="Search name, phone or city" className="pl-8"
                          value={ownerQuery} onChange={(e) => setOwnerQuery(e.target.value)} />
                      </div>
                      <Button type="button" variant="outline" onClick={() => setNewOwner({ fullName: ownerQuery, phone: "", city: "" })}>
                        <UserPlus />
                        New
                      </Button>
                    </div>
                    <ul className="max-h-64 divide-y divide-[#F3F4F6] overflow-y-auto rounded-lg border border-[#E5E7EB]">
                      {filteredOwners.length === 0 ? (
                        <li className="px-3 py-6 text-center text-xs text-[#9CA3AF]">
                          No owners match. Add them as a new owner.
                        </li>
                      ) : (
                        filteredOwners.map((owner) => (
                          <li key={owner.id}>
                            <button type="button"
                              onClick={() => setValue("ownerId", owner.id, { shouldValidate: true })}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#F9FAFB]">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-xs font-semibold text-[#0D9488]">
                                {owner.fullName.charAt(0).toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-[#111827]">{owner.fullName}</span>
                                <span className="block text-xs text-[#9CA3AF]">
                                  {owner.phone}
                                  {owner.city ? ` · ${owner.city}` : ""}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </FormField>

              <FormField id="acquisitionType" label="How was it acquired? *" error={errors.acquisitionType?.message}>
                <Controller control={control} name="acquisitionType" render={({ field }) => (
                  <Segmented ariaLabel="Acquisition type" value={field.value} onChange={field.onChange}
                    options={labelled(ACQUISITION_TYPES, ACQUISITION_TYPE_LABELS)} />
                )} />
              </FormField>
            </>
          )}

          {step === 3 && created && (
            <PhotoManager vehicleId={created.id} media={[]} canDelete={false} />
          )}
        </form>

        <div className="flex items-center justify-between gap-2 border-t border-[#F3F4F6] px-5 py-3">
          {step === 3 ? (
            <>
              <span className="text-xs text-[#9CA3AF]">You can add photos later too.</span>
              <Button type="button" onClick={() => finish(created)}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => (step === 0 ? (setOpen(false), resetAll()) : setStep((s) => s - 1))}
                disabled={isPending}
              >
                {step === 0 ? "Cancel" : "Back"}
              </Button>
              <Button type="submit" form="vehicle-form" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {step < lastFormStep
                  ? "Continue"
                  : isCreate
                    ? "Add vehicle"
                    : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
