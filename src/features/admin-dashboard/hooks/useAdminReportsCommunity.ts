import { useCallback, useEffect, useState } from "react"
import { fetchAdminReportsCommunity } from "../services/adminReports.service"
import { AdminReportsCommunityStats } from "../types/adminReports.types"

export function useAdminReportsCommunity(refreshKey = 0) {
  const [community, setCommunity] = useState<AdminReportsCommunityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCommunity = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchAdminReportsCommunity()
      setCommunity(result)
    } catch (error) {
      console.error("Failed to fetch community reports:", error)
      setError("Failed to load community reports.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCommunity()
  }, [loadCommunity, refreshKey])

  return {
    community,
    isLoading,
    error,
    refetch: loadCommunity,
  }
}