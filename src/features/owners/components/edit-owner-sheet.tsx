"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil } from "lucide-react"
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
import { updateOwnerAction } from "../actions"
import { createOwnerSchema, type CreateOwnerInput } from "../schemas"
import type { OwnerDto } from "../types"
import { OwnerFormFields } from "./owner-form-fields"

function toFormValues(owner: OwnerDto): CreateOwnerInput {
  return {
    fullName: owner.fullName,
    phone: owner.phone,
    email: owner.email,
    address: owner.address,
    city: owner.city,
    preferredContactMethod: owner.preferredContactMethod,
    altPhone: owner.altPhone,
    idInfo: owner.idInfo,
    notes: owner.notes,
  }
}

export function EditOwnerSheet({ owner }: { owner: OwnerDto }) {
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
    defaultValues: toFormValues(owner),
  })

  useEffect(() => {
    if (open) reset(toFormValues(owner))
  }, [open, owner, reset])

  function onSubmit(data: CreateOwnerInput) {
    startTransition(async () => {
      const result = await updateOwnerAction(owner.id, data)
      if (!result.ok) {
        handleError(result.error)
        return
      }
      toast.success("Owner updated")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Pencil className="size-4" />
        Edit
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="px-6 py-5">
          <SheetTitle>Edit owner</SheetTitle>
          <SheetDescription>Update {owner.fullName}&apos;s profile.</SheetDescription>
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
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
