"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2, RotateCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { confirmVaultAction, setupVaultAction } from "../../actions"
import { keyErrorMessage, VAULT_STATE_CODES } from "../../logic/errors"
import type { VaultKeys } from "../../types"
import { KeyDisplay } from "../key-display"
import { KeyInput } from "../key-input"

type Step = "intro" | "keys" | "confirm"

/**
 * Set up → show both keys once → type the recovery key back → confirmed.
 * `initialStep="confirm"` is a vault set up earlier whose keys are no longer
 * on screen: confirm with the saved recovery key, or start over.
 */
export function SetupFlow({ initialStep }: { initialStep: "intro" | "confirm" }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(initialStep)
  const [keys, setKeys] = useState<VaultKeys | null>(null)
  const [recoveryKey, setRecoveryKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onVaultStateError(code: string) {
    if (VAULT_STATE_CODES.has(code)) {
      setKeys(null)
      router.refresh()
      return true
    }
    return false
  }

  function runSetup() {
    setError(null)
    startTransition(async () => {
      const result = await setupVaultAction()
      if (!result.ok) {
        if (!onVaultStateError(result.error.code)) toast.error(result.error.message)
        return
      }
      setKeys(result.data)
      setRecoveryKey("")
      setStep("keys")
    })
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault()
    const typed = recoveryKey
    setRecoveryKey("")
    setError(null)
    startTransition(async () => {
      const result = await confirmVaultAction({ recoveryKey: typed })
      if (!result.ok) {
        if (!onVaultStateError(result.error.code)) setError(keyErrorMessage(result.error, "recovery"))
        return
      }
      setKeys(null)
      toast.success("Finance is set up. Unlock it with your finance key.")
      router.replace("/finance/unlock")
      router.refresh()
    })
  }

  if (step === "intro") {
    return (
      <div className="space-y-5">
        <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Set up finance</h1>
          <p>Your money records are locked with a key that only you hold. AutoLead never stores it in a form it can read.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              You get a <b className="text-foreground">finance key</b> to unlock finance each time.
            </li>
            <li>
              And a <b className="text-foreground">recovery key</b> in case you lose the finance key.
            </li>
            <li>Both are shown once. Write them down or save them somewhere safe and offline.</li>
            <li>If both are lost, the finance data cannot be opened again by anyone.</li>
          </ul>
        </div>
        <Button onClick={runSetup} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          Create my keys
        </Button>
      </div>
    )
  }

  if (step === "keys" && keys) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Save your keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">Next you’ll type the recovery key back to prove it’s saved.</p>
        </div>
        <KeyDisplay
          keys={[
            { label: "Finance key", value: keys.financeKey, hint: "Use this to unlock finance." },
            { label: "Recovery key", value: keys.recoveryKey, hint: "Use this only if you lose the finance key." },
          ]}
        />
        <Button
          onClick={() => {
            // Leave the keys screen: drop them so they’re never shown again.
            setKeys(null)
            setStep("confirm")
          }}
        >
          I’ve saved both keys
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={confirm} className="space-y-5" autoComplete="off">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Confirm your recovery key</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Type the recovery key you saved. Finance can’t be unlocked until this is done.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="recovery-key">Recovery key</Label>
        <KeyInput
          id="recovery-key"
          value={recoveryKey}
          onChange={(e) => {
            setRecoveryKey(e.target.value)
            setError(null)
          }}
          placeholder="RK-XXXX-XXXX-…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "recovery-key-error" : undefined}
        />
        {error && (
          <p id="recovery-key-error" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending || recoveryKey.trim() === ""}>
          {isPending && <Loader2 className="animate-spin" />}
          Confirm
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={runSetup}>
          <RotateCcw /> Start over with new keys
        </Button>
      </div>
      <p className="text-xs text-subtle-foreground">Starting over replaces both keys; the old ones stop working.</p>
    </form>
  )
}
