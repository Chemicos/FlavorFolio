import { useCallback, useEffect, useRef, useState } from "react"
import { fetchAdminDashboardStats } from "../services/adminDashboard.service"
import { AdminDashboardStats } from "../types/adminDashboard.types"

export function useAdminDashboardStats() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

   const isMountedRef = useRef(true)

  const loadStats = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setIsLoading(true)
        setError(null)
      }

      const data =
        await fetchAdminDashboardStats()

      if (!isMountedRef.current) return

      setStats(data)
    } catch (error) {
      console.error( "Failed to load admin dashboard stats:", error)

      if (!isMountedRef.current) return

      setError("Failed to load dashboard stats.")
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    void loadStats()

    return () => {
      isMountedRef.current = false
    }
  }, [loadStats])

  return {
    stats,
    isLoading,
    error,
    refetch: loadStats,
  }
}