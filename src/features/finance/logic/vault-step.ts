import type { VaultStatus } from "../types"

export type VaultStep = "setup" | "confirm" | "unlock" | "ready"

/** api.md › "Which screen to show". */
export function resolveVaultStep(status: Pick<VaultStatus, "initialized" | "confirmed" | "unlocked">): VaultStep {
  if (!status.initialized) return "setup"
  if (!status.confirmed) return "confirm"
  if (!status.unlocked) return "unlock"
  return "ready"
}

/** Route for a step; `confirm` shares the setup screen. */
export function vaultStepPath(step: VaultStep, next?: string): string {
  switch (step) {
    case "setup":
    case "confirm":
      return "/finance/setup"
    case "unlock":
      return next ? `/finance/unlock?next=${encodeURIComponent(next)}` : "/finance/unlock"
    case "ready":
      return next ?? "/finance"
  }
}
