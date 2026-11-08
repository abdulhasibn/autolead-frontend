"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/features/leads/components/form-field"
import { OptionSelect } from "@/features/leads/components/option-select"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import { createEntryAction, updateEntryAction } from "../actions"
import { todayIST } from "../logic/dates"
import { financeErrorMessage } from "../logic/errors"
import { formatMoneyInput, parseMoneyInput } from "../logic/money"
import {
  isPurchaseTagName,
  nextPurpose,
  PURPOSE_HINTS,
  PURPOSE_LABELS,
  purposeForSave,
  purposeOptions,
  defaultPurpose,
} from "../logic/purpose"
import { entryFormSchema, type EntryFormValues } from "../schemas"
import type { EntryKind, FinanceEntry, FinanceTag, FinanceVehicleRef, ShowroomOption } from "../types"
import { MoneyInput } from "./money-input"
import { VehiclePicker } from "./pickers"
import type { PickerOption } from "./search-picker"
import { TagMultiSelect } from "./tag-multi-select"

export interface EntrySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: FinanceTag[]
  showrooms: ShowroomOption[]
  /** Edit this entry; otherwise create. */
  entry?: FinanceEntry | null
  /** New entry defaults (e.g. from a car’s Money tab). */
  defaultKind?: EntryKind
  defaultVehicle?: FinanceVehicleRef | null
  /** Hide the car picker (car fixed by the screen). */
  lockVehicle?: boolean
}

function initialValues(props: EntrySheetProps): EntryFormValues {
  const { entry, defaultKind = "expense", defaultVehicle = null } = props
  if (entry) {
    return {
      kind: entry.kind,
      amount: formatMoneyInput(entry.amount),
      entryDate: entry.entryDate,
      tagIds: entry.tags.map((t) => t.id),
      vehicleId: entry.vehicle?.id ?? null,
      purpose: entry.purpose,
      party: entry.party ?? "",
      note: entry.note ?? "",
      showroomId: entry.vehicle ? null : entry.showroomId,
    }
  }
  return {
    kind: defaultKind,
    amount: "",
    entryDate: todayIST(),
    tagIds: [],
    vehicleId: defaultVehicle?.id ?? null,
    purpose: defaultPurpose(defaultKind, Boolean(defaultVehicle)),
    party: "",
    note: "",
    showroomId: null,
  }
}

/** Add or edit one ledger entry. Remount (key) per entry so state starts fresh. */
export function EntrySheet(props: EntrySheetProps) {
  const { open, onOpenChange, entry } = props
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto overscroll-contain sm:max-w-md">
        <SheetHeader className="px-4 py-5 sm:px-6">
          <SheetTitle>{entry ? "Edit entry" : props.defaultKind === "income" ? "Add income" : "Add expense"}</SheetTitle>
          <SheetDescription>
            {entry ? "Kind can’t change once an entry is saved." : "Every rupee in or out is one entry."}
          </SheetDescription>
        </SheetHeader>
        {open && <EntryForm key={entry?.id ?? "new"} {...props} />}
      </SheetContent>
    </Sheet>
  )
}

function EntryForm(props: EntrySheetProps) {
  const { entry, tags, showrooms, onOpenChange, lockVehicle, defaultVehicle } = props
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [vehicle, setVehicle] = useState<PickerOption | null>(
    entry?.vehicle ?? (defaultVehicle ? { id: defaultVehicle.id, label: defaultVehicle.label } : null)
  )
  // Did the admin choose the purpose by hand? Then car/tag changes leave it alone.
  const userPickedPurpose = useRef(Boolean(entry))

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: initialValues(props),
  })
  const kind = useWatch({ control, name: "kind" })
  const vehicleId = useWatch({ control, name: "vehicleId" })
  const purpose = useWatch({ control, name: "purpose" })
  const hasCar = Boolean(vehicleId)

  function onKindChange(next: EntryKind) {
    setValue("kind", next)
    userPickedPurpose.current = false
    setValue("purpose", defaultPurpose(next, hasCar))
  }

  function onVehicleChange(option: PickerOption | null) {
    setVehicle(option)
    setValue("vehicleId", option?.id ?? null)
    const v = getValues()
    setValue(
      "purpose",
      nextPurpose({
        kind: v.kind,
        hasCar: Boolean(option),
        current: v.purpose,
        userPicked: userPickedPurpose.current,
        carChanged: true,
      })
    )
  }

  function onTagsChange(next: string[]) {
    const v = getValues()
    const added = next.filter((id) => !v.tagIds.includes(id))
    const purchaseTagAdded = added.some((id) => isPurchaseTagName(tags.find((t) => t.id === id)?.name ?? ""))
    setValue("tagIds", next, { shouldValidate: true })
    if (purchaseTagAdded) {
      setValue(
        "purpose",
        nextPurpose({
          kind: v.kind,
          hasCar: Boolean(v.vehicleId),
          current: v.purpose,
          userPicked: userPickedPurpose.current,
          purchaseTagAdded,
        })
      )
    }
  }

  function submit(values: EntryFormValues) {
    const amount = parseMoneyInput(values.amount)
    if (amount === null) return
    const body = {
      kind: values.kind,
      amount,
      entryDate: values.entryDate,
      tagIds: values.tagIds,
      vehicleId: values.vehicleId,
      purpose: purposeForSave(values.purpose, Boolean(values.vehicleId)),
      party: values.party.trim() || null,
      note: values.note.trim() || null,
      showroomId: values.vehicleId ? null : values.showroomId,
    }
    startTransition(async () => {
      const result = entry
        ? await updateEntryAction(entry.id, body, entry.vehicle?.id ?? null)
        : await createEntryAction(body)
      if (!result.ok) {
        toast.error(financeErrorMessage(result.error))
        if (result.error.code === "FINANCE_TAG_ARCHIVED" || result.error.code === "FINANCE_TAG_NOT_FOUND") {
          router.refresh()
        }
        return
      }
      toast.success(entry ? "Entry updated." : values.kind === "income" ? "Income added." : "Expense added.")
      onOpenChange(false)
      router.refresh()
    })
  }

  const purposeChoices = purposeOptions(kind, hasCar)
  const activeTags = tags.filter((t) => !t.archived)

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-1 flex-col" noValidate>
      <div className="flex-1 space-y-4 px-4 pb-4 sm:px-6">
        <FormField id="entry-kind" label="Kind">
          {entry ? (
            <p className="text-sm font-medium text-foreground">
              {kind === "income" ? "Income (received)" : "Expense (paid)"}
            </p>
          ) : (
            <SegmentedChoice
              id="entry-kind"
              value={kind}
              onValueChange={(v) => onKindChange(v as EntryKind)}
              options={[
                { value: "expense", label: "Expense (paid)" },
                { value: "income", label: "Income (received)" },
              ]}
            />
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="entry-amount" label="Amount" error={errors.amount?.message}>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <MoneyInput
                  id="entry-amount"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={errors.amount ? true : undefined}
                />
              )}
            />
          </FormField>
          <FormField id="entry-date" label="Date" error={errors.entryDate?.message}>
            <Controller
              control={control}
              name="entryDate"
              render={({ field }) => (
                <DatePicker id="entry-date" value={field.value} onChange={field.onChange} invalid={Boolean(errors.entryDate)} />
              )}
            />
          </FormField>
        </div>

        <FormField id="entry-tags" label="Tags" error={errors.tagIds?.message}>
          <Controller
            control={control}
            name="tagIds"
            render={({ field }) => (
              <TagMultiSelect id="entry-tags" tags={tags} value={field.value} onValueChange={onTagsChange} />
            )}
          />
          {activeTags.length === 0 && (
            <p className="text-xs text-subtle-foreground">No tags yet — add some in Finance › Settings.</p>
          )}
        </FormField>

        {!lockVehicle && (
          <FormField id="entry-vehicle" label="Car (optional)">
            <VehiclePicker id="entry-vehicle" value={vehicle} onChange={onVehicleChange} />
          </FormField>
        )}
        {lockVehicle && vehicle && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Car: <span className="font-medium text-foreground">{vehicle.label}</span>
          </p>
        )}

        {hasCar ? (
          <FormField id="entry-purpose" label="Purpose">
            <OptionSelect
              id="entry-purpose"
              value={purpose}
              onValueChange={(v) => {
                if (!v) return
                userPickedPurpose.current = true
                setValue("purpose", v as EntryFormValues["purpose"])
              }}
              options={purposeChoices.map((p) => ({ value: p, label: PURPOSE_LABELS[p] }))}
            />
            <p className="text-xs text-subtle-foreground">{PURPOSE_HINTS[purpose]}</p>
          </FormField>
        ) : (
          showrooms.length > 1 && (
            <FormField id="entry-showroom" label="Showroom (optional)">
              <Controller
                control={control}
                name="showroomId"
                render={({ field }) => (
                  <OptionSelect
                    id="entry-showroom"
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || null)}
                    placeholder="My home showroom"
                    options={[{ value: "", label: "My home showroom" }, ...showrooms.map((s) => ({ value: s.id, label: s.name }))]}
                  />
                )}
              />
            </FormField>
          )
        )}

        <FormField id="entry-party" label={kind === "income" ? "Received from (optional)" : "Paid to (optional)"} error={errors.party?.message}>
          <Input id="entry-party" maxLength={120} autoComplete="off" {...register("party")} />
        </FormField>
        <FormField id="entry-note" label="Note (optional)" error={errors.note?.message}>
          <Textarea id="entry-note" rows={3} maxLength={1000} {...register("note")} />
        </FormField>
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-popover px-4 py-3 sm:px-6">
        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {entry ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  )
}
