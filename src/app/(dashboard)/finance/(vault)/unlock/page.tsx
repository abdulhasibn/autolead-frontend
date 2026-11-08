import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getVaultStatus } from "@/features/finance/api"
import { UnlockForm } from "@/features/finance/components/vault/unlock-form"
import { resolveVaultStep, vaultStepPath } from "@/features/finance/logic/vault-step"
import { safeNextPath } from "@/features/finance/session"

export const metadata: Metadata = { title: "Unlock finance" }

export default async function FinanceUnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const raw = (await searchParams).next
  const next = safeNextPath(Array.isArray(raw) ? raw[0] : raw)
  const step = resolveVaultStep(await getVaultStatus())
  if (step !== "unlock") redirect(vaultStepPath(step, step === "ready" ? next : undefined))
  return <UnlockForm next={next} />
}
