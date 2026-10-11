"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { buildOwnersHref, type OwnersSearchParams } from "../search-params"

interface OwnersToolbarProps {
  params: OwnersSearchParams
}

export function OwnersToolbar({ params }: OwnersToolbarProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(params.q ?? "")

  function navigate(next: Partial<OwnersSearchParams>) {
    startTransition(() => {
      router.push(buildOwnersHref({ ...params, ...next, page: 1 }))
    })
  }

  useEffect(() => {
    const q = search.trim() || undefined
    if (q === params.q) return
    const timer = setTimeout(() => navigate({ q }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="h-9 w-full bg-background sm:w-72">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Search name or phone"
          aria-label="Search owners"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>
    </div>
  )
}
