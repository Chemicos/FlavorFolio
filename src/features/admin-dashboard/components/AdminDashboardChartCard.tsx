import { ReactNode } from "react"

interface AdminDashboardChartCardProps {
  title: string
  action?: ReactNode
  children: ReactNode
}
export default function AdminDashboardChartCard({title, action, children}: AdminDashboardChartCardProps) {
  return (
    <section 
      className={[
        "rounded-2xl border border-[var(--border)]",
        "bg-[var(--card-bg)] p-5",
        "shadow-[var(--shadow-card)]",
        "transition-colors",
      ].join(" ")}
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
        {action}
      </header>

      {children}
    </section>
  )
}
