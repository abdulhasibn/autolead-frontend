"use client"

import { createContext, useContext, useEffect, useState } from "react"

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

export function ThemeProvider({
  children,
  defaultPreference = "light",
}: {
  children: React.ReactNode
  defaultPreference?: ThemePreference
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(defaultPreference)
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_PREFERENCE_KEY)
    if (stored && isThemePreference(stored)) setPreferenceState(stored)

    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemDark(mql.matches)
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const mode = resolveThemeMode(preference, systemDark)

  useEffect(() => {
    const root = document.documentElement
    if (mode === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
  }, [mode])

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next)
    localStorage.setItem(THEME_PREFERENCE_KEY, next)
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
