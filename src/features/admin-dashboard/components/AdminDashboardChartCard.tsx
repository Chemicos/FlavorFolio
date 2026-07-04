import { ReactNode } from "react"

interface AdminDashboardChartCardProps {
  title: string
  action?: ReactNode
  children: ReactNode
}
export default function AdminDashboardChartCard({title, action, children}: AdminDashboardChartCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#16181d]/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        {action}
      </header>

      {children}
    </section>
  )
}
