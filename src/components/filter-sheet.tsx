"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Contents of the trigger button. */
  trigger: React.ReactNode
  triggerClassName?: string
  title?: string
  /** Popover width/spacing on desktop. */
  popoverClassName?: string
  children: React.ReactNode
  /** Apply/Reset row; pinned to the bottom of the sheet on phones. */
  footer?: React.ReactNode
}

/** Filter panel: a popover on desktop, a bottom sheet on phones. */
export function FilterSheet({
  open,
  onOpenChange,
  trigger,
  triggerClassName,
  title = "Filters",
  popoverClassName,
  children,
  footer,
}: FilterSheetProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger className={triggerClassName}>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="gap-0 p-0">
          <SheetHeader className="border-b border-border/50 px-4 py-3">
            <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">{children}</div>
          {footer && <div className="border-t border-border/50 px-4 py-3">{footer}</div>}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger className={triggerClassName}>{trigger}</PopoverTrigger>
      <PopoverContent className={cn("space-y-4", popoverClassName)}>
        {children}
        {footer && <div className="border-t border-border/50 pt-3">{footer}</div>}
      </PopoverContent>
    </Popover>
  )
}
