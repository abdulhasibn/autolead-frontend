import { cn } from "@/lib/utils"

/**
 * Page-level actions. Inline on desktop; on phones the same buttons dock to a
 * bar at the bottom of the screen, so each dialog/sheet is mounted only once.
 * <main> reserves room for the docked bar via `has-data-[slot=mobile-action-bar]`.
 */
export function MobileActionBar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="mobile-action-bar"
      className={cn(
        "flex flex-wrap gap-2",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:flex-nowrap max-md:border-t max-md:border-border max-md:bg-card/95 max-md:px-4 max-md:pt-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:shadow-[0_-4px_16px_rgba(0,0,0,0.06)] max-md:backdrop-blur",
        "max-md:*:min-w-0 max-md:*:flex-1",
        className
      )}
    >
      {children}
    </div>
  )
}
