import { requireFinanceAdmin } from "../admin"

export default async function FinanceVaultLayout({ children }: { children: React.ReactNode }) {
  await requireFinanceAdmin()
  return (
    <div className="mx-auto w-full max-w-xl py-2 sm:py-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">{children}</div>
    </div>
  )
}
