import { useCallback, useEffect, useState } from "react"
import { AdminReportsOverviewStats } from "../types/adminReports.types"
import { fetchAdminReportsOverview } from "../services/adminReports.service"

export function useAdminReportsOverview(refreshKey = 0) {
  const [overview, setOverview] = useState<AdminReportsOverviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchAdminReportsOverview()
      setOverview(result)
    } catch (error) {
      console.error("Failed to fetch admin reports overview:", error)
      setError("Failed to load reports overview.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview, refreshKey])

  return {
    overview,
    isLoading,
    error,
    refetch: loadOverview,
  }
}