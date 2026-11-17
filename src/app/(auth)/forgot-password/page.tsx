import type { Metadata } from "next"
import { ForgotPasswordFlow } from "./_components/forgot-password-flow"

export const metadata: Metadata = { title: "Reset Password" }

export default function ForgotPasswordPage() {
  return <ForgotPasswordFlow />
}
