import { useCallback, useEffect, useState } from "react"
import { fetchAdminReportsFood } from "../services/adminReports.service"
import { AdminReportsFoodStats } from "../types/adminReports.types"

export function useAdminReportsFood(refreshKey = 0) {
  const [food, setFood] = useState<AdminReportsFoodStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFood = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchAdminReportsFood()
      setFood(result)
    } catch (error) {
      console.error("Failed to fetch food reports:", error)
      setError("Failed to load food insights.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFood()
  }, [loadFood, refreshKey])

  return {
    food,
    isLoading,
    error,
    refetch: loadFood,
  }
}