"use client"

import { useState } from "react"
import { AlertTriangle, Check, Copy, Download, Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export interface ShownKey {
  label: string
  value: string
  hint?: string
}

/**
 * Shows freshly issued keys once. Nothing here is stored: Copy writes to the
 * clipboard, Download builds a text file in memory, Print opens a throwaway
 * window. The parent drops the keys from state when the admin moves on.
 */
export function KeyDisplay({ keys, title = "AutoLead finance keys" }: { keys: ShownKey[]; title?: string }) {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(key: ShownKey) {
    try {
      await navigator.clipboard.writeText(key.value)
      setCopied(key.label)
      toast.success(`${key.label} copied.`)
      setTimeout(() => setCopied((c) => (c === key.label ? null : c)), 2000)
    } catch {
      toast.error("Couldn’t copy. Select the key and copy it by hand.")
    }
  }

  function text() {
    return [
      title,
      `Issued ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      "",
      ...keys.flatMap((k) => [`${k.label}: ${k.value}`, ...(k.hint ? [`  ${k.hint}`] : []), ""]),
      "Keep this somewhere safe and offline. If both keys are lost, the finance data cannot be recovered.",
    ].join("\n")
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text()], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "autolead-finance-keys.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  function print() {
    const w = window.open("", "_blank", "width=640,height=480")
    if (!w) {
      toast.error("Allow pop-ups to print, or use Download instead.")
      return
    }
    const pre = w.document.createElement("pre")
    pre.style.font = "14px/1.6 ui-monospace, monospace"
    pre.style.whiteSpace = "pre-wrap"
    pre.textContent = text()
    w.document.title = title
    w.document.body.appendChild(pre)
    w.focus()
    w.print()
    w.close()
  }

  return (
    <div className="space-y-4">
      <div role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p>
          <span className="font-semibold">This is the only time these keys are shown.</span> Save them now. If you lose
          both the finance key and the recovery key, the finance data is gone for good — nobody, including AutoLead, can
          open it.
        </p>
      </div>
      <ul className="space-y-3">
        {keys.map((key) => (
          <li key={key.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">{key.label}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => copy(key)}>
                {copied === key.label ? <Check /> : <Copy />}
                {copied === key.label ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-1 font-mono-data text-sm break-all text-foreground select-all sm:text-base">{key.value}</p>
            {key.hint && <p className="mt-1 text-xs text-muted-foreground">{key.hint}</p>}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={download}>
          <Download /> Download
        </Button>
        <Button type="button" variant="outline" onClick={print}>
          <Printer /> Print
        </Button>
      </div>
    </div>
  )
}
