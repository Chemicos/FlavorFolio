import { useCallback, useEffect, useState } from "react"

export function useAdminLiveRefresh({
  isLoading,
  hasData,
  onRefresh,
}: {
  isLoading: boolean
  hasData: boolean
  onRefresh: () => Promise<void>
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!isLoading && hasData && !lastUpdatedAt) {
      setLastUpdatedAt(new Date())
    }
  }, [isLoading, hasData, lastUpdatedAt])

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      await onRefresh()
      setLastUpdatedAt(new Date())
    } finally {
      window.setTimeout(() => {
        setIsRefreshing(false)
      }, 650)
    }
  }, [onRefresh])

  return {
    isRefreshing,
    lastUpdatedAt,
    handleRefresh,
  }
}