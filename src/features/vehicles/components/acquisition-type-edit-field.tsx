"use client"

import { Input } from "@/components/ui/input"
import { OptionSelect } from "@/components/option-select"
import { FormField } from "@/features/leads/components/form-field"
import { ACQUISITION_TYPES, ACQUISITION_TYPE_LABELS } from "../constants"
import type { AcquisitionType } from "../types"

interface Props {
  /** Current form value; prefilled with the saved type. */
  value: AcquisitionType | ""
  onValueChange: (value: string) => void
  /** The type saved on the car, to warn when it changes. */
  savedType: AcquisitionType
  /** Only admins may change it (the API returns 403 for anyone else). */
  canChange: boolean
}

const OPTIONS = ACQUISITION_TYPES.map((value) => ({ value, label: ACQUISITION_TYPE_LABELS[value] }))

/**
 * "How was it acquired?" in the edit form. Admins get the select; everyone else
 * sees the saved type read-only. The form keeps the prefilled value either way,
 * so a salesperson's save resends it unchanged.
 */
export function AcquisitionTypeEditField({ value, onValueChange, savedType, canChange }: Props) {
  if (!canChange) {
    return (
      <FormField id="acquisitionType" label="How was it acquired?">
        <Input
          id="acquisitionType"
          readOnly
          value={ACQUISITION_TYPE_LABELS[savedType]}
          aria-describedby="acquisitionType-note"
        />
        <p id="acquisitionType-note" className="mt-1.5 text-xs text-muted-foreground">
          Only an admin can change this.
        </p>
      </FormField>
    )
  }

  return (
    <FormField id="acquisitionType" label="How was it acquired?">
      <OptionSelect id="acquisitionType" value={value} onValueChange={onValueChange} options={OPTIONS} />
      {value && value !== savedType && (
        <p className="mt-1.5 text-xs text-warning">
          Changing this means entering the purchase rate or commission again on the car’s Finance tab.
        </p>
      )}
    </FormField>
  )
}
