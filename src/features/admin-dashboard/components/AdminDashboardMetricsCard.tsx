import { ReactNode } from "react"

interface AdminDashboardMetricsCardProps {
  label: string
  value: string | number
  helper?: string
  icon: ReactNode
}

export default function AdminDashboardMetricsCard({label, value, helper, icon,}: AdminDashboardMetricsCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#a8b3cf]">{label}</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#feaa2b]/10 text-[#feaa2b]">
          {icon}
        </div>
      </div>

      {helper && (
        <p className="mt-4 text-xs text-emerald-300">{helper}</p>
      )}
    </article>
  )
}
