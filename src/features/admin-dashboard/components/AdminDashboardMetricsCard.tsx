import { ReactNode } from "react"

interface AdminDashboardMetricsCardProps {
  label: string
  value: string | number
  helper?: string
  icon: ReactNode
}

export default function AdminDashboardMetricsCard({label, value, helper, icon,}: AdminDashboardMetricsCardProps) {
  return (
    <article 
      className={[
        "rounded-2xl border border-[var(--border)]",
        "bg-[var(--card-bg)] p-5",
        "shadow-[var(--shadow-card)]",
        "transition-[background-color,border-color,transform] duration-200",
        "hover:border-[var(--border-strong)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          {icon}
        </div>
      </div>

      {helper && (
        <p className="mt-4 text-xs text-[var(--success-text)]">{helper}</p>
      )}
    </article>
  )
}
