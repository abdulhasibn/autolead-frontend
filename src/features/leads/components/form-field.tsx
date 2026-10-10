import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  id: string
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}

/**
 * Label + control + error. Children keep their own widths (`*:w-auto`) and the
 * label keeps its colour on error; only the message turns red.
 */
export function FormField({ id, label, error, className, children }: FormFieldProps) {
  return (
    <Field className={cn("*:w-auto", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {error && <FieldError className="text-xs">{error}</FieldError>}
    </Field>
  )
}
