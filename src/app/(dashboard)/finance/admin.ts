import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

/** Finance is admin-only: everyone else is sent away and never sees the nav item. */
export async function requireFinanceAdmin() {
  const session = await auth()
  if (!session?.user?.roles?.includes("admin")) redirect("/leads")
  return session
}
