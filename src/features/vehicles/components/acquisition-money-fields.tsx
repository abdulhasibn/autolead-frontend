"use client"

import { useState, useTransition } from "react"
import { Loader2, Lock, LockOpen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker, pastDateYears } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { unlockAction } from "@/features/finance/actions"
import { KeyInput } from "@/features/finance/components/key-input"
import { MoneyInput } from "@/features/finance/components/money-input"
import { keyErrorMessage, VAULT_STATE_CODES } from "@/features/finance/logic/errors"
import type { AcquisitionForm, SellerPaid } from "@/features/finance/logic/acquisition"
import { formatMoney, parseMoneyInput } from "@/features/finance/logic/money"
import type { SaleModel } from "@/features/finance/types"
import { FormField } from "@/features/leads/components/form-field"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"

const PAID_OPTIONS: Array<{ value: SellerPaid; label: string }> = [
  { value: "none", label: "Not paid yet" },
  { value: "part", label: "Part paid" },
  { value: "full", label: "Fully paid" },
]

/**
 * Shown to admins while finance is locked: unlock right here so the deal can be
 * recorded without leaving the form. Not a nested <form> — the sheet is one —
 * so Enter is handled by hand. The key only ever lives in component state.
 */
export function AcquisitionMoneyLocked({ onUnlocked }: { onUnlocked: () => void }) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isPending, startTransition] = useTransition()

  function unlock() {
    const typed = key
    if (typed.trim() === "" || isPending) return
    setKey("")
    setError(null)
    startTransition(async () => {
      const result = await unlockAction({ financeKey: typed })
      if (result.ok) {
        toast.success("Finance unlocked.")
        onUnlocked()
        return
      }
      if (result.error.code === "FINANCE_UNLOCK_BLOCKED") setBlocked(result.error.message)
      else if (VAULT_STATE_CODES.has(result.error.code)) setNeedsSetup(true)
      else setError(keyErrorMessage(result.error, "finance"))
    })
  }

  if (needsSetup) {
    return (
      <Note>
        Finance isn’t set up yet, so the price and payments can’t be recorded here.{" "}
        <a href="/finance/setup" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
          Set up finance
        </a>{" "}
        and add them later on the car’s Finance tab.
      </Note>
    )
  }

  if (!open) {
    return (
      <Note>
        <span className="flex-1">Finance is locked. Unlock it to record the price and payments now, or add them later on the car’s Finance tab.</span>
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 font-medium text-primary hover:underline">
          Unlock
        </button>
      </Note>
    )
  }

  return (
    <section aria-label="Unlock finance" className="space-y-2 rounded-lg border border-border/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <LockOpen aria-hidden className="size-3.5 text-primary" />
        Unlock finance to record the deal
      </p>
      {blocked ? (
        <p role="alert" className="text-xs text-destructive">{blocked}</p>
      ) : (
        <>
          <div className="flex gap-2">
            <KeyInput
              id="acq-finance-key"
              aria-label="Finance key"
              autoFocus
              value={key}
              disabled={isPending}
              placeholder="FK-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "acq-finance-key-error" : undefined}
              onChange={(e) => {
                setKey(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  unlock()
                }
              }}
            />
            <Button type="button" onClick={unlock} disabled={isPending || key.trim() === ""}>
              {isPending && <Loader2 className="animate-spin" />}
              Unlock
            </Button>
          </div>
          {error && (
            <p id="acq-finance-key-error" role="alert" className="text-xs text-destructive">{error}</p>
          )}
        </>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          setKey("")
          setError(null)
        }}
        className="text-xs text-muted-foreground hover:underline"
      >
        Skip — add it later on the Finance tab
      </button>
    </section>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
      <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      {children}
    </div>
  )
}

/**
 * The deal while adding a car (admins with finance unlocked): purchase price
 * and what's been paid to the seller, or our commission %. Saved privately in
 * Finance once the car is created.
 */
export function AcquisitionMoneyFields({
  saleModel,
  form,
  errors,
  onChange,
}: {
  saleModel: SaleModel
  form: AcquisitionForm
  errors: Partial<Record<keyof AcquisitionForm, string>>
  onChange: (next: AcquisitionForm) => void
}) {
  const set = <K extends keyof AcquisitionForm>(key: K, value: AcquisitionForm[K]) => onChange({ ...form, [key]: value })

  if (saleModel === "commission") {
    return (
      <section aria-label="Commission" className="space-y-3 rounded-lg border border-border/60 p-3">
        <SectionLabel />
        <FormField id="acq-commission" label="Our commission (% of sale price)" error={errors.commissionPercent}>
          <div className="relative sm:max-w-40">
            <Input
              id="acq-commission"
              inputMode="decimal"
              value={form.commissionPercent}
              onChange={(e) => set("commissionPercent", e.target.value)}
              aria-invalid={errors.commissionPercent ? true : undefined}
              className="pr-8"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
          </div>
        </FormField>
        <p className="text-xs text-muted-foreground">
          Defaults to 2%. Change it if you agreed a different rate with the owner.
        </p>
      </section>
    )
  }

  const rate = parseMoneyInput(form.purchaseRate)
  const paidAmount = parseMoneyInput(form.paidAmount)
  const balance = form.paid === "part" && rate !== null && paidAmount !== null && paidAmount < rate ? rate - paidAmount : null

  return (
    <section aria-label="Purchase" className="space-y-3 rounded-lg border border-border/60 p-3">
      <SectionLabel />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="acq-rate" label="Purchase price" error={errors.purchaseRate}>
          <MoneyInput
            id="acq-rate"
            value={form.purchaseRate}
            onValueChange={(v) => set("purchaseRate", v)}
            aria-invalid={errors.purchaseRate ? true : undefined}
          />
        </FormField>
        <FormField id="acq-date" label="Bought on">
          <DatePicker {...pastDateYears()} id="acq-date" value={form.purchasedOn} onChange={(v) => set("purchasedOn", v)} />
        </FormField>
      </div>

      <FormField id="acq-paid" label="Paid to the seller">
        <SegmentedChoice
          id="acq-paid"
          aria-label="Paid to the seller"
          value={form.paid}
          onValueChange={(v) => set("paid", v as SellerPaid)}
          options={PAID_OPTIONS}
        />
      </FormField>

      {form.paid !== "none" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {form.paid === "part" && (
            <FormField id="acq-paid-amount" label="Amount paid" error={errors.paidAmount}>
              <MoneyInput
                id="acq-paid-amount"
                value={form.paidAmount}
                onValueChange={(v) => set("paidAmount", v)}
                aria-invalid={errors.paidAmount ? true : undefined}
              />
            </FormField>
          )}
          <FormField id="acq-paid-on" label="Paid on" error={errors.paidOn}>
            <DatePicker {...pastDateYears()} id="acq-paid-on" value={form.paidOn} onChange={(v) => set("paidOn", v)} invalid={!!errors.paidOn} />
          </FormField>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {form.paid === "full" && rate !== null
          ? `${formatMoney(rate)} recorded as paid to the seller.`
          : balance !== null
            ? `${formatMoney(balance)} still owed to the seller. Record later payments on the car’s Finance tab.`
            : "Optional. You can add or change the price and payments later on the car’s Finance tab."}
      </p>
    </section>
  )
}

function SectionLabel() {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
      <Lock aria-hidden className="size-3" />
      Deal · visible to admins only
    </p>
  )
}
