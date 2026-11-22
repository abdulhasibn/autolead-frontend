import { act, renderHook, waitFor } from "@testing-library/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

let userId: string | undefined = "user-1"
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: userId ? { user: { id: userId } } : null }),
}))

import { __resetDraftStoreForTests, deleteDraftsWithPrefix, DRAFT_TTL_MS, getDraft, pruneDrafts, putDraft } from "@/lib/drafts/store"
import { draftUserPrefix, formatDraftAge, useDraftKey, useFormDraft, useStateDraft } from "../use-form-draft"

type Values = { name: string; km: string }
const DEFAULTS: Values = { name: "", km: "" }

function useDraftedForm(open: boolean) {
  const form = useForm<Values>({ defaultValues: DEFAULTS })
  const [step, setStep] = useState(0)
  const key = useDraftKey("vehicle:create")
  const draft = useFormDraft(form, { key, open, step, setStep })
  return { form, draft, step, setStep }
}

// jsdom has no IndexedDB, so these run against the localStorage fallback.
beforeEach(() => {
  userId = "user-1"
  localStorage.clear()
  __resetDraftStoreForTests()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useDraftKey", () => {
  it("namespaces by user and is null without a session", () => {
    expect(renderHook(() => useDraftKey("lead:create")).result.current).toBe("u:user-1:lead:create")
    userId = undefined
    expect(renderHook(() => useDraftKey("lead:create")).result.current).toBeNull()
  })

  it("is null when an id part is missing", () => {
    expect(renderHook(() => useDraftKey("owner:edit", undefined)).result.current).toBeNull()
  })
})

describe("useFormDraft", () => {
  it("saves edits after a short pause and restores them with the step", async () => {
    const first = renderHook(() => useDraftedForm(true))
    await waitFor(() => expect(first.result.current.draft.restoredAt).toBeNull())
    // Give the empty load a tick to mark the engine ready.
    await act(async () => {})

    act(() => {
      first.result.current.form.setValue("name", "Ravi")
      first.result.current.form.setValue("km", "42,150")
      first.result.current.setStep(1)
    })
    await waitFor(async () =>
      expect((await getDraft<Values>("u:user-1:vehicle:create"))?.values).toEqual({ name: "Ravi", km: "42,150" })
    )
    expect((await getDraft("u:user-1:vehicle:create"))?.step).toBe(1)
    first.unmount()

    const second = renderHook(() => useDraftedForm(true))
    await waitFor(() => expect(second.result.current.draft.restoredAt).not.toBeNull())
    expect(second.result.current.form.getValues()).toEqual({ name: "Ravi", km: "42,150" })
    expect(second.result.current.step).toBe(1)
  })

  it("clear() removes the draft and stops further saves", async () => {
    await putDraft("u:user-1:vehicle:create", { name: "Old", km: "" })
    const { result } = renderHook(() => useDraftedForm(true))
    await waitFor(() => expect(result.current.draft.restoredAt).not.toBeNull())

    act(() => result.current.draft.clear())
    act(() => result.current.form.setValue("name", "After submit"))
    await new Promise((r) => setTimeout(r, 500))
    expect(await getDraft("u:user-1:vehicle:create")).toBeNull()
    expect(result.current.draft.restoredAt).toBeNull()
  })

  it("discard() deletes the draft and resets to defaults", async () => {
    await putDraft("u:user-1:vehicle:create", { name: "Old", km: "1,000" }, 1)
    const { result } = renderHook(() => useDraftedForm(true))
    await waitFor(() => expect(result.current.step).toBe(1))

    act(() => result.current.draft.discard())
    expect(result.current.form.getValues()).toEqual(DEFAULTS)
    expect(result.current.step).toBe(0)
    await waitFor(async () => expect(await getDraft("u:user-1:vehicle:create")).toBeNull())
  })

  it("never loads another user's draft", async () => {
    await putDraft("u:user-2:vehicle:create", { name: "Someone else", km: "" })
    const { result } = renderHook(() => useDraftedForm(true))
    await act(async () => {})
    expect(result.current.draft.restoredAt).toBeNull()
    expect(result.current.form.getValues("name")).toBe("")
  })

  it("does nothing while closed", async () => {
    await putDraft("u:user-1:vehicle:create", { name: "Waiting", km: "" })
    const { result } = renderHook(() => useDraftedForm(false))
    await act(async () => {})
    expect(result.current.form.getValues("name")).toBe("")
  })
})

describe("useStateDraft", () => {
  it("saves plain state that differs from the initial value", async () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState("")
      const draft = useStateDraft("u:user-1:vehicle:mark-sold:v1", true, value, setValue, "")
      return { value, setValue, draft }
    })
    await act(async () => {})
    act(() => result.current.setValue("Paid in cash"))
    await waitFor(async () => expect((await getDraft("u:user-1:vehicle:mark-sold:v1"))?.values).toBe("Paid in cash"))
  })
})

describe("draft store", () => {
  it("prunes drafts older than the TTL", async () => {
    await putDraft("u:user-1:a", 1)
    const now = Date.now() + DRAFT_TTL_MS + 1000
    await pruneDrafts(now)
    expect(localStorage.length).toBe(0)
  })

  it("deletes a user's drafts on sign-out and keeps others", async () => {
    await putDraft("u:user-1:a", 1)
    await putDraft("u:user-2:a", 2)
    await deleteDraftsWithPrefix(draftUserPrefix("user-1"))
    expect(await getDraft("u:user-1:a")).toBeNull()
    expect((await getDraft("u:user-2:a"))?.values).toBe(2)
  })
})

describe("formatDraftAge", () => {
  it("reads naturally", () => {
    const now = 10_000_000_000
    expect(formatDraftAge(now - 10_000, now)).toBe("just now")
    expect(formatDraftAge(now - 12 * 60_000, now)).toBe("12 min ago")
    expect(formatDraftAge(now - 3 * 3_600_000, now)).toBe("3 h ago")
    expect(formatDraftAge(now - 26 * 3_600_000, now)).toBe("1 day ago")
  })
})
