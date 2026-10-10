"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useApiError } from "@/hooks/use-api-error"
import { cn } from "@/lib/utils"
import { confirmMediaAction, deleteMediaAction, requestMediaUploadAction } from "../actions"
import {
  MEDIA_CATEGORY_LABELS,
  MEDIA_CONTENT_TYPES,
  MEDIA_MAX_BYTES,
  STANDARD_ANGLES,
} from "../constants"
import type { MediaCategory, VehicleMediaDto } from "../types"
import { checkFile, putToSignedUrl } from "../upload"
import { orderPhotos, photoCaption } from "../utils"
import { ConfirmDialog } from "./confirm-dialog"
import { PhotoLightbox } from "./photo-lightbox"

interface PendingUpload {
  key: string
  category: MediaCategory
  previewUrl: string
  progress: number
}

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
  const targetCategory = useRef<MediaCategory>("other")

  // Server props win once they include a freshly uploaded photo.
  const byId = new Map<string, VehicleMediaDto>()
  for (const m of [...added, ...media]) byId.set(m.id, m)
  const all = orderPhotos([...byId.values()].filter((m) => !removed.has(m.id)))

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
      <div key={u.key} className={cn("relative overflow-hidden rounded-lg bg-[#F1F5F9]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={u.previewUrl} alt="" className="size-full object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 text-white">
          <Loader2 className="size-5 animate-spin" />
          <div className="h-1 w-2/3 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white transition-all" style={{ width: `${Math.round(u.progress * 100)}%` }} />
          </div>
        </div>
      </div>
    )
  }

  function photoTile(photo: VehicleMediaDto, label: string, className?: string) {
    return (
      <div key={photo.id} className={cn("group relative overflow-hidden rounded-lg bg-[#0F172A]", className)}>
        <button
          type="button"
          onClick={() => setLightbox(indexOf(photo.id))}
          className="block size-full"
          aria-label={`Open ${label}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={label} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 px-2 pt-4 pb-1.5 text-left text-[11px] font-semibold text-white">
            {label}
          </span>
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => setToDelete(photo)}
            aria-label={`Delete ${label}`}
            className="absolute top-1.5 right-1.5 rounded-md bg-white/90 p-1 text-[#DC2626] opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    )
  }

  const pendingFor = (category: MediaCategory) => pending.filter((u) => u.category === category)

  return (
    <div className="space-y-6">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#111827]">
            Standard angles{" "}
            <span className="font-mono-data font-normal text-[#6B7280]">
              {covered} / {STANDARD_ANGLES.length}
            </span>
          </p>
          <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full bg-[#0D9488] transition-all"
              style={{ width: `${(covered / STANDARD_ANGLES.length) * 100}%` }}
            />
          </div>
        </div>
        <Button onClick={() => pick("other")}>
          <Upload />
          Upload extra photos
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STANDARD_ANGLES.map((angle) => {
          const photo = primaryByAngle.get(angle)
          const uploading = pendingFor(angle)[0]
          const label = MEDIA_CATEGORY_LABELS[angle]
          if (photo) {
            return (
              photoTile(photo, angle === "front" ? `${label} · Cover` : label, "aspect-[4/3]")
            )
          }
          if (uploading) return pendingTile(uploading, "aspect-[4/3]")
          return (
            <button
              key={angle}
              type="button"
              onClick={() => pick(angle)}
              {...dropProps(angle)}
              className={cn(
                "flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-[#9CA3AF] transition-colors hover:border-[#0D9488] hover:bg-[#F0FDFA] hover:text-[#0D9488]",
                dragOver === angle ? "border-[#0D9488] bg-[#F0FDFA] text-[#0D9488]" : "border-[#D1D5DB]"
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
        <p className="mb-2 text-sm font-semibold text-[#111827]">
          More photos <span className="font-mono-data font-normal text-[#6B7280]">{more.length}</span>
        </p>
        <div
          {...dropProps("other")}
          className={cn(
            "grid grid-cols-3 gap-3 rounded-lg sm:grid-cols-6",
            dragOver === "other" && "bg-[#F0FDFA] ring-2 ring-[#0D9488] ring-offset-4"
          )}
        >
          {more.map((m) => (
            photoTile(m, photoCaption(m.category), "aspect-square")
          ))}
          {pendingFor("other").map((u) => (
            pendingTile(u, "aspect-square")
          ))}
          <button
            type="button"
            onClick={() => pick("other")}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#D1D5DB] text-[#9CA3AF] hover:border-[#0D9488] hover:bg-[#F0FDFA] hover:text-[#0D9488]"
          >
            <ImagePlus className="size-5" />
            <span className="text-[11px] font-semibold">Add or drop</span>
          </button>
        </div>
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
