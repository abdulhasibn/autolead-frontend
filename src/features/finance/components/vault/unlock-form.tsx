"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LockOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { recoverAction, unlockAction } from "../../actions"
import { keyErrorMessage, VAULT_STATE_CODES } from "../../logic/errors"
import type { VaultKeys } from "../../types"
import { KeyDisplay } from "../key-display"
import { KeyInput } from "../key-input"

type Mode = "unlock" | "recover" | "recovered"

export function UnlockForm({ next }: { next: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("unlock")
  const [key, setKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [newKeys, setNewKeys] = useState<VaultKeys | null>(null)
  const [isPending, startTransition] = useTransition()

  function switchMode(to: Mode) {
    setMode(to)
    setKey("")
    setError(null)
    setNewKeys(null)
  }

  function handleFailure(error: { status: number; code: string; message: string }, kind: "finance" | "recovery") {
    if (error.code === "FINANCE_UNLOCK_BLOCKED") {
      setBlocked(error.message)
      return
    }
    if (VAULT_STATE_CODES.has(error.code)) {
      router.refresh()
      return
    }
    setError(keyErrorMessage(error, kind))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    // Take the key out of the field before anything else happens.
    const typed = key
    setKey("")
    setError(null)
    startTransition(async () => {
      if (mode === "unlock") {
        const result = await unlockAction({ financeKey: typed })
        if (!result.ok) return handleFailure(result.error, "finance")
        router.replace(next)
        router.refresh()
      } else {
        const result = await recoverAction({ recoveryKey: typed })
        if (!result.ok) return handleFailure(result.error, "recovery")
        setNewKeys(result.data)
        setMode("recovered")
      }
    })
  }

  if (mode === "recovered" && newKeys) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Your new keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The old finance key and the recovery key you just used no longer work. All finance sessions were ended.
          </p>
        </div>
        <KeyDisplay
          keys={[
            { label: "New finance key", value: newKeys.financeKey, hint: "Use this to unlock finance." },
            { label: "New recovery key", value: newKeys.recoveryKey, hint: "Use this only if you lose the finance key." },
          ]}
        />
        <Button onClick={() => switchMode("unlock")}>I’ve saved both — unlock now</Button>
      </div>
    )
  }

  const isRecover = mode === "recover"
  return (
    <form onSubmit={submit} className="space-y-5" autoComplete="off">
      <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
        <LockOpen className="size-5" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {isRecover ? "Recover finance" : "Unlock finance"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRecover
            ? "Enter your recovery key. You’ll get a new finance key and a new recovery key."
            : "Enter your finance key. Case, spaces and dashes don’t matter."}
        </p>
      </div>
      {blocked && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {blocked}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="vault-key">{isRecover ? "Recovery key" : "Finance key"}</Label>
        <KeyInput
          id="vault-key"
          value={key}
          disabled={Boolean(blocked) || isPending}
          onChange={(e) => {
            setKey(e.target.value)
            setError(null)
          }}
          placeholder={isRecover ? "RK-XXXX-XXXX-…" : "FK-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "vault-key-error" : undefined}
        />
        {error && (
          <p id="vault-key-error" role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={Boolean(blocked) || isPending || key.trim() === ""}>
          {isPending && <Loader2 className="animate-spin" />}
          {isRecover ? "Recover" : "Unlock"}
        </Button>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => switchMode(isRecover ? "unlock" : "recover")}
        >
          {isRecover ? "Back to unlock" : "Lost your key? Recover"}
        </button>
      </div>
    </form>
  )
}
