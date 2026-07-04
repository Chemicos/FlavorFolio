import { useEffect, useState } from "react"
import { fetchAdminDashboardStats } from "../services/adminDashboard.service"
import { AdminDashboardStats } from "../types/adminDashboard.types"

export function useAdminDashboardStats() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await fetchAdminDashboardStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to load admin dashboard stats:", error)
      setError("Failed to load dashboard stats.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return {
    stats,
    isLoading,
    error,
    refetch: loadStats,
  }
}