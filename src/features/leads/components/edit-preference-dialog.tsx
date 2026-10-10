"use client"

import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { MakeReadModel } from "@/features/catalog/types"
import { useApiError } from "@/hooks/use-api-error"
import { updateLeadPreferenceAction } from "../actions"
import { preferenceToFormValues } from "../preference"
import {
  leadPreferenceFormSchema,
  type LeadPreferenceFormInput,
  type LeadPreferenceInput,
} from "../schemas"
import type { LeadPreference } from "../types"
import { PreferenceFields, preferenceErrors } from "./preference-fields"

interface EditPreferenceDialogProps {
  leadId: string
  preference: LeadPreference
  /** Catalog names of the stored pick, shown while the lists load. */
  selectedNames: { model: string | null; variant: string | null }
  makes: MakeReadModel[]
  /** No preference yet: the trigger reads "Add preference". */
  isEmpty: boolean
  disabled?: boolean
}

export function EditPreferenceDialog({
  leadId,
  preference,
  selectedNames,
  makes,
  isEmpty,
  disabled,
}: EditPreferenceDialogProps) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitted },
  } = useForm<LeadPreferenceFormInput, unknown, LeadPreferenceInput>({
    resolver: zodResolver(leadPreferenceFormSchema),
    defaultValues: preferenceToFormValues(preference),
  })

  const values = useWatch({ control })

  function onSubmit(values: LeadPreferenceInput) {
    startTransition(async () => {
      // A full replace: the whole form goes up, including untouched fields.
      const result = await updateLeadPreferenceAction(leadId, values)
      if (!result.ok) {
        handleError(result.error, "Could not save the preference.")
        return
      }
      toast.success("Buyer preference saved.")
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Start from the stored preference every time it opens.
        if (next) reset(preferenceToFormValues(preference))
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="border-[#E5E7EB] bg-white text-[#374151] hover:border-[#CCFBF1] hover:bg-[#F0FDFA] hover:text-[#0D9488]"
          />
        }
      >
        {isEmpty ? <Plus /> : <Pencil />}
        {isEmpty ? "Add preference" : "Edit"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buyer preference</DialogTitle>
          <DialogDescription>
            All optional. Leave a field empty for &ldquo;any&rdquo;. The budget is edited with the
            lead&rsquo;s details.
          </DialogDescription>
        </DialogHeader>
        <form id="edit-preference-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <PreferenceFields
            idPrefix="edit-pref"
            values={values}
            onChange={(name, value) =>
              // RHF can't resolve PathValue for a generic key.
              setValue(name, value as never, { shouldValidate: isSubmitted, shouldDirty: true })
            }
            errors={preferenceErrors(errors)}
            makes={makes}
            selectedNames={selectedNames}
          />
        </form>
        <DialogFooter>
          <Button type="submit" form="edit-preference-form" disabled={isPending}>
            {isPending ? "Saving…" : "Save preference"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
