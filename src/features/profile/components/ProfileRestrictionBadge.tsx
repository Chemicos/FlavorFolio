import GppBadOutlinedIcon from "@mui/icons-material/GppBadOutlined"

export default function ProfileRestrictionBadge({
    label, restrictions
}: {
    label?: string
    restrictions: {
        key: string
        label: string
    }[]
}) {
    const showDetails = restrictions.length > 1
  return (
    <div className="group relative">
        <div
            tabIndex={0}
            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 border-[var(--warning-border)] bg-[var(--warning-soft)] text-sm font-semibold text-[var(--warning-text)] shadow-[var(--shadow-card)] outline-none transition hover:bg-[var(--warning-soft)]
            focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
            <GppBadOutlinedIcon sx={{ fontSize: 17 }} />

            <span>{label}</span>
        </div>

        {showDetails && (
        <div
          className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[90] w-[270px] translate-y-1 rounded-xl border p-3 border-[var(--border)] bg-[var(--account-dropdown-bg)] text-[var(--text-primary)] shadow-[var(--shadow-dropdown)] opacity-0 transition-[opacity,transform]
            group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Active limitations
          </p>

          <div className="mt-2 space-y-2">
            {restrictions.map((restriction) => (
              <div
                key={restriction.key}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 bg-[var(--warning-soft)]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" />

                <span className="text-xs font-medium text-[var(--warning-text)]">
                  {restriction.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
            Some account actions have been disabled by platform moderation.
          </p>
        </div>
      )}
    </div>
  )
}
