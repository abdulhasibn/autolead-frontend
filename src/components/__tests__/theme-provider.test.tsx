import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { THEME_PREFERENCE_KEY, ThemeProvider, useTheme } from "../theme-provider"

let systemDark = false
const mediaListeners = new Set<() => void>()

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove("dark")
  systemDark = false
  mediaListeners.clear()
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return systemDark
    },
    media: query,
    addEventListener: (_: string, l: () => void) => mediaListeners.add(l),
    removeEventListener: (_: string, l: () => void) => mediaListeners.delete(l),
  }))
})

const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

describe("ThemeProvider", () => {
  it("uses the default when nothing is stored", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.preference).toBe("light")
    expect(result.current.mode).toBe("light")
  })

  it("applies a stored preference", () => {
    localStorage.setItem(THEME_PREFERENCE_KEY, "dark")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.preference).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("ignores an invalid stored value", () => {
    localStorage.setItem(THEME_PREFERENCE_KEY, "purple")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.preference).toBe("light")
  })

  it("setPreference updates state, storage and the dark class", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setPreference("dark"))
    expect(result.current.mode).toBe("dark")
    expect(localStorage.getItem(THEME_PREFERENCE_KEY)).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("follows the system setting when the preference is system", () => {
    localStorage.setItem(THEME_PREFERENCE_KEY, "system")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe("light")
    act(() => {
      systemDark = true
      mediaListeners.forEach((l) => l())
    })
    expect(result.current.mode).toBe("dark")
  })
})
