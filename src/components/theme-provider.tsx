"use client"

import { createContext, useContext, useEffect, useSyncExternalStore } from "react"

export type ThemeMode = "light" | "dark"
export type ThemePreference = ThemeMode | "system"

export const THEME_PREFERENCE_KEY = "ui.themePreference.v1"

export const isThemePreference = (v: string): v is ThemePreference =>
  v === "light" || v === "dark" || v === "system"

export const resolveThemeMode = (
  preference: ThemePreference,
  systemDark: boolean,
): ThemeMode => {
  if (preference === "light" || preference === "dark") return preference
  return systemDark ? "dark" : "light"
}

interface ThemeContextValue {
  readonly mode: ThemeMode
  readonly preference: ThemePreference
  readonly setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DARK_QUERY = "(prefers-color-scheme: dark)"
const preferenceListeners = new Set<() => void>()

function notifyPreferenceListeners() {
  preferenceListeners.forEach((listener) => listener())
}

function subscribeStoredPreference(listener: () => void) {
  preferenceListeners.add(listener)
  // Other tabs changing the theme fire "storage" here.
  window.addEventListener("storage", listener)
  return () => {
    preferenceListeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function readStoredPreference() {
  return localStorage.getItem(THEME_PREFERENCE_KEY)
}

function subscribeSystemDark(listener: () => void) {
  const mql = window.matchMedia(DARK_QUERY)
  mql.addEventListener("change", listener)
  return () => mql.removeEventListener("change", listener)
}

function readSystemDark() {
  return window.matchMedia(DARK_QUERY).matches
}

export function ThemeProvider({
  children,
  defaultPreference = "light",
}: {
  children: React.ReactNode
  defaultPreference?: ThemePreference
}) {
  // Server snapshots match the first client render (default preference, light
  // system), so hydration is unchanged; the stored values apply right after.
  const stored = useSyncExternalStore(subscribeStoredPreference, readStoredPreference, () => null)
  const preference = stored && isThemePreference(stored) ? stored : defaultPreference
  const systemDark = useSyncExternalStore(subscribeSystemDark, readSystemDark, () => false)

  const mode = resolveThemeMode(preference, systemDark)

  useEffect(() => {
    const root = document.documentElement
    if (mode === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
  }, [mode])

  const setPreference = (next: ThemePreference) => {
    localStorage.setItem(THEME_PREFERENCE_KEY, next)
    notifyPreferenceListeners()
  }

  return (
    <ThemeContext.Provider value={{ mode, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

export function useThemePreference(): Pick<ThemeContextValue, "preference" | "setPreference"> {
  const { preference, setPreference } = useTheme()
  return { preference, setPreference }
}
