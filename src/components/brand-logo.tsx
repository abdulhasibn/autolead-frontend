import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

/*
 * Wheels Experts brand mark, drawn as a CSS mask over the monochrome logo
 * PNG in /public/brand. The fill comes from `currentColor`, so the logo
 * follows the theme instead of shipping one file per colour.
 */

function maskStyle(src: string, background: string): CSSProperties {
  return {
    background,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  }
}

/** Hexagon + car, without the name band. For square spots: tiles, avatars, collapsed nav. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block aspect-[512/546] shrink-0", className)}
      style={maskStyle("/brand/logo-mark.png", "currentColor")}
    />
  )
}
