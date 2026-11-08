"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { changeKeyAction } from "../../actions"
import { keyErrorMessage } from "../../logic/errors"
import { KeyDisplay } from "../key-display"
import { KeyInput } from "../key-input"

/** New finance key shown once. Other sessions end; this one stays unlocked. */
export function ChangeKeyForm() {
  const [currentKey, setCurrentKey] = useState("")
  const [newKey, setNewKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const typed = currentKey
    setCurrentKey("")
    setError(null)
    startTransition(async () => {
      const result = await changeKeyAction({ currentKey: typed })
      if (!result.ok) {
        if (result.error.code === "FINANCE_UNLOCK_BLOCKED") toast.error(result.error.message)
        else setError(keyErrorMessage(result.error, "finance"))
        return
      }
      setNewKey(result.data.financeKey)
    })
  }

  if (newKey) {
    return (
      <div className="space-y-4">
        <KeyDisplay keys={[{ label: "New finance key", value: newKey, hint: "Your old finance key no longer works. The recovery key is unchanged." }]} />
        <Button onClick={() => setNewKey(null)}>I’ve saved it</Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor="current-key">Current finance key</Label>
        <KeyInput
          id="current-key"
          value={currentKey}
          onChange={(e) => {
            setCurrentKey(e.target.value)
            setError(null)
          }}
          placeholder="FK-XXXX-…"
          aria-invalid={error ? true : undefined}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" variant="outline" disabled={isPending || currentKey.trim() === ""}>
        {isPending && <Loader2 className="animate-spin" />}
        Change key
      </Button>
      <p className="text-xs text-subtle-foreground">Other devices are locked out; this one stays unlocked.</p>
    </form>
  )
}
