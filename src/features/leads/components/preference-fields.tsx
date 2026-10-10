"use client"

import { useEffect, useState } from "react"
import type { FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import type { MakeReadModel, ModelReadModel, VariantReadModel } from "@/features/catalog/types"
import { getModelsAction, getVariantsAction } from "@/features/vehicles/actions"
import {
  FUEL_TYPE_LABELS,
  FUEL_TYPES,
  TRANSMISSION_LABELS,
  TRANSMISSIONS,
} from "@/features/vehicles/constants"
import { useApiError } from "@/hooks/use-api-error"
import { BODY_TYPE_LABELS, BODY_TYPES, PREFERRED_YEAR_MAX, PREFERRED_YEAR_MIN } from "../constants"
import { EMPTY_PREFERENCE_FORM } from "../preference"
import type { LeadPreferenceFormInput } from "../schemas"
import { ChipMultiSelect } from "./chip-multi-select"
import { ColourTagsInput } from "./colour-tags-input"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"

const FUEL_OPTIONS = FUEL_TYPES.map((v) => ({ value: v, label: FUEL_TYPE_LABELS[v] }))
const TRANSMISSION_OPTIONS = TRANSMISSIONS.map((v) => ({ value: v, label: TRANSMISSION_LABELS[v] }))
const BODY_TYPE_OPTIONS = BODY_TYPES.map((v) => ({ value: v, label: BODY_TYPE_LABELS[v] }))

export type PreferenceFieldName = keyof LeadPreferenceFormInput

export type PreferenceFieldErrors = Partial<Record<PreferenceFieldName, string | undefined>>

interface PreferenceFieldsProps {
  /** As returned by `useWatch`, so any key may still be undefined. */
  values: Partial<LeadPreferenceFormInput>
  onChange: <K extends PreferenceFieldName>(name: K, value: LeadPreferenceFormInput[K]) => void
  errors: PreferenceFieldErrors
  makes: MakeReadModel[]
  /** Stored names, shown while the model/variant lists are still loading. */
  selectedNames?: { model?: string | null; variant?: string | null }
  /** Prefixes element ids so two forms on one page don't collide. */
  idPrefix?: string
}

/** The loaded list, or just the stored pick while the list is loading. */
function withPending(
  items: { id: string; name: string }[],
  id: string,
  name: string | null | undefined
): { value: string; label: string }[] {
  const list = items.length === 0 && id && name ? [{ id, name }] : items
  return list.map((item) => ({ value: item.id, label: item.name }))
}

/**
 * The buyer preference controls, shared by the new-lead and edit-preference
 * forms. Every control is optional; leaving one empty means "any".
 */
export function PreferenceFields({
  values: watched,
  onChange,
  errors,
  makes,
  selectedNames,
  idPrefix = "pref",
}: PreferenceFieldsProps) {
  const values = { ...EMPTY_PREFERENCE_FORM, ...watched }
  const { handleError } = useApiError()
  const [models, setModels] = useState<ModelReadModel[]>([])
  const [variants, setVariants] = useState<VariantReadModel[]>([])
  const [initial] = useState(() => ({
    makeId: values.preferredMakeId,
    modelId: values.preferredModelId,
  }))
  const [loadingCatalog, setLoadingCatalog] = useState(Boolean(initial.makeId))
  const id = (name: string) => `${idPrefix}-${name}`

  // An existing preference arrives with its parents filled in; load the
  // lists that pick needs so the selects can show it.
  useEffect(() => {
    if (!initial.makeId) return
    let cancelled = false
    Promise.all([
      getModelsAction(initial.makeId),
      initial.modelId ? getVariantsAction(initial.modelId) : null,
    ]).then(([modelsResult, variantsResult]) => {
      if (cancelled) return
      setLoadingCatalog(false)
      if (modelsResult.ok) setModels(modelsResult.data)
      if (variantsResult?.ok) setVariants(variantsResult.data)
    })
    return () => {
      cancelled = true
    }
  }, [initial])

  async function chooseMake(makeId: string) {
    onChange("preferredMakeId", makeId)
    onChange("preferredModelId", "")
    onChange("preferredVariantId", "")
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
    onChange("preferredModelId", modelId)
    onChange("preferredVariantId", "")
    setVariants([])
    if (!modelId) return
    setLoadingCatalog(true)
    const result = await getVariantsAction(modelId)
    setLoadingCatalog(false)
    if (result.ok) setVariants(result.data)
    else handleError(result.error, "Could not load variants.")
  }

  const makeId = values.preferredMakeId
  const modelId = values.preferredModelId

  return (
    <div className="space-y-5">
      <PreferenceGroup title="Car">
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField id={id("make")} label="Make">
            <OptionSelect
              id={id("make")}
              value={makeId}
              onValueChange={chooseMake}
              options={[{ value: "", label: "Any make" }, ...makes.map((m) => ({ value: m.id, label: m.name }))]}
              placeholder="Any make"
            />
          </FormField>
          <FormField id={id("model")} label="Model">
            <OptionSelect
              id={id("model")}
              value={modelId}
              onValueChange={chooseModel}
              options={[{ value: "", label: "Any model" }, ...withPending(models, modelId, loadingCatalog ? selectedNames?.model : null)]}
              placeholder={makeId ? "Any model" : "Pick a make first"}
              disabled={!makeId || loadingCatalog}
            />
          </FormField>
          <FormField id={id("variant")} label="Variant">
            <OptionSelect
              id={id("variant")}
              value={values.preferredVariantId}
              onValueChange={(v) => onChange("preferredVariantId", v)}
              options={[{ value: "", label: "Any variant" }, ...withPending(variants, values.preferredVariantId, loadingCatalog ? selectedNames?.variant : null)]}
              placeholder={modelId ? "Any variant" : "Pick a model first"}
              disabled={!modelId || loadingCatalog}
            />
          </FormField>
        </div>
      </PreferenceGroup>

      <PreferenceGroup title="Type">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id={id("fuel")} label="Fuel">
            <ChipMultiSelect
              id={id("fuel")}
              aria-label="Preferred fuel types"
              value={values.preferredFuelTypes}
              onValueChange={(v) => onChange("preferredFuelTypes", v)}
              options={FUEL_OPTIONS}
            />
          </FormField>
          <FormField id={id("transmission")} label="Transmission">
            <ChipMultiSelect
              id={id("transmission")}
              aria-label="Preferred transmissions"
              value={values.preferredTransmissions}
              onValueChange={(v) => onChange("preferredTransmissions", v)}
              options={TRANSMISSION_OPTIONS}
            />
          </FormField>
        </div>
        <FormField id={id("body")} label="Body type">
          <ChipMultiSelect
            id={id("body")}
            aria-label="Preferred body types"
            value={values.preferredBodyTypes}
            onValueChange={(v) => onChange("preferredBodyTypes", v)}
            options={BODY_TYPE_OPTIONS}
          />
        </FormField>
      </PreferenceGroup>

      <PreferenceGroup title="Limits">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField
            id={id("year-min")}
            label="Year from"
            value={values.preferredYearMin}
            onChange={(v) => onChange("preferredYearMin", v)}
            error={errors.preferredYearMin}
            min={PREFERRED_YEAR_MIN}
            max={PREFERRED_YEAR_MAX}
          />
          <NumberField
            id={id("year-max")}
            label="Year to"
            value={values.preferredYearMax}
            onChange={(v) => onChange("preferredYearMax", v)}
            error={errors.preferredYearMax}
            min={PREFERRED_YEAR_MIN}
            max={PREFERRED_YEAR_MAX}
          />
          <NumberField
            id={id("km-max")}
            label="Max km"
            value={values.preferredKmMax}
            onChange={(v) => onChange("preferredKmMax", v)}
            error={errors.preferredKmMax}
            step={5000}
          />
          <NumberField
            id={id("max-owners")}
            label="Max owners"
            value={values.preferredMaxOwners}
            onChange={(v) => onChange("preferredMaxOwners", v)}
            error={errors.preferredMaxOwners}
            hint="0 = first owner"
          />
        </div>
      </PreferenceGroup>

      <PreferenceGroup title="Colours">
        <ColourTagsInput
          id={id("colours")}
          value={values.preferredColours}
          onValueChange={(v) => onChange("preferredColours", v)}
          invalid={!!errors.preferredColours}
        />
        {errors.preferredColours && (
          <p className="text-destructive text-xs">{errors.preferredColours}</p>
        )}
      </PreferenceGroup>
    </div>
  )
}

function PreferenceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-[11px] font-medium tracking-wide text-[#9CA3AF] uppercase">{title}</h4>
      {children}
    </section>
  )
}

function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  ...props
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <FormField id={id} label={label} error={error}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="Any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] text-[#9CA3AF]">
          {hint}
        </p>
      )}
    </FormField>
  )
}

const ERROR_FIELDS: PreferenceFieldName[] = [
  "preferredColours",
  "preferredYearMin",
  "preferredYearMax",
  "preferredKmMax",
  "preferredMaxOwners",
]

/** Flattens react-hook-form errors to the messages PreferenceFields shows. */
export function preferenceErrors(
  errors: FieldErrors<LeadPreferenceFormInput>
): PreferenceFieldErrors {
  return Object.fromEntries(
    ERROR_FIELDS.map((name) => [name, errors[name]?.message as string | undefined])
  )
}
