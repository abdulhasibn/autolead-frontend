"use client"

import { useState } from "react"
import { Archive, ArchiveRestore, Check, Loader2, Pencil, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTagAction, updateTagAction } from "../actions"
import { financeErrorMessage } from "../logic/errors"
import { tagNameSchema } from "../schemas"
import type { FinanceTag } from "../types"
import { TagChip } from "./tag-chip"
import { useSaveTransition } from "@/hooks/use-save-transition"

const DEFAULT_COLOR = "#1D9E75"

function ColorField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      id={id}
      type="color"
      aria-label="Colour"
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-card p-1"
    />
  )
}

/** Tags are archived, never deleted. Names are 1–40 characters, unique ignoring case. */
export function TagsManager({ tags }: { tags: FinanceTag[] }) {
  const [showArchived, setShowArchived] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [nameError, setNameError] = useState<string | null>(null)
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  const visible = tags.filter((t) => showArchived || !t.archived)
  const archivedCount = tags.filter((t) => t.archived).length

  function create(event: React.FormEvent) {
    event.preventDefault()
    const parsed = tagNameSchema.safeParse(name)
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Enter a name")
      return
    }
    startTransition(async () => {
      const result = await createTagAction({ name: parsed.data, color })
      if (!result.ok) {
        if (result.error.code === "FINANCE_TAG_NAME_TAKEN") setNameError(financeErrorMessage(result.error))
        else toast.error(financeErrorMessage(result.error))
        return
      }
      toast.success(`Tag “${result.data.name}” added.`)
      refresh(() => setName(""))
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1 basis-48">
          <Label htmlFor="new-tag-name" className="sr-only">
            New tag name
          </Label>
          <Input
            id="new-tag-name"
            placeholder="New tag, e.g. Detailing"
            maxLength={40}
            value={name}
            aria-invalid={nameError ? true : undefined}
            onChange={(e) => {
              setName(e.target.value)
              setNameError(null)
            }}
          />
          {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
        </div>
        <ColorField id="new-tag-color" value={color} onChange={setColor} />
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          Add tag
        </Button>
      </form>

      <ul className="divide-y divide-muted rounded-xl border border-border">
        {visible.map((tag) => (
          <TagRow key={tag.id} tag={tag} />
        ))}
        {visible.length === 0 && <li className="px-4 py-6 text-center text-xs text-subtle-foreground">No tags yet.</li>}
      </ul>

      {archivedCount > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={showArchived} onCheckedChange={(v) => setShowArchived(v === true)} />
          Show archived ({archivedCount})
        </label>
      )}
    </div>
  )
}

function TagRow({ tag }: { tag: FinanceTag }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color ?? DEFAULT_COLOR)
  const [error, setError] = useState<string | null>(null)
  const { isPending, run: startTransition, refresh } = useSaveTransition()

  function save(patch: { name?: string; color?: string | null; archived?: boolean }, done?: string) {
    startTransition(async () => {
      const result = await updateTagAction(tag.id, patch)
      if (!result.ok) {
        if (result.error.code === "FINANCE_TAG_NAME_TAKEN") setError(financeErrorMessage(result.error))
        else toast.error(financeErrorMessage(result.error))
        return
      }
      if (done) toast.success(done)
      refresh(() => setEditing(false))
    })
  }

  function submitEdit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = tagNameSchema.safeParse(name)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a name")
      return
    }
    const patch: { name?: string; color?: string } = {}
    if (parsed.data !== tag.name) patch.name = parsed.data
    if (color !== (tag.color ?? "")) patch.color = color
    if (Object.keys(patch).length === 0) {
      setEditing(false)
      return
    }
    save(patch, "Tag updated.")
  }

  if (editing) {
    return (
      <li className="px-3 py-2.5">
        <form onSubmit={submitEdit} className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1 basis-40">
            <Input
              aria-label="Tag name"
              autoFocus
              maxLength={40}
              value={name}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          <ColorField id={`tag-color-${tag.id}`} value={color} onChange={setColor} />
          <Button type="submit" size="icon" aria-label="Save" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Check />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Cancel"
            onClick={() => {
              setEditing(false)
              setName(tag.name)
              setColor(tag.color ?? DEFAULT_COLOR)
              setError(null)
            }}
          >
            <X />
          </Button>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2">
      <TagChip tag={tag} className="text-xs" />
      <div className="flex items-center gap-1">
        {!tag.archived && (
          <Button size="icon" variant="ghost" aria-label={`Edit ${tag.name}`} onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            save({ archived: !tag.archived }, tag.archived ? `“${tag.name}” restored.` : `“${tag.name}” archived.`)
          }
        >
          {tag.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
          {tag.archived ? "Unarchive" : "Archive"}
        </Button>
      </div>
    </li>
  )
}
