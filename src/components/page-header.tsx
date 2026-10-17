/** List page heading: title, count line and the primary create action. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
