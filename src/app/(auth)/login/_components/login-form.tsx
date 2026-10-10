"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { loginSchema, type LoginInput } from "@/features/auth/schemas"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const sessionExpired = searchParams.get("error") === "SessionExpired"

  const [isPending, setIsPending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(
    sessionExpired ? "Your session expired. Please sign in again." : null
  )
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setIsPending(true)
    setAuthError(null)
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setAuthError("Invalid email or password. Please try again.")
        return
      }

      router.push(callbackUrl)
    } catch {
      setAuthError("Something went wrong. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#111827] mb-1">Welcome back</h2>
        <p className="text-sm text-[#6B7280]">Sign in to your Wheels Experts account</p>
      </div>

      {/* Auth error banner */}
      {authError && (
        <div className="mb-5 p-3.5 rounded-[4px] bg-[#FEF2F2] border border-[#DC2626]/20 flex items-start gap-2.5 text-xs text-[#DC2626]">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="leading-snug">
            <span className="font-semibold block">Authentication error</span>
            <span>{authError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#374151] mb-1.5">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              autoComplete="email"
              className={[
                "w-full h-10 pl-9 pr-3 text-sm bg-white rounded-[4px] text-[#111827] placeholder-[#9CA3AF]",
                "border outline-none transition-all",
                "focus:border-[#0D9488] focus:ring-2 focus:ring-[#CCFBF1]",
                errors.email ? "border-[#DC2626]" : "border-[#D1D5DB]",
              ].join(" ")}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[11px] text-[#DC2626] font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-[#374151]">
              Password
            </label>
            <a
              href="#"
              className="text-xs font-medium text-[#0D9488] hover:text-[#0F766E] hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#0D9488]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={[
                "w-full h-10 pl-9 pr-10 text-sm bg-white rounded-[4px] text-[#111827] placeholder-[#9CA3AF]",
                "border outline-none transition-all",
                "focus:border-[#0D9488] focus:ring-2 focus:ring-[#CCFBF1]",
                errors.password ? "border-[#DC2626]" : "border-[#D1D5DB]",
              ].join(" ")}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#111827] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1 text-[11px] text-[#DC2626] font-medium">{errors.password.message}</p>
          ) : (
            <p className="mt-1 text-[11px] text-[#6B7280]">Must be at least 8 characters</p>
          )}
        </div>

        {/* Keep me signed in */}
        <div className="flex items-center pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox defaultChecked />
            <span className="text-xs text-secondary-foreground">Keep me signed in</span>
          </label>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 w-full rounded-[4px] text-sm font-semibold shadow-sm hover:bg-[#0F766E]"
          >
            {isPending ? (
              <>
                <Spinner />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Help notice */}
      <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
        <div className="flex items-start gap-2 text-xs text-[#6B7280] leading-relaxed">
          <svg className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Don&apos;t have an account? Ask your showroom manager or{" "}
            <a href="mailto:support@autolead.in" className="text-[#0D9488] font-medium hover:underline">
              contact our support team
            </a>.
          </span>
        </div>
      </div>
    </>
  )
}
