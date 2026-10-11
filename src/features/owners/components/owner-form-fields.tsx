import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { Controller, type Control } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/features/leads/components/form-field"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import type { CreateOwnerInput } from "../schemas"

const CONTACT_OPTIONS = [
  { value: "", label: "None" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
] as const

interface OwnerFormFieldsProps {
  register: UseFormRegister<CreateOwnerInput>
  control: Control<CreateOwnerInput>
  errors: FieldErrors<CreateOwnerInput>
}

export function OwnerFormFields({ register, control, errors }: OwnerFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input
          id="fullName"
          placeholder="Jane Smith"
          autoComplete="name"
          {...register("fullName")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="phone" label="Phone (E.164)" error={errors.phone?.message}>
          <Input
            id="phone"
            placeholder="+971501234567"
            type="tel"
            autoComplete="tel"
            {...register("phone")}
          />
        </FormField>

        <FormField id="altPhone" label="Alt phone" error={errors.altPhone?.message}>
          <Input
            id="altPhone"
            placeholder="+971501234568"
            type="tel"
            {...register("altPhone")}
          />
        </FormField>
      </div>

      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          placeholder="jane@example.com"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="city" label="City" error={errors.city?.message}>
          <Input id="city" placeholder="Dubai" {...register("city")} />
        </FormField>

        <FormField id="address" label="Address" error={errors.address?.message}>
          <Input id="address" placeholder="Street, building…" {...register("address")} />
        </FormField>
      </div>

      <FormField
        id="preferredContactMethod"
        label="Preferred contact"
        error={errors.preferredContactMethod?.message}
      >
        <Controller
          name="preferredContactMethod"
          control={control}
          render={({ field }) => (
            <SegmentedChoice
              id="preferredContactMethod"
              options={CONTACT_OPTIONS}
              value={field.value ?? ""}
              onValueChange={(v) => field.onChange(v === "" ? null : v)}
            />
          )}
        />
      </FormField>

      <FormField id="idInfo" label="ID / Emirates ID" error={errors.idInfo?.message}>
        <Input id="idInfo" placeholder="784-XXXX-XXXXXXX-X" {...register("idInfo")} />
      </FormField>

      <FormField id="notes" label="Notes" error={errors.notes?.message}>
        <Textarea
          id="notes"
          placeholder="Any relevant notes…"
          rows={3}
          {...register("notes")}
        />
      </FormField>
    </div>
  )
}
