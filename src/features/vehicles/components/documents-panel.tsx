"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileImage, FileText, FileUp, Loader2, Lock, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { OptionSelect } from "@/features/leads/components/option-select"
import { useApiError } from "@/hooks/use-api-error"
import { formatDate } from "@/lib/format"
import {
  confirmDocumentAction,
  deleteDocumentAction,
  requestDocumentUploadAction,
} from "../actions"
import {
  DOCUMENT_CONTENT_TYPES,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  documentTypeLabel,
} from "../constants"
import type { DocumentType, VehicleDocumentDto } from "../types"
import { checkFile, putToSignedUrl } from "../upload"
import { ConfirmDialog } from "@/components/confirm-dialog"

/** Missing ones of these are offered as one-click rows. */
const EXPECTED: DocumentType[] = ["rc", "insurance"]

const TYPE_OPTIONS = DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] }))

interface DocumentsPanelProps {
  vehicleId: string
  documents: VehicleDocumentDto[]
  canDelete: boolean
}

export function DocumentsPanel({ vehicleId, documents, canDelete }: DocumentsPanelProps) {
  const router = useRouter()
  const { handleError } = useApiError()
  const inputRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState<DocumentType>("rc")
  const [uploading, setUploading] = useState<{ name: string; progress: number } | null>(null)
  const [toDelete, setToDelete] = useState<VehicleDocumentDto | null>(null)
  const [deleting, startDelete] = useTransition()

  const present = new Set(documents.map((d) => d.docType))
  const missing = EXPECTED.filter((t) => !present.has(t))

  function pick(type: DocumentType) {
    setDocType(type)
    inputRef.current?.click()
  }

  async function upload(file: File, type: DocumentType) {
    const problem = checkFile(file, DOCUMENT_CONTENT_TYPES, DOCUMENT_MAX_BYTES)
    if (problem) {
      toast.error(problem)
      return
    }
    setUploading({ name: file.name, progress: 0 })
    try {
      const ticket = await requestDocumentUploadAction(vehicleId, { docType: type, contentType: file.type })
      if (!ticket.ok) {
        handleError(ticket.error, "Could not start the upload.")
        return
      }
      await putToSignedUrl(ticket.data, file, (progress) =>
        setUploading((u) => (u ? { ...u, progress } : u))
      )
      const confirmed = await confirmDocumentAction(vehicleId, {
        storagePath: ticket.data.storagePath,
        docType: type,
        fileName: file.name.slice(0, 255),
      })
      if (!confirmed.ok) {
        handleError(confirmed.error, "Could not save the document.")
        return
      }
      toast.success(`${DOCUMENT_TYPE_LABELS[type]} uploaded.`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(null)
    }
  }

  function confirmDelete() {
    if (!toDelete) return
    const target = toDelete
    startDelete(async () => {
      const result = await deleteDocumentAction(vehicleId, target.id)
      if (!result.ok) {
        handleError(result.error, "Could not delete the document.")
        return
      }
      setToDelete(null)
      toast.success("Document deleted.")
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_CONTENT_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void upload(file, docType)
          e.target.value = ""
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Internal only. Never shown to buyers.
        </p>
        <div className="flex items-center gap-2">
          <OptionSelect
            aria-label="Document type"
            className="h-8 w-44 bg-card"
            value={docType}
            onValueChange={(v) => v && setDocType(v as DocumentType)}
            options={TYPE_OPTIONS}
          />
          <Button variant="outline" onClick={() => pick(docType)} disabled={uploading !== null}>
            <FileUp />
            Upload
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-[#F3F4F6] rounded-lg border border-border/50 text-sm">
        {documents.map((doc) => {
          const isPdf = doc.storagePath.toLowerCase().endsWith(".pdf")
          const Icon = isPdf ? FileText : FileImage
          const typeLabel = documentTypeLabel(doc.docType)
          return (
            <li key={doc.id} className="group flex items-center gap-3 px-3 py-2.5">
              <span
                className={
                  isPdf
                    ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/5 text-destructive"
                    : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]"
                }
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{doc.fileName ?? typeLabel}</p>
                <p className="text-xs text-subtle-foreground">
                  {typeLabel} · {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-accent"
              >
                Open
              </a>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setToDelete(doc)}
                  aria-label={`Delete ${doc.fileName ?? typeLabel}`}
                  className="rounded-lg p-1.5 text-subtle-foreground hover:bg-destructive/5 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          )
        })}

        {uploading && (
          <li className="flex items-center gap-3 px-3 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
              <Loader2 className="size-4 animate-spin" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{uploading.name}</p>
              <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(uploading.progress * 100)}%` }} />
              </div>
            </div>
          </li>
        )}

        {missing.map((type) => (
          <li key={type} className="flex items-center gap-3 px-3 py-2.5 text-subtle-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg border border-dashed border-border">
              <Plus className="size-4" />
            </span>
            <div className="flex-1">
              <p className="font-medium">{DOCUMENT_TYPE_LABELS[type]}</p>
              <p className="text-xs">Not uploaded yet</p>
            </div>
            <button
              type="button"
              onClick={() => pick(type)}
              disabled={uploading !== null}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-accent disabled:opacity-50"
            >
              Add
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this document?"
        description="It is removed from the vehicle. This can't be undone."
        confirmLabel="Delete document"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
