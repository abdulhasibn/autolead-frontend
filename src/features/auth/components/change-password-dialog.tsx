"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FormField } from "@/features/leads/components/form-field"
import { changePasswordAction } from "../password-actions"
import { changePasswordSchema, type ChangePasswordFormInput } from "../schemas"

const EMPTY: ChangePasswordFormInput = { currentPassword: "", newPassword: "", confirmPassword: "" }

/** Signed-in password change (#22). This device stays signed in; others are signed out. */
export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  })

  function close(next: boolean) {
    if (isPending) return
    if (!next) reset(EMPTY)
    onOpenChange(next)
  }

  function submit(data: ChangePasswordFormInput) {
    startTransition(async () => {
      const result = await changePasswordAction(data)
      if (!result.ok) {
        switch (result.error.code) {
          case "INVALID_CURRENT_PASSWORD":
            setError("currentPassword", { message: "That isn’t your current password" })
            return
          case "PASSWORD_UNCHANGED":
            setError("newPassword", { message: "Pick a password different from the current one" })
            return
          case "WEAK_PASSWORD":
            setError("newPassword", { message: "That password is too easy to guess. Try a longer one." })
            return
          case "RATE_LIMITED":
            toast.error("Too many attempts. Wait a minute and try again.")
            return
          default:
            toast.error(
              result.error.status >= 500 ? "Couldn’t change your password. Please try again." : result.error.message
            )
            return
        }
      }
      toast.success("Password changed. Your other devices were signed out.")
      reset(EMPTY)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            You stay signed in here. Every other phone or browser is signed out.
          </DialogDescription>
        </DialogHeader>
        <form id="change-password-form" noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
          <FormField id="cp-current" label="Current password" error={errors.currentPassword?.message}>
            <Input id="cp-current" type="password" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...register("currentPassword")} />
          </FormField>
          <FormField id="cp-new" label="New password" error={errors.newPassword?.message}>
            <Input id="cp-new" type="password" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...register("newPassword")} />
          </FormField>
          <FormField id="cp-confirm" label="Repeat new password" error={errors.confirmPassword?.message}>
            <Input id="cp-confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" disabled={isPending}>
            {isPending ? "Saving…" : "Change password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
