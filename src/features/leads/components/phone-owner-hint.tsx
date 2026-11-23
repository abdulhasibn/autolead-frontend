"use client"

import { useEffect, useState } from "react"
import { normalizeIndianPhone } from "@/lib/phone"
import { lookupContactByPhoneAction } from "../actions"
import type { ContactLookup } from "../api"

const LOOKUP_DELAY_MS = 400

/**
 * Under the phone field of the new-lead form: says when the number already
 * belongs to a contact. The lead is filed under that contact and its name is
 * kept (the typed name goes into the notes). Admins see the name and can copy
 * it into the form; salespeople only learn that the number is taken.
 * Never blocks saving.
 */
export function PhoneOwnerHint({ phone, onUseName }: { phone: string; onUseName: (name: string) => void }) {
  const normalized = normalizeIndianPhone(phone)
  // The answer is kept with the number it was for, so a slow reply never shows
  // against a number typed after it.
  const [result, setResult] = useState<{ phone: string; lookup: ContactLookup } | null>(null)

  useEffect(() => {
    if (normalized === null) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const res = await lookupContactByPhoneAction(normalized)
      if (!cancelled && res.ok) setResult({ phone: normalized, lookup: res.data })
    }, LOOKUP_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [normalized])

  if (normalized === null || result?.phone !== normalized || !result.lookup.exists) return null
  const owner = result.lookup.contact

  return (
    <p role="status" className="text-xs text-muted-foreground sm:col-span-2">
      {owner ? (
        <>
          This number belongs to <span className="font-medium text-foreground">{owner.fullName}</span>. The lead is
          filed under that contact and keeps that name.{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => onUseName(owner.fullName)}
          >
            Use this name
          </button>
        </>
      ) : (
        <>This number already belongs to a contact. The lead is filed under that contact and keeps its name.</>
      )}
    </p>
  )
}
