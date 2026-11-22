"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useApiError } from "@/hooks/use-api-error"
import { cn } from "@/lib/utils"
import {
  confirmMediaAction,
  deleteMediaAction,
  reorderMediaAction,
  requestMediaUploadAction,
} from "../actions"
import {
  MEDIA_CATEGORY_LABELS,
  MEDIA_CONTENT_TYPES,
  MEDIA_MAX_BYTES,
  STANDARD_ANGLES,
} from "../constants"
import type { MediaCategory, VehicleMediaDto } from "../types"
import { checkFile, putToSignedUrl } from "../upload"
import { orderPhotos, photoCaption } from "../utils"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PhotoLightbox } from "./photo-lightbox"

interface PendingUpload {
  key: string
  category: MediaCategory
  previewUrl: string
  progress: number
}

interface Placement {
  id: string
  category: MediaCategory
  sortOrder: number
}

interface DragState {
  id: string
  pointerId: number
  pointerType: string
  startX: number
  startY: number
  active: boolean
  timer?: ReturnType<typeof setTimeout>
}

/** Hold this long on touch before a drag starts, so a normal swipe still scrolls. */
const LONG_PRESS_MS = 250
const MOUSE_SLOP_PX = 6
const TOUCH_SLOP_PX = 10

interface PhotoManagerProps {
  vehicleId: string
  media: VehicleMediaDto[]
  canDelete: boolean
}

const ACCEPT = MEDIA_CONTENT_TYPES.join(",")

/**
 * The 8 standard angles as labelled slots (empty ones are upload targets),
 * then every other photo. Files go straight to storage via a signed URL.
 */
export function PhotoManager({ vehicleId, media, canDelete }: PhotoManagerProps) {
  const router = useRouter()
  const { handleError } = useApiError()
  const [added, setAdded] = useState<VehicleMediaDto[]>([])
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<VehicleMediaDto | null>(null)
  const [deleting, startDelete] = useTransition()
  const [dragOver, setDragOver] = useState<MediaCategory | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const targetCategory = useRef<MediaCategory>("other")
  const containerRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState<VehicleMediaDto | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  // Optimistic moves, valid only until the server sends a new media list.
  const [moves, setMoves] = useState<{ base: VehicleMediaDto[]; map: Map<string, Placement> }>({
    base: media,
    map: new Map(),
  })
  const moved = moves.base === media ? moves.map : null

  // While a drag is live, stop the page from scrolling under the finger.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (drag.current?.active) e.preventDefault()
    }
    document.addEventListener("touchmove", block, { passive: false })
    return () => document.removeEventListener("touchmove", block)
  }, [])

  // Server props win once they include a freshly uploaded photo.
  const byId = new Map<string, VehicleMediaDto>()
  for (const m of [...added, ...media]) byId.set(m.id, m)
  const all = orderPhotos(
    [...byId.values()]
      .filter((m) => !removed.has(m.id))
      .map((m) => {
        const p = moved?.get(m.id)
        return p ? { ...m, category: p.category, sortOrder: p.sortOrder } : m
      })
  )

  const primaryByAngle = new Map<MediaCategory, VehicleMediaDto>()
  for (const m of all) {
    const category = m.category ?? "other"
    if (category !== "other" && !primaryByAngle.has(category)) primaryByAngle.set(category, m)
  }
  const primaryIds = new Set([...primaryByAngle.values()].map((m) => m.id))
  const more = all.filter((m) => !primaryIds.has(m.id))
  const covered = STANDARD_ANGLES.filter((a) => primaryByAngle.has(a)).length

  const photos = all.map((m, i) => ({
    id: m.id,
    url: m.url,
    caption: photoCaption(m.category, i === 0 && m.category === "front"),
  }))
  const indexOf = (id: string) => all.findIndex((m) => m.id === id)

  async function uploadOne(file: File, category: MediaCategory, sortOrder: number) {
    const problem = checkFile(file, MEDIA_CONTENT_TYPES, MEDIA_MAX_BYTES)
    if (problem) {
      toast.error(problem)
      return
    }
    const key = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    setPending((p) => [...p, { key, category, previewUrl, progress: 0 }])
    try {
      const ticket = await requestMediaUploadAction(vehicleId, { category, contentType: file.type })
      if (!ticket.ok) {
        handleError(ticket.error, "Could not start the upload.")
        return
      }
      await putToSignedUrl(ticket.data, file, (progress) =>
        setPending((p) => p.map((u) => (u.key === key ? { ...u, progress } : u)))
      )
      const confirmed = await confirmMediaAction(vehicleId, {
        storagePath: ticket.data.storagePath,
        category,
        sortOrder,
      })
      if (!confirmed.ok) {
        handleError(confirmed.error, "Could not save the photo.")
        return
      }
      setAdded((a) => [...a, confirmed.data])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setPending((p) => p.filter((u) => u.key !== key))
      URL.revokeObjectURL(previewUrl)
    }
  }

  async function upload(files: FileList | File[], category: MediaCategory) {
    const list = Array.from(files)
    if (list.length === 0) return
    // A standard angle holds one primary shot; extra files become "other".
    const base = all.length + pending.length
    await Promise.all(
      list.map((file, i) =>
        uploadOne(file, i === 0 || category === "other" ? category : "other", base + i)
      )
    )
    router.refresh()
  }

  function pick(category: MediaCategory) {
    targetCategory.current = category
    inputRef.current?.click()
  }

  /** Phones: open the rear camera straight away instead of the file chooser. */
  function shoot(category: MediaCategory) {
    targetCategory.current = category
    cameraRef.current?.click()
  }

  function dropProps(category: MediaCategory) {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(category)
      },
      onDragLeave: () => setDragOver((c) => (c === category ? null : c)),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(null)
        void upload(e.dataTransfer.files, category)
      },
    }
  }

  const categoryOf = (m: VehicleMediaDto): MediaCategory => m.category ?? "other"

  /** Exchange two photos' slots (angle + position). */
  function swap(a: VehicleMediaDto, b: VehicleMediaDto): Placement[] {
    if (categoryOf(a) === categoryOf(b) && a.sortOrder === b.sortOrder) {
      // Same key, so only upload time orders them: give each a distinct position.
      const [first, second] = indexOf(a.id) < indexOf(b.id) ? [a, b] : [b, a]
      return [
        { id: second.id, category: categoryOf(second), sortOrder: first.sortOrder },
        { id: first.id, category: categoryOf(first), sortOrder: Math.min(first.sortOrder + 1, 32767) },
      ]
    }
    return [
      { id: a.id, category: categoryOf(b), sortOrder: b.sortOrder },
      { id: b.id, category: categoryOf(a), sortOrder: a.sortOrder },
    ]
  }

  function planMove(src: VehicleMediaDto, slot: string): Placement[] {
    if (slot.startsWith("angle:")) {
      const angle = slot.slice("angle:".length) as MediaCategory
      const occupant = primaryByAngle.get(angle)
      if (occupant?.id === src.id) return []
      return occupant ? swap(src, occupant) : [{ id: src.id, category: angle, sortOrder: src.sortOrder }]
    }
    if (slot === "end") {
      if (more.at(-1)?.id === src.id) return []
      const last = Math.max(0, ...all.map((m) => m.sortOrder))
      return [{ id: src.id, category: "other", sortOrder: Math.min(last + 1, 32767) }]
    }
    const target = all.find((m) => `photo:${m.id}` === slot)
    return !target || target.id === src.id ? [] : swap(src, target)
  }

  function commitMove(src: VehicleMediaDto, slot: string) {
    const changes = planMove(src, slot)
    if (changes.length === 0) return
    const before = moves
    const map = new Map(moved ?? [])
    for (const c of changes) map.set(c.id, c)
    setMoves({ base: media, map })
    void reorderMediaAction(vehicleId, { items: changes }).then((result) => {
      if (!result.ok) {
        setMoves(before)
        handleError(result.error, "Could not move the photo.")
        return
      }
      router.refresh()
    })
  }

  function slotAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slot]")
    if (!el || !containerRef.current?.contains(el)) return null
    return el.dataset.slot ?? null
  }

  function moveGhost(x: number, y: number) {
    const g = ghostRef.current
    if (g) g.style.transform = `translate(${x - 48}px, ${y - 36}px)`
  }

  function endDrag() {
    const d = drag.current
    if (d?.timer) clearTimeout(d.timer)
    drag.current = null
    setDragging(null)
    setDropTarget(null)
  }

  function startDrag(photo: VehicleMediaDto, x: number, y: number) {
    const d = drag.current
    if (!d) return
    d.active = true
    suppressClick.current = true
    setDragging(photo)
    moveGhost(x, y)
    if (d.pointerType !== "mouse") navigator.vibrate?.(10)
  }

  function dragProps(photo: VehicleMediaDto) {
    return {
      onContextMenu: (e: React.MouseEvent) => {
        // Long-press on phones would otherwise open the image menu.
        if (drag.current) e.preventDefault()
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest("[data-no-drag]")) return
        suppressClick.current = false
        const x = e.clientX
        const y = e.clientY
        drag.current = {
          id: photo.id,
          pointerId: e.pointerId,
          pointerType: e.pointerType,
          startX: x,
          startY: y,
          active: false,
        }
        if (e.pointerType !== "mouse") {
          drag.current.timer = setTimeout(() => startDrag(photo, x, y), LONG_PRESS_MS)
        }
      },
      onPointerMove: (e: React.PointerEvent) => {
        const d = drag.current
        if (!d || d.pointerId !== e.pointerId) return
        if (!d.active) {
          const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY)
          if (d.pointerType === "mouse") {
            if (dist > MOUSE_SLOP_PX) {
              try {
                e.currentTarget.setPointerCapture(e.pointerId)
              } catch {
                // Pointer already gone; the drag still works without capture.
              }
              startDrag(photo, e.clientX, e.clientY)
            }
          } else if (dist > TOUCH_SLOP_PX) {
            endDrag() // finger moved before the long-press: it's a scroll
          }
          return
        }
        moveGhost(e.clientX, e.clientY)
        const slot = slotAt(e.clientX, e.clientY)
        setDropTarget(slot === `photo:${photo.id}` ? null : slot)
      },
      onPointerUp: (e: React.PointerEvent) => {
        const d = drag.current
        if (!d || d.pointerId !== e.pointerId) return
        const slot = d.active ? slotAt(e.clientX, e.clientY) : null
        endDrag()
        if (slot) commitMove(photo, slot)
      },
      onPointerCancel: endDrag,
    }
  }

  function confirmDelete() {
    if (!toDelete) return
    const target = toDelete
    startDelete(async () => {
      const result = await deleteMediaAction(vehicleId, target.id)
      if (!result.ok) {
        handleError(result.error, "Could not delete the photo.")
        return
      }
      setRemoved((r) => new Set(r).add(target.id))
      setToDelete(null)
      toast.success("Photo deleted.")
      router.refresh()
    })
  }

  function pendingTile(u: PendingUpload, className?: string) {
    return (
      <div key={u.key} className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={u.previewUrl} alt="" className="size-full object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 text-white">
          <Loader2 className="size-5 animate-spin" />
          <div className="h-1 w-2/3 overflow-hidden rounded-full bg-card/30">
            <div className="h-full bg-card transition-all" style={{ width: `${Math.round(u.progress * 100)}%` }} />
          </div>
        </div>
      </div>
    )
  }

  function photoTile(photo: VehicleMediaDto, label: string, slot: string, className?: string) {
    return (
      <div
        key={photo.id}
        data-slot={slot}
        {...dragProps(photo)}
        className={cn(
          "group relative cursor-grab touch-manipulation overflow-hidden rounded-lg bg-[#0F172A] select-none [-webkit-touch-callout:none]",
          dragging?.id === photo.id && "opacity-40",
          dropTarget === slot && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          className
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false
              return
            }
            setLightbox(indexOf(photo.id))
          }}
          className="block size-full"
          aria-label={`Open ${label}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={label} loading="lazy" draggable={false} className="size-full object-cover transition group-hover:scale-105" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 px-2 pt-4 pb-1.5 text-left text-[11px] font-semibold text-white">
            {label}
          </span>
        </button>
        {canDelete && (
          <button
            type="button"
            data-no-drag
            onClick={() => setToDelete(photo)}
            aria-label={`Delete ${label}`}
            className="absolute top-1.5 right-1.5 rounded-md bg-card/90 p-1 text-destructive opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:p-1.5 pointer-coarse:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    )
  }

  const pendingFor = (category: MediaCategory) => pending.filter((u) => u.category === category)

  return (
    <div ref={containerRef} className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files, targetCategory.current)
          e.target.value = ""
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files, targetCategory.current)
          e.target.value = ""
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Standard angles{" "}
            <span className="font-mono-data font-normal text-muted-foreground">
              {covered} / {STANDARD_ANGLES.length}
            </span>
          </p>
          <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(covered / STANDARD_ANGLES.length) * 100}%` }}
            />
          </div>
          {all.length > 1 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              <span className="pointer-coarse:hidden">Drag</span>
              <span className="hidden pointer-coarse:inline">Press and hold, then drag</span> a photo onto
              another to swap them.
            </p>
          )}
        </div>
        <div className="flex gap-2 max-sm:w-full max-sm:*:flex-1">
          <Button variant="outline" className="hidden pointer-coarse:inline-flex" onClick={() => shoot("other")}>
            <Camera />
            Take photo
          </Button>
          <Button onClick={() => pick("other")}>
            <Upload />
            <span className="pointer-coarse:hidden">Upload extra photos</span>
            <span className="hidden pointer-coarse:inline">Upload</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STANDARD_ANGLES.map((angle) => {
          const photo = primaryByAngle.get(angle)
          const uploading = pendingFor(angle)[0]
          const label = MEDIA_CATEGORY_LABELS[angle]
          if (photo) {
            return (
              photoTile(photo, angle === "front" ? `${label} · Cover` : label, `angle:${angle}`, "aspect-[4/3]")
            )
          }
          if (uploading) return pendingTile(uploading, "aspect-[4/3]")
          return (
            <button
              key={angle}
              type="button"
              data-slot={`angle:${angle}`}
              onClick={() => pick(angle)}
              {...dropProps(angle)}
              className={cn(
                "flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-subtle-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary",
                dragOver === angle || dropTarget === `angle:${angle}` ? "border-primary bg-accent text-primary" : "border-border"
              )}
            >
              <ImagePlus className="size-5" />
              <span className="text-xs font-semibold">Add {label.toLowerCase()}</span>
              {angle === "front" && <span className="text-[10px]">Used as the cover</span>}
            </button>
          )
        })}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">
          More photos <span className="font-mono-data font-normal text-muted-foreground">{more.length}</span>
        </p>
        <div
          {...dropProps("other")}
          className={cn(
            "grid grid-cols-3 gap-3 rounded-lg sm:grid-cols-6",
            dragOver === "other" && "bg-accent ring-2 ring-[#0D9488] ring-offset-4"
          )}
        >
          {more.map((m) => (
            photoTile(m, photoCaption(m.category), `photo:${m.id}`, "aspect-square")
          ))}
          {pendingFor("other").map((u) => (
            pendingTile(u, "aspect-square")
          ))}
          <button
            type="button"
            data-slot="end"
            onClick={() => pick("other")}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-subtle-foreground hover:border-primary hover:bg-accent hover:text-primary",
              dropTarget === "end" ? "border-primary bg-accent text-primary" : "border-border"
            )}
          >
            <ImagePlus className="size-5" />
            <span className="text-[11px] font-semibold">Add or drop</span>
          </button>
        </div>
      </div>

      <div
        ref={ghostRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed top-0 left-0 z-50 h-[72px] w-24 overflow-hidden rounded-lg shadow-2xl ring-2 ring-primary",
          !dragging && "hidden"
        )}
      >
        {dragging && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dragging.url} alt="" draggable={false} className="size-full object-cover" />
        )}
      </div>

      <PhotoLightbox photos={photos} index={lightbox} onIndexChange={setLightbox} />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this photo?"
        description="It is removed from the vehicle and from storage. This can't be undone."
        confirmLabel="Delete photo"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
