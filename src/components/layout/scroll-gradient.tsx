"use client"

import { useRef, useState } from "react"

export function ScrollGradient({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  return (
    <>
      <main
        ref={mainRef}
        onScroll={() => setScrolled((mainRef.current?.scrollTop ?? 0) > 0)}
        className="absolute inset-0 overflow-y-auto px-4 md:px-6 pt-16 pb-6"
      >
        {children}
      </main>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-muted via-muted/80 to-transparent z-10 transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  )
}
