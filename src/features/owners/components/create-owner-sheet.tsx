"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import { createOwnerSchema, type CreateOwnerInput } from "../schemas"
import { OwnerFormFields } from "./owner-form-fields"

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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOwnerInput>({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(data: CreateOwnerInput) {
    startTransition(async () => {
      const result = await createOwnerAction(data)
      if (!result.ok) {
        handleError(result.error)
        return
      }
      toast.success("Owner created")
      setOpen(false)
      reset(DEFAULT_VALUES)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" />
        Add owner
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="px-6 py-5">
          <SheetTitle>Add owner</SheetTitle>
          <SheetDescription>
            Create a new owner record. Phone must be in E.164 format (e.g.
            +971501234567).
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 px-6 pb-6"
        >
          <OwnerFormFields register={register} control={control} errors={errors} />

          <div className="mt-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
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
