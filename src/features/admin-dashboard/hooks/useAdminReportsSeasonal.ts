import { useCallback, useEffect, useState } from "react"
import { fetchAdminReportsSeasonal } from "../services/adminReports.service"
import { AdminReportsSeasonalStats } from "../types/adminReports.types"

export function useAdminReportsSeasonal(refreshKey = 0) {
  const [seasonal, setSeasonal] = useState<AdminReportsSeasonalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSeasonal = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchAdminReportsSeasonal()
      setSeasonal(result)
    } catch (error) {
      console.error("Failed to fetch seasonal reports:", error)
      setError("Failed to load seasonal trends.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSeasonal()
  }, [loadSeasonal, refreshKey])

  return {
    seasonal,
    isLoading,
    error,
    refetch: loadSeasonal,
  }
}