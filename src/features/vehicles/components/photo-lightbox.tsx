"use client"

import { useEffect, useRef } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LightboxPhoto {
  id: string
  url: string
  caption: string
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[]
  index: number | null
  onIndexChange: (index: number | null) => void
}

/** Full-screen photo viewer: arrow keys, swipe and a thumbnail strip. */
export function PhotoLightbox({ photos, index, onIndexChange }: PhotoLightboxProps) {
  const open = index !== null && photos.length > 0
  const current = open ? photos[Math.min(index, photos.length - 1)] : null
  const touchX = useRef<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  function step(delta: number) {
    if (index === null) return
    onIndexChange((index + delta + photos.length) % photos.length)
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, photos.length])

  // Keep the active thumbnail in view.
  useEffect(() => {
    if (index === null) return
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [index])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/95 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col text-white outline-none">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <DialogPrimitive.Title className="font-medium">
              {current?.caption}
              <span className="font-mono-data ml-2 text-white/50">
                {index !== null ? index + 1 : 0} / {photos.length}
              </span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-lg p-2 hover:bg-white/10" aria-label="Close">
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16"
            onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return
              const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current
              if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1)
              touchX.current = null
            }}
          >
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="absolute left-3 hidden rounded-full bg-white/10 p-2 hover:bg-white/20 sm:block"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {current && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={current.id}
                src={current.url}
                alt={current.caption}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            )}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="absolute right-3 hidden rounded-full bg-white/10 p-2 hover:bg-white/20 sm:block"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>

          <div ref={stripRef} className="flex gap-2 overflow-x-auto px-4 py-3">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                data-index={i}
                onClick={() => onIndexChange(i)}
                aria-label={`Show ${photo.caption}`}
                className={cn(
                  "h-14 w-20 shrink-0 overflow-hidden rounded-md transition-opacity",
                  i === index ? "ring-2 ring-[#14B8A6]" : "opacity-50 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
