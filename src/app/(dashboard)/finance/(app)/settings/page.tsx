import type { Metadata } from "next"
import { SectionCard } from "@/app/(dashboard)/dashboard/_components/section-card"
import { getTags } from "@/features/finance/api"
import { TagsManager } from "@/features/finance/components/tags-manager"
import { ChangeKeyForm } from "@/features/finance/components/vault/change-key-form"
import { LockButton } from "@/features/finance/components/vault/lock-button"

export const metadata: Metadata = { title: "Finance settings" }

export default async function FinanceSettingsPage() {
  const tags = await getTags(true)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard title="Tags" total={tags.filter((t) => !t.archived).length} className="lg:row-span-2">
        <div className="p-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Your own labels for entries. Archived tags leave the pickers but stay on old entries.
          </p>
          <TagsManager tags={tags} />
        </div>
      </SectionCard>
      <SectionCard title="Change finance key">
        <div className="p-4">
          <ChangeKeyForm />
        </div>
      </SectionCard>
      <SectionCard title="Lock">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            Finance locks by itself after 30 minutes idle or 8 hours at most.
          </p>
          <LockButton label="Lock now" />
        </div>
      </SectionCard>
    </div>
  )
}
