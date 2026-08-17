interface MessageDataDividerProps {
    label: string
}

export default function MessageDateDivider({ label }: MessageDataDividerProps) {
  return (
    <div className="flex items-center gap-4 py-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-[var(--border)]" />

      <span className="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </span>

      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  )
}
