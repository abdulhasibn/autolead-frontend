"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { FormField } from "@/features/leads/components/form-field"
import { requestPasswordResetAction, resetPasswordAction } from "@/features/auth/password-actions"
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordFormInput,
} from "@/features/auth/schemas"

function resetErrorMessage(code: string, message: string): string {
  switch (code) {
    case "INVALID_RESET_CODE":
      return "That code is wrong or has expired. Codes last 15 minutes and work once; request a new one."
    case "WEAK_PASSWORD":
      return "That password is too easy to guess. Try a longer one."
    case "RATE_LIMITED":
      return "Too many attempts. Wait a minute and try again."
    case "VALIDATION_ERROR":
      return message
    default:
      return "Something went wrong. Please try again."
  }
}

/**
 * Forgot password in two steps (#22): an email gets a 6-digit code, then the
 * code and a new password set it. The first step never says whether the
 * account exists.
 */
export function ForgotPasswordFlow() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const requestForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })
  const resetForm = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", code: "", newPassword: "", confirmPassword: "" },
  })

  function sendCode(data: ForgotPasswordInput, again = false) {
    setError(null)
    startTransition(async () => {
      const result = await requestPasswordResetAction(data)
      if (!result.ok) {
        setError(
          result.error.code === "RATE_LIMITED"
            ? "A code was sent less than a minute ago. Wait a minute before asking again."
            : "Couldn’t send the code. Please try again."
        )
        return
      }
      setEmail(data.email)
      setResent(again)
      resetForm.setValue("email", data.email)
    })
  }

  function setPassword(data: ResetPasswordFormInput) {
    setError(null)
    startTransition(async () => {
      const result = await resetPasswordAction(data)
      if (!result.ok) {
        setError(resetErrorMessage(result.error.code, result.error.message))
        return
      }
      router.push("/login?reset=1")
    })
  }

  return (
    <>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>

      <div className="mb-6">
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
          {email ? "Enter the code" : "Forgot your password?"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              If <span className="font-medium text-foreground">{email}</span> has an account, we’ve
              emailed it a 6-digit code. It works for 15 minutes.
            </>
          ) : (
            "Enter your sign-in email and we’ll send you a code to set a new password."
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-[4px] border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          {error}
        </p>
      )}
      {resent && !error && (
        <p role="status" className="mb-5 rounded-[4px] border border-primary/20 bg-accent p-3.5 text-xs text-primary">
          A new code is on its way. Earlier codes no longer work.
        </p>
      )}

      {email === null ? (
        <form
          noValidate
          onSubmit={requestForm.handleSubmit((d) => sendCode(d))}
          className="space-y-4"
        >
          <FormField id="reset-email" label="Email address" error={requestForm.formState.errors.email?.message}>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              autoFocus
              aria-invalid={!!requestForm.formState.errors.email}
              {...requestForm.register("email")}
            />
          </FormField>
          <Button type="submit" disabled={isPending} className="h-10 w-full">
            {isPending && <Spinner />}
            Send code
          </Button>
        </form>
      ) : (
        <form noValidate onSubmit={resetForm.handleSubmit(setPassword)} className="space-y-4">
          <FormField id="reset-code" label="6-digit code" error={resetForm.formState.errors.code?.message}>
            <Input
              id="reset-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              aria-invalid={!!resetForm.formState.errors.code}
              {...resetForm.register("code")}
            />
          </FormField>
          <FormField id="reset-new" label="New password" error={resetForm.formState.errors.newPassword?.message}>
            <Input
              id="reset-new"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!resetForm.formState.errors.newPassword}
              {...resetForm.register("newPassword")}
            />
          </FormField>
          <FormField id="reset-confirm" label="Repeat new password" error={resetForm.formState.errors.confirmPassword?.message}>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!resetForm.formState.errors.confirmPassword}
              {...resetForm.register("confirmPassword")}
            />
          </FormField>
          <Button type="submit" disabled={isPending} className="h-10 w-full">
            {isPending && <Spinner />}
            Set new password
          </Button>
          <div className="flex justify-between text-xs">
            <button
              type="button"
              className="font-medium text-primary hover:underline disabled:opacity-50"
              disabled={isPending}
              onClick={() => sendCode({ email }, true)}
            >
              Send a new code
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              disabled={isPending}
              onClick={() => {
                setEmail(null)
                setError(null)
                setResent(false)
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </>
  )
}
