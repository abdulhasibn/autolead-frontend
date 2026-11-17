"use client"

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form"
import { OptionSelect } from "@/components/option-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { FormField } from "@/features/leads/components/form-field"
import { ROLE_HINTS, ROLE_LABELS } from "../constants"
import { STAFF_ROLES } from "../schemas"

const NO_SHOWROOM = "none"

type StaffFields = {
  fullName: string
  phone: string
  email: string
  showroomId: string | null
  roles: ("admin" | "salesperson")[]
  password?: string
}

/** Name, phone, email, home showroom and roles; `withPassword` adds the first password. */
export function StaffFormFields<T extends StaffFields>({
  register,
  control,
  errors,
  showrooms,
  withPassword = false,
}: {
  register: UseFormRegister<T>
  control: Control<T>
  errors: FieldErrors<StaffFields>
  showrooms: { id: string; name: string }[]
  withPassword?: boolean
}) {
  // RHF can't narrow a generic form's field names; the shape is fixed above.
  const reg = register as unknown as UseFormRegister<StaffFields>
  const ctl = control as unknown as Control<StaffFields>
  return (
    <div className="space-y-4">
      <FormField id="staff-fullName" label="Full name *" error={errors.fullName?.message}>
        <Input id="staff-fullName" autoComplete="off" aria-invalid={!!errors.fullName} {...reg("fullName")} />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="staff-phone" label="Phone *" error={errors.phone?.message}>
          <Input id="staff-phone" type="tel" autoComplete="off" maxLength={16} placeholder="9876543210" aria-invalid={!!errors.phone} {...reg("phone")} />
        </FormField>
        <FormField id="staff-email" label="Email (sign-in) *" error={errors.email?.message}>
          <Input id="staff-email" type="email" autoComplete="off" aria-invalid={!!errors.email} {...reg("email")} />
        </FormField>
      </div>
      {withPassword && (
        <FormField id="staff-password" label="First password *" error={errors.password?.message}>
          <Input id="staff-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...reg("password")} />
        </FormField>
      )}
      <FormField id="staff-showroom" label="Home showroom">
        <Controller
          control={ctl}
          name="showroomId"
          render={({ field }) => (
            <OptionSelect
              id="staff-showroom"
              // A real value for "None": the select can't pick an empty one.
              value={field.value ?? NO_SHOWROOM}
              onValueChange={(v) => field.onChange(v === NO_SHOWROOM ? null : v)}
              options={[
                { value: NO_SHOWROOM, label: "None" },
                ...showrooms.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          )}
        />
      </FormField>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Roles *</legend>
        <Controller
          control={ctl}
          name="roles"
          render={({ field }) => (
            <div className="space-y-2">
              {STAFF_ROLES.map((role) => {
                const checked = field.value.includes(role)
                return (
                  <label
                    key={role}
                    htmlFor={`staff-role-${role}`}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-data-checked:border-primary/40 has-data-checked:bg-accent"
                  >
                    <Checkbox
                      id={`staff-role-${role}`}
                      checked={checked}
                      onCheckedChange={(next) =>
                        field.onChange(
                          next ? [...field.value, role] : field.value.filter((r) => r !== role)
                        )
                      }
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">{ROLE_LABELS[role]}</span>
                      <span className="block text-xs text-muted-foreground">{ROLE_HINTS[role]}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        />
        {errors.roles?.message && <p className="text-xs text-destructive">{errors.roles.message}</p>}
      </fieldset>
    </div>
  )
}
