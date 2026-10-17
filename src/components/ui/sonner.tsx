"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useIsMobile } from "@/hooks/use-media-query"

/** App toaster: light only (no dark mode yet), colours from theme tokens. */
function Toaster(props: ToasterProps) {
  const isMobile = useIsMobile()
  return (
    <Sonner
      theme="light"
      // Phones: centred so toasts don't sit on the header's account menu.
      position={isMobile ? "top-center" : "top-right"}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--accent)",
          "--success-text": "var(--accent-foreground)",
          "--success-border": "var(--accent-border)",
          "--error-bg": "color-mix(in oklab, var(--destructive) 8%, white)",
          "--error-text": "var(--destructive)",
          "--error-border": "color-mix(in oklab, var(--destructive) 25%, white)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: "font-sans" } }}
      {...props}
    />
  )
}

export { Toaster }
