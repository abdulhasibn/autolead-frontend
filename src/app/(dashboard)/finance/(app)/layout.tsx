import { redirect } from "next/navigation"
import { getVaultStatus } from "@/features/finance/api"
import { FinanceNav } from "@/features/finance/components/finance-nav"
import { LockButton } from "@/features/finance/components/vault/lock-button"
import { resolveVaultStep, vaultStepPath } from "@/features/finance/logic/vault-step"
import { requireFinanceAdmin } from "../admin"

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
})

export default async function FinanceAppLayout({ children }: { children: React.ReactNode }) {
  await requireFinanceAdmin()
  const status = await getVaultStatus()
  const step = resolveVaultStep(status)
  if (step !== "ready") redirect(vaultStepPath(step))

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Finance</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Unlocked
            {status.expiresAt && <> · locks at {timeFormatter.format(new Date(status.expiresAt))} if idle</>}
          </p>
        </div>
        <LockButton />
      </div>
      <FinanceNav />
      {children}
    </div>
  )
}
