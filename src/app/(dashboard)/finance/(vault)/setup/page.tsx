import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getVaultStatus } from "@/features/finance/api"
import { SetupFlow } from "@/features/finance/components/vault/setup-flow"
import { resolveVaultStep, vaultStepPath } from "@/features/finance/logic/vault-step"

export const metadata: Metadata = { title: "Set up finance" }

export default async function FinanceSetupPage() {
  const step = resolveVaultStep(await getVaultStatus())
  if (step !== "setup" && step !== "confirm") redirect(vaultStepPath(step))
  return <SetupFlow initialStep={step === "setup" ? "intro" : "confirm"} />
}
