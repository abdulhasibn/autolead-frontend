"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker, pastDateYears } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/features/leads/components/form-field"
import { OptionSelect } from "@/components/option-select"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { createEntryAction, updateEntryAction } from "../actions"
import { parsePercent } from "../logic/acquisition"
import { todayIST } from "../logic/dates"
import { buyerOptions, defaultPaidBy, refundTargets } from "../logic/buyers"
import { financeErrorMessage } from "../logic/errors"
import { formatMoney, formatMoneyInput, parseMoneyInput } from "../logic/money"
import {
  isPurchaseTagName,
  nextPurpose,
  PURPOSE_HINTS,
  PURPOSE_LABELS,
  purposeForSave,
  purposeOptions,
  defaultPurpose,
} from "../logic/purpose"
import { commissionPercent as commissionPercentSchema, entryFormSchema, type EntryFormValues } from "../schemas"
import type {
  EntryBody,
  EntryDealTerms,
  EntryKind,
  EntryPurpose,
  FinanceEntry,
  FinanceTag,
  FinanceVehicleRef,
  ShowroomOption,
  VehicleMoneySummary,
} from "../types"
import { useCarBuyers, type CarBuyers } from "../use-car-buyers"
import { useVehicleMoney } from "../use-vehicle-money"
import { MoneyInput } from "./money-input"
import { LeadPicker, VehiclePicker } from "./pickers"
import type { PickerOption } from "./search-picker"
import { TagMultiSelect } from "./tag-multi-select"
import { useSaveTransition } from "@/hooks/use-save-transition"
import { termsMissing, sellerPaymentLine } from "../logic/seller-payment"

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
  /** The fixed car's buyers and refunds owed (from its Money tab): saves a lookup. */
  carBuyers?: CarBuyers
  /** Start a new entry with these values (e.g. "Record refund": purpose, lead, amount owed). */
  prefill?: { purpose?: EntryPurpose; leadId?: string; amount?: number }
}

function initialValues(props: EntrySheetProps): EntryFormValues {
  const { entry, defaultKind = "expense", defaultVehicle = null, prefill } = props
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
      leadId: entry.lead?.id ?? "",
    }
  }
  return {
    kind: defaultKind,
    amount: prefill?.amount ? formatMoneyInput(prefill.amount) : "",
    entryDate: todayIST(),
    tagIds: [],
    vehicleId: defaultVehicle?.id ?? null,
    purpose: prefill?.purpose && defaultVehicle ? prefill.purpose : defaultPurpose(defaultKind, Boolean(defaultVehicle)),
    party: "",
    note: "",
    showroomId: null,
    leadId: prefill?.leadId ?? "",
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
  const { isPending, run: startTransition, refresh } = useSaveTransition()
  const [vehicle, setVehicle] = useState<PickerOption | null>(
    entry?.vehicle ?? (defaultVehicle ? { id: defaultVehicle.id, label: defaultVehicle.label } : null)
  )
  // Did the admin choose the purpose by hand? Then car/tag changes leave it alone.
  const userPickedPurpose = useRef(Boolean(entry) || Boolean(props.prefill?.purpose))

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
  const tagIds = useWatch({ control, name: "tagIds" })
  const entryDate = useWatch({ control, name: "entryDate" })
  const leadId = useWatch({ control, name: "leadId" })
  const hasCar = Boolean(vehicleId)

  // Buyer payments and refunds belong to a lead: look up who the car's buyers are.
  const isBuyerPayment = hasCar && kind === "income" && purpose === "sale"
  const isRefund = hasCar && kind === "expense" && purpose === "refund"
  const buyersLookup = useCarBuyers(
    vehicleId,
    isBuyerPayment || isRefund,
    props.carBuyers && defaultVehicle ? { vehicleId: defaultVehicle.id, ...props.carBuyers } : undefined
  )
  const carBuyers = buyersLookup.data
  const buyerChoices = useMemo(() => (carBuyers ? buyerOptions(carBuyers.buyers) : []), [carBuyers])
  const refundChoices = useMemo(
    () => (carBuyers ? refundTargets(carBuyers.buyers, carBuyers.refundsOwed) : []),
    [carBuyers]
  )
  // An entry whose lead is no longer a buyer of its car: shown read-only, kept as is.
  const sameCarAndPurpose = Boolean(entry && entry.purpose === purpose && entry.vehicle?.id === vehicleId)
  const formerLead =
    isBuyerPayment && sameCarAndPurpose && entry?.lead && carBuyers && !buyerChoices.some((b) => b.id === entry.lead?.id)
      ? entry.lead
      : null
  const [leadError, setLeadError] = useState<string | null>(null)
  // Editing a buyer payment or refund: an admin may put it on any existing lead (e.g. on a sold car).
  const [changingLead, setChangingLead] = useState(false)
  const [pickedLead, setPickedLead] = useState<PickerOption | null>(null)
  const canChangeLead = Boolean(entry) && sameCarAndPurpose
  const searchLeads = (changingLead && canChangeLead) || buyersLookup.failed
  const [forfeit, setForfeit] = useState<{ body: EntryBody; values: EntryFormValues } | null>(null)
  // The refund being edited is already taken off what that buyer can still be refunded.
  const refundable =
    refundChoices.find((c) => c.id === leadId)?.owed != null
      ? (refundChoices.find((c) => c.id === leadId)?.owed ?? 0) +
        (entry?.purpose === "refund" && sameCarAndPurpose && entry.lead?.id === leadId ? entry.amount : 0)
      : null

  // A payment to the seller is tied to the car's deal: look the deal up, and
  // ask for the minimum terms with the payment when the car has none.
  const sellerPayment = kind === "expense" && purpose === "purchase" && hasCar
  const summaries = useVehicleMoney(vehicleId ? [vehicleId] : [], sellerPayment)
  const summary: VehicleMoneySummary | null = (vehicleId && summaries?.get(vehicleId)) || null
  // The server said the deal is missing although the lookup didn't (e.g. it failed).
  const [serverWantsDeal, setServerWantsDeal] = useState(false)
  const alreadyPaymentHere = entry?.purpose === "purchase" && entry.vehicle?.id === vehicleId
  const needsDeal =
    sellerPayment && !alreadyPaymentHere && (serverWantsDeal || (summary !== null && termsMissing(summary)))
  const commissionCar = summary?.saleModel === "commission"
  const [deal, setDeal] = useState({ rate: "", percent: "", purchasedOn: "" })
  const [dealErrors, setDealErrors] = useState<{ rate?: string; percent?: string }>({})
  const [overpaid, setOverpaid] = useState<{ body: EntryBody; message: string } | null>(null)

  // New payment on a car with a deal: start from what is still owed.
  const owed = summary?.owedToSeller ?? null
  useEffect(() => {
    if (!entry && sellerPayment && owed !== null && owed > 0 && getValues("amount") === "") {
      setValue("amount", formatMoneyInput(owed))
    }
  }, [entry, sellerPayment, owed, getValues, setValue])

  // Start with the only possible lead; with several the admin picks.
  useEffect(() => {
    if (!carBuyers || getValues("leadId") !== "" || sameCarAndPurpose) return
    const only = isRefund ? (refundChoices.length === 1 ? (refundChoices[0]?.id ?? "") : "") : isBuyerPayment ? defaultPaidBy(carBuyers.buyers) : ""
    if (only) setValue("leadId", only)
  }, [carBuyers, isRefund, isBuyerPayment, sameCarAndPurpose, refundChoices, getValues, setValue])

  const purchaseTagPicked = tagIds.some((tid) => isPurchaseTagName(tags.find((t) => t.id === tid)?.name ?? ""))

  function onKindChange(next: EntryKind) {
    setValue("kind", next)
    userPickedPurpose.current = false
    setValue("purpose", defaultPurpose(next, hasCar))
    setValue("leadId", "")
    setPickedLead(null)
    setLeadError(null)
  }

  function onVehicleChange(option: PickerOption | null) {
    setVehicle(option)
    setValue("vehicleId", option?.id ?? null)
    // The lead belonged to the old car's buyers.
    setValue("leadId", "")
    setPickedLead(null)
    setLeadError(null)
    const v = getValues()
    setValue(
      "purpose",
      nextPurpose({
        kind: v.kind,
        hasCar: Boolean(option),
        current: v.purpose,
        userPicked: userPickedPurpose.current,
        carChanged: true,
        // A "Purchase" tag already picked still means a payment to the seller, unless the admin chose a purpose.
        purchaseTagAdded: purchaseTagPicked && !userPickedPurpose.current,
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

  /** The deal fields as entered; null with errors set when they don't check out. */
  function dealTerms(): EntryDealTerms | null | "invalid" {
    if (!needsDeal) return null
    const purchasedOn = deal.purchasedOn || entryDate || null
    if (commissionCar) {
      const percent = parsePercent(deal.percent)
      const check = commissionPercentSchema.safeParse(percent)
      if (percent === null || !check.success) {
        setDealErrors({ percent: percent === null ? "Enter the commission %, e.g. 2" : check.error?.issues[0]?.message })
        return "invalid"
      }
      setDealErrors({})
      return { purchaseRate: null, commissionPercent: percent, purchasedOn }
    }
    const rate = parseMoneyInput(deal.rate)
    if (rate === null || rate <= 0) {
      setDealErrors({ rate: "Enter the purchase rate agreed with the seller" })
      return "invalid"
    }
    setDealErrors({})
    return { purchaseRate: rate, commissionPercent: null, purchasedOn }
  }

  function save(body: EntryBody, values: EntryFormValues) {
    startTransition(async () => {
      const result = entry
        ? await updateEntryAction(entry.id, body, entry.vehicle?.id ?? null)
        : await createEntryAction(body)
      if (!result.ok) {
        if (result.error.code === "SELLER_PAID_ABOVE_RATE") {
          const by = Number(result.error.details?.overpaidBy ?? 0)
          const limit = Number(result.error.details?.owedLimit ?? 0)
          setOverpaid({
            body,
            message: `This pays the seller ${formatMoney(by)} more than they’re owed (${formatMoney(limit)}${
              commissionCar ? " from the sale" : ", the purchase rate"
            }). Save it only if they really were paid more.`,
          })
          return
        }
        if (result.error.code === "DEAL_TERMS_REQUIRED") setServerWantsDeal(true)
        toast.error(financeErrorMessage(result.error))
        if (result.error.code === "FINANCE_TAG_ARCHIVED" || result.error.code === "FINANCE_TAG_NOT_FOUND") {
          refresh()
        }
        return
      }
      setOverpaid(null)
      toast.success(
        body.deal
          ? "Payment and the deal with the seller saved."
          : entry
            ? "Entry updated."
            : values.kind === "income"
              ? "Income added."
              : "Expense added."
      )
      refresh(() => onOpenChange(false))
    })
  }

  function submit(values: EntryFormValues) {
    const amount = parseMoneyInput(values.amount)
    if (amount === null) return
    const terms = dealTerms()
    if (terms === "invalid") return
    const buyerLine = Boolean(values.vehicleId) && (values.purpose === "sale" || values.purpose === "refund")
    const editingSameLine = Boolean(entry) && entry?.purpose === values.purpose && entry?.vehicle?.id === values.vehicleId
    if (buyerLine && !values.leadId && carBuyers && !editingSameLine) {
      if (values.purpose === "refund") return setLeadError("Pick the buyer this refund goes to")
      if (carBuyers.buyers.length > 1) return setLeadError("Pick who paid")
    }
    setLeadError(null)
    const body: EntryBody = {
      kind: values.kind,
      amount,
      entryDate: values.entryDate,
      tagIds: values.tagIds,
      vehicleId: values.vehicleId,
      purpose: purposeForSave(values.purpose, Boolean(values.vehicleId)),
      party: values.party.trim() || null,
      note: values.note.trim() || null,
      showroomId: values.vehicleId ? null : values.showroomId,
      ...(terms ? { deal: terms } : {}),
      // On edit, send the lead only when it changed (or the entry moves car): an unchanged lead would make
      // the server re-check a refund on every note or date edit.
      ...(buyerLine && values.leadId && (!editingSameLine || values.leadId !== (entry?.lead?.id ?? ""))
        ? { leadId: values.leadId }
        : {}),
    }
    // Buyer money turned into "Other income" is kept for good: it stops being owed back.
    if (entry?.purpose === "sale" && body.purpose === "other") return setForfeit({ body, values })
    save(body, values)
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
                <DatePicker {...pastDateYears()} id="entry-date" value={field.value} onChange={field.onChange} invalid={Boolean(errors.entryDate)} />
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
                if (v !== purpose) {
                  setValue("leadId", "")
                  setPickedLead(null)
                  setLeadError(null)
                }
                setValue("purpose", v as EntryFormValues["purpose"])
              }}
              options={purposeChoices.map((p) => ({ value: p, label: PURPOSE_LABELS[p] }))}
            />
            <p className="text-xs text-subtle-foreground">{PURPOSE_HINTS[purpose]}</p>
            {purpose === "cost" && purchaseTagPicked && (
              <p role="note" className="text-xs text-amber-700 dark:text-amber-400">
                Tagged “Purchase” but saved as a car cost: it adds to the car’s cost on top of the purchase rate. If
                this is money paid to the seller, choose “{PURPOSE_LABELS.purchase}”.
              </p>
            )}
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

        {(isBuyerPayment || isRefund) && (
          <FormField
            id="entry-lead"
            label={isRefund ? "Refund to" : "Paid by"}
            error={leadError ?? undefined}
          >
            {searchLeads ? (
              <>
                {buyersLookup.failed && (
                  <p className="text-xs text-destructive">
                    Couldn’t load this car’s buyers. Search for the lead, or{" "}
                    <button type="button" className="underline" onClick={buyersLookup.retry}>
                      try again
                    </button>
                    .
                  </p>
                )}
                <LeadPicker
                  id="entry-lead"
                  value={pickedLead}
                  onChange={(o) => {
                    setPickedLead(o)
                    setValue("leadId", o?.id ?? "")
                    setLeadError(null)
                  }}
                  invalid={Boolean(leadError)}
                />
              </>
            ) : formerLead ? (
              <p id="entry-lead" data-testid="entry-paid-by-readonly" className="rounded-lg bg-muted px-3 py-2 text-sm">
                {formerLead.name} · no longer a buyer
              </p>
            ) : (
              <OptionSelect
                id="entry-lead"
                value={leadId}
                onValueChange={(v) => {
                  setValue("leadId", v)
                  setLeadError(null)
                }}
                invalid={Boolean(leadError)}
                placeholder={carBuyers ? (isRefund ? "Pick the buyer" : "Pick who paid") : "Loading…"}
                disabled={!carBuyers}
                options={
                  isRefund
                    ? [
                        ...refundChoices.map((c) => ({ value: c.id, label: `${c.label} · ${formatMoney(c.owed)} to refund` })),
                        ...(entry?.lead && leadId === entry.lead.id && !refundChoices.some((c) => c.id === leadId)
                          ? [{ value: entry.lead.id, label: entry.lead.name }]
                          : []),
                      ]
                    : buyerChoices.map((b) => ({ value: b.id, label: b.label }))
                }
              />
            )}
            {canChangeLead && (
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => {
                  const next = !changingLead
                  setChangingLead(next)
                  setPickedLead(null)
                  setLeadError(null)
                  // "Keep current lead" goes back to the entry's own lead.
                  if (!next) setValue("leadId", entry?.lead?.id ?? "")
                }}
              >
                {changingLead ? "Keep current lead" : "Change lead"}
              </button>
            )}
            {isRefund && refundable !== null && (
              <p className="text-xs text-subtle-foreground">At most {formatMoney(refundable)} can be refunded to this buyer.</p>
            )}
            {isBuyerPayment && carBuyers && buyerChoices.length === 0 && !formerLead && !searchLeads && (
              <p className="text-xs text-subtle-foreground">
                No current buyer is shown for this car. If it isn’t sold yet, confirm a lead’s booking first, or save it
                as “Other car income”.
              </p>
            )}
            {isRefund && carBuyers && refundChoices.length === 0 && !searchLeads && (
              <p className="text-xs text-subtle-foreground">Nobody on this car has money to refund.</p>
            )}
          </FormField>
        )}

        {sellerPayment && !needsDeal && summary && sellerPaymentLine(summary) && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{sellerPaymentLine(summary)}</p>
        )}

        {needsDeal && (
          <fieldset aria-label="Deal with the seller" className="space-y-3 rounded-lg border border-primary/40 p-3">
            <legend className="px-1 text-sm font-semibold">
              {commissionCar ? "Deal with the owner" : "Deal with the seller"}
            </legend>
            <p className="text-xs text-muted-foreground">
              This car has no deal yet. A payment to the {commissionCar ? "owner" : "seller"} is recorded against it, so
              enter the {commissionCar ? "commission %" : "purchase rate"} too. Saved as the car’s deal.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {commissionCar ? (
                <FormField id="entry-deal-percent" label="Our commission (%)" error={dealErrors.percent}>
                  <Input
                    id="entry-deal-percent"
                    inputMode="decimal"
                    placeholder="e.g. 2"
                    value={deal.percent}
                    onChange={(e) => setDeal({ ...deal, percent: e.target.value })}
                    aria-invalid={dealErrors.percent ? true : undefined}
                  />
                </FormField>
              ) : (
                <FormField id="entry-deal-rate" label="Purchase rate" error={dealErrors.rate}>
                  <MoneyInput
                    id="entry-deal-rate"
                    value={deal.rate}
                    onValueChange={(v) => setDeal({ ...deal, rate: v })}
                    aria-invalid={dealErrors.rate ? true : undefined}
                  />
                </FormField>
              )}
              <FormField id="entry-deal-date" label={commissionCar ? "Agreed on" : "Purchased on"}>
                <DatePicker
                  {...pastDateYears()}
                  id="entry-deal-date"
                  value={deal.purchasedOn || entryDate}
                  onChange={(v) => setDeal({ ...deal, purchasedOn: v })}
                />
              </FormField>
            </div>
          </fieldset>
        )}

        <FormField id="entry-party" label={kind === "income" ? "Received from (optional)" : "Paid to (optional)"} error={errors.party?.message}>
          <Input id="entry-party" maxLength={120} autoComplete="off" {...register("party")} />
        </FormField>
        <FormField id="entry-note" label="Note (optional)" error={errors.note?.message}>
          <Textarea id="entry-note" rows={3} maxLength={1000} {...register("note")} />
        </FormField>
      </div>
      <ConfirmDialog
        open={overpaid !== null}
        onOpenChange={(open) => !open && setOverpaid(null)}
        title="Pay the seller more than they’re owed?"
        description={overpaid?.message ?? ""}
        confirmLabel="Save anyway"
        pendingLabel="Saving…"
        cancelLabel="Check the amount"
        pending={isPending}
        onConfirm={() => overpaid && save({ ...overpaid.body, keepOverpayment: true }, getValues())}
      />
      <ConfirmDialog
        open={forfeit !== null}
        onOpenChange={(open) => !open && setForfeit(null)}
        title="Keep this money?"
        description="It will no longer be owed back to the buyer."
        confirmLabel="Keep it"
        pendingLabel="Saving…"
        cancelLabel="Cancel"
        pending={isPending}
        onConfirm={() => {
          if (!forfeit) return
          save(forfeit.body, forfeit.values)
          setForfeit(null)
        }}
      />
      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-3">
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
