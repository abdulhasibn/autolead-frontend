"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserPlus } from "lucide-react"
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
import { createUserAction } from "../actions"
import { createUserSchema, type CreateUserFormInput, type CreateUserInput } from "../schemas"
import { StaffFormFields } from "./staff-form-fields"

const EMPTY: CreateUserFormInput = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  showroomId: null,
  roles: ["salesperson"],
}

/** Adds a staff account. They sign in with this email and password. */
export function CreateStaffSheet({ showrooms }: { showrooms: { id: string; name: string }[] }) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const { isPending, run, refresh } = useSaveTransition()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormInput, unknown, CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: EMPTY,
    mode: "onTouched",
  })

  function submit(data: CreateUserInput) {
    run(async () => {
      const result = await createUserAction(data)
      if (!result.ok) {
        handleError(result.error, "Could not add the staff member.")
        return
      }
      toast.success(`${data.fullName} can now sign in.`)
      refresh(() => {
        setOpen(false)
        reset(EMPTY)
      })
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (isPending) return
        if (!next) reset(EMPTY)
        setOpen(next)
      }}
    >
      <SheetTrigger render={<Button />}>
        <UserPlus />
        Add staff
      </SheetTrigger>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border/50 px-4 py-4 sm:px-5">
          <SheetTitle className="text-lg font-semibold">Add staff</SheetTitle>
          <SheetDescription className="text-xs">
            They sign in with this email and password. Share the password with them directly.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-staff-form"
          noValidate
          onSubmit={handleSubmit(submit)}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
        >
          <StaffFormFields
            register={register}
            control={control}
            errors={errors}
            showrooms={showrooms}
            withPassword
          />
        </form>
        <div className="flex justify-end gap-2 border-t border-border/50 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="create-staff-form" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Add staff
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
