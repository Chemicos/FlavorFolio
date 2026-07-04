import { ReactNode, useState } from "react"
import Navigation from "../../../components/layout/Navigation"
import AdminDashboardSidebar from "./AdminDashboardSidebar"

interface AdminLayoutProps {
  children: ReactNode
  rightOffset?: number
  fullHeight?: boolean
}

export default function AdminLayout({ 
    children, 
    rightOffset = 0,
    fullHeight = false,
}: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div
      className="min-h-screen bg-[#0d0e11] text-white transition-[padding] duration-300"
      style={{ paddingRight: rightOffset }}
    >
      <Navigation variant="solid" />

      <AdminDashboardSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <main
        className={[
          "w-full transition-all duration-300 xl:px-8",
          fullHeight
            ? "flex h-screen flex-col overflow-hidden px-6 pb-6 pt-28"
            : "px-6 pb-16 pt-28",
          isSidebarCollapsed
            ? "xl:ml-[82px] xl:w-[calc(100%-82px)]"
            : "xl:ml-[260px] xl:w-[calc(100%-260px)]",
        ].join(" ")}
      >
        <div
          className={[
            "mx-auto w-full max-w-[1400px]",
            fullHeight ? "flex min-h-0 flex-1 flex-col" : "",
          ].join(" ")}
        >
          {children}
        </div>
      </main>
    </div>
  )
}