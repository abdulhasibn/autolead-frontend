"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Pencil } from "lucide-react"
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
import { useSaveTransition } from "@/hooks/use-save-transition"
import { updateUserAction } from "../actions"
import { editUserSchema, type EditUserFormInput, type EditUserInput } from "../schemas"
import type { StaffMemberDto } from "../types"
import { StaffFormFields } from "./staff-form-fields"

function toForm(user: StaffMemberDto): EditUserFormInput {
  return {
    fullName: user.fullName,
    phone: user.phone,
    email: user.email ?? "",
    showroomId: user.showroomId,
    roles: user.roles,
  }
}

/** Edits a staff member's details and roles. */
export function EditStaffSheet({
  user,
  showrooms,
}: {
  user: StaffMemberDto
  showrooms: { id: string; name: string }[]
}) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const { isPending, run, refresh } = useSaveTransition()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormInput, unknown, EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: toForm(user),
    mode: "onTouched",
  })

  function submit(data: EditUserInput) {
    run(async () => {
      const result = await updateUserAction(user.id, data)
      if (!result.ok) {
        handleError(result.error, "Could not save the staff member.")
        refresh()
        return
      }
      toast.success(`${data.fullName} updated.`)
      refresh(() => setOpen(false))
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (isPending) return
        if (next) reset(toForm(user))
        setOpen(next)
      }}
    >
      <SheetTrigger render={<Button variant="outline" size="sm" aria-label={`Edit ${user.fullName}`} />}>
        <Pencil />
        Edit
      </SheetTrigger>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border/50 px-4 py-4 sm:px-5">
          <SheetTitle className="text-lg font-semibold">Edit {user.fullName}</SheetTitle>
          <SheetDescription className="text-xs">
            A new email becomes their sign-in. Role changes apply on their next request.
          </SheetDescription>
        </SheetHeader>
        <form
          id={`edit-staff-${user.id}`}
          noValidate
          onSubmit={handleSubmit(submit)}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
        >
          <StaffFormFields register={register} control={control} errors={errors} showrooms={showrooms} />
        </form>
        <div className="flex justify-end gap-2 border-t border-border/50 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form={`edit-staff-${user.id}`} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
