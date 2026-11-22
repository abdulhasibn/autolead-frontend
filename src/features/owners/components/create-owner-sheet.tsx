"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useApiError } from "@/hooks/use-api-error"
import { createOwnerAction } from "../actions"
import { showOwnerPhoneConflict } from "../conflicts"
import { createOwnerSchema, type CreateOwnerInput } from "../schemas"
import { OwnerFormFields } from "./owner-form-fields"
import { useSaveTransition } from "@/hooks/use-save-transition"
import { DraftBanner } from "@/components/draft-banner"
import { useDraftKey, useFormDraft } from "@/hooks/use-form-draft"

const DEFAULT_VALUES: CreateOwnerInput = {
  fullName: "",
  phone: "",
  email: null,
  address: null,
  city: null,
  preferredContactMethod: null,
  altPhone: null,
  idInfo: null,
  notes: null,
}

export function CreateOwnerSheet() {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  const form = useForm<CreateOwnerInput>({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const {
    register,
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = form
  const draft = useFormDraft(form, { key: useDraftKey("owner:create"), open })

  // Closing with Esc or a tap outside keeps what was typed as a draft (it comes
  // back on reopen), but never the errors. Cancel throws the draft away.
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) clearErrors()
  }

  function cancel() {
    draft.discard()
    handleOpenChange(false)
  }

  function onSubmit(data: CreateOwnerInput) {
    startTransition(async () => {
      const result = await createOwnerAction(data)
      if (!result.ok) {
        if (!showOwnerPhoneConflict(result.error, setError)) handleError(result.error)
        return
      }
      draft.clear()
      toast.success("Owner created")
      refresh(() => {
        setOpen(false)
        reset(DEFAULT_VALUES)
      })
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" />
        Add owner
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto overscroll-contain sm:max-w-md">
        <SheetHeader className="px-4 py-5 sm:px-6">
          <SheetTitle>Add owner</SheetTitle>
          <SheetDescription>
            Create a new owner record. A 10-digit mobile number is enough.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 px-4 sm:px-6"
        >
          <DraftBanner draft={draft} />
          <OwnerFormFields register={register} control={control} errors={errors} />

          <div className="sticky bottom-0 -mx-4 mt-auto flex gap-2 border-t border-border/50 bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 sm:pb-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={cancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : "Create owner"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
