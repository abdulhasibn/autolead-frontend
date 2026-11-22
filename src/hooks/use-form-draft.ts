"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import { useSession } from "next-auth/react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

import { deleteDraft, getDraft, putDraft, subscribeDrafts } from "@/lib/drafts/store"

const SAVE_DELAY_MS = 400

/** Drafts are namespaced per signed-in user so a shared phone never mixes them. */
export function draftUserPrefix(userId: string): string {
  return `u:${userId}:`
}

/**
 * Full storage key for a form's draft, e.g. `useDraftKey("vehicle:edit", id)`.
 * Null until the session is known, which turns drafts off.
 */
export function useDraftKey(...parts: (string | null | undefined)[]): string | null {
  const { data: session } = useSession()
  const userId = session?.user?.id
  if (!userId || parts.some((p) => p == null || p === "")) return null
  return draftUserPrefix(userId) + parts.join(":")
}

export interface DraftControls {
  /** When a saved draft was put back into the form; null when nothing was restored. */
  restoredAt: number | null
  /** Saves right now (the "Save draft" button). */
  saveNow: () => Promise<void>
  /** Deletes the draft without touching the form. Call after a successful submit. */
  clear: () => void
  /** Deletes the draft and puts the form back to its starting values. */
  discard: () => void
}

interface DraftEngineOptions<T> {
  key: string | null
  /** Drafts load when this turns true (the sheet/dialog opening). */
  open: boolean
  read: () => T
  /** Puts a stored draft back. */
  apply: (values: T, step: number | undefined) => void
  /** Puts the starting values back (Discard). */
  restart: () => void
  step?: number
}

/**
 * Shared engine: load on open, debounced write on change, immediate write when
 * the page is hidden (incoming call, app switch) or the form closes.
 */
function useDraftEngine<T>({ key, open, read, apply, restart, step }: DraftEngineOptions<T>) {
  const [restoredAt, setRestoredAt] = useState<number | null>(null)
  const pending = useRef<{ values: T; step?: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** False until the stored draft (if any) has been loaded, so defaults never overwrite it. */
  const ready = useRef(false)
  /** Set by clear(): nothing more is saved until the form opens again. */
  const suppressed = useRef(false)
  const latest = useRef({ key, read, apply, restart, step })
  useLayoutEffect(() => {
    latest.current = { key, read, apply, restart, step }
  })

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const snapshot = pending.current
    pending.current = null
    const k = latest.current.key
    if (!snapshot || !k || suppressed.current || !ready.current) return
    await putDraft(k, snapshot.values, snapshot.step)
  }, [])

  const schedule = useCallback(
    (values: T) => {
      if (!ready.current || suppressed.current || !latest.current.key) return
      pending.current = { values, step: latest.current.step }
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS)
    },
    [flush]
  )

  // Load when the form opens; save what's pending when it closes.
  useEffect(() => {
    if (!open || !key) return
    let cancelled = false
    suppressed.current = false
    ready.current = false
    void getDraft<T>(key).then((record) => {
      if (cancelled) return
      if (record) latest.current.apply(record.values, record.step)
      setRestoredAt(record ? record.updatedAt : null)
      ready.current = true
    })
    return () => {
      cancelled = true
      void flush()
      ready.current = false
    }
  }, [open, key, flush])

  // A step change alone is worth saving (user moved on to the next page).
  useEffect(() => {
    if (open && ready.current && !suppressed.current) schedule(latest.current.read())
  }, [step, open, schedule])

  // The phone call case: the browser may freeze or kill a hidden tab.
  useEffect(() => {
    if (!open) return
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush()
    }
    const onPageHide = () => void flush()
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", onPageHide)
    }
  }, [open, flush])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const controls: DraftControls = {
    restoredAt,
    saveNow: useCallback(async () => {
      if (!latest.current.key) return
      ready.current = true
      suppressed.current = false
      pending.current = { values: latest.current.read(), step: latest.current.step }
      await flush()
    }, [flush]),
    clear: useCallback(() => {
      suppressed.current = true
      pending.current = null
      if (timer.current) clearTimeout(timer.current)
      setRestoredAt(null)
      if (latest.current.key) void deleteDraft(latest.current.key)
    }, []),
    discard: useCallback(() => {
      pending.current = null
      if (timer.current) clearTimeout(timer.current)
      setRestoredAt(null)
      if (latest.current.key) void deleteDraft(latest.current.key)
      latest.current.restart()
    }, []),
  }

  return { controls, schedule }
}

interface UseFormDraftOptions {
  key: string | null
  open: boolean
  step?: number
  setStep?: (step: number) => void
}

/**
 * Keeps a react-hook-form form's unsent input as a draft on this device and
 * puts it back when the form is opened again.
 */
export function useFormDraft<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "watch" | "getValues" | "reset" | "formState">,
  { key, open, step, setStep }: UseFormDraftOptions
): DraftControls {
  const { controls, schedule } = useDraftEngine<T>({
    key,
    open,
    step,
    read: () => form.getValues(),
    apply: (values, savedStep) => {
      form.reset(values, { keepDefaultValues: true })
      if (savedStep != null) setStep?.(savedStep)
    },
    restart: () => {
      form.reset()
      setStep?.(0)
    },
  })

  useEffect(() => {
    if (!open) return
    const sub = form.watch((values, { name }) => {
      // reset() (opening, closing, restoring) reports no field name; only real edits count.
      if (name === undefined) return
      schedule(values as T)
    })
    return () => sub.unsubscribe()
  }, [form, open, schedule])

  return controls
}

/**
 * Same as useFormDraft for forms kept in plain React state. `initial` is what
 * Discard goes back to; nothing is saved while `value` equals it.
 */
export function useStateDraft<T>(
  key: string | null,
  open: boolean,
  value: T,
  setValue: (value: T) => void,
  initial: T
): DraftControls {
  const initialJson = JSON.stringify(initial)
  const { controls, schedule } = useDraftEngine<T>({
    key,
    open,
    read: () => value,
    apply: (values) => setValue(values),
    restart: () => setValue(JSON.parse(initialJson) as T),
  })
  const json = JSON.stringify(value)
  const lastJson = useRef(json)
  useEffect(() => {
    if (!open) {
      lastJson.current = json
      return
    }
    if (json === lastJson.current) return
    lastJson.current = json
    if (json !== initialJson) schedule(JSON.parse(json) as T)
  }, [json, initialJson, open, schedule])
  return controls
}

/** True while a draft exists for `key` (for a "Draft" dot on the open button). */
export function useHasDraft(key: string | null): boolean {
  const [found, setFound] = useState<{ key: string; has: boolean } | null>(null)
  const version = useSyncExternalStore(
    (cb) => subscribeDrafts((k) => k === key && cb()),
    () => versionFor(key),
    () => 0
  )
  useEffect(() => {
    if (!key) return
    let cancelled = false
    void getDraft(key).then((r) => {
      if (!cancelled) setFound({ key, has: !!r })
    })
    return () => {
      cancelled = true
    }
  }, [key, version])
  return !!key && found?.key === key && found.has
}

const versions = new Map<string, number>()
subscribeDrafts((k) => versions.set(k, (versions.get(k) ?? 0) + 1))
function versionFor(key: string | null): number {
  return key ? (versions.get(key) ?? 0) : 0
}

/** "just now", "12 min ago", "3 h ago", "2 days ago". */
export function formatDraftAge(updatedAt: number, now = Date.now()): string {
  const min = Math.floor((now - updatedAt) / 60_000)
  if (min < 1) return "just now"
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? "" : "s"} ago`
}
