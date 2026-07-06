import { useCallback, useEffect, useState } from "react"
import { AdminUserRow } from "../types/adminUsers.types"
import { deleteAdminUsers, fetchAdminUsers } from "../services/adminUsers.service"

export function useAdminUsers() {
    const [users, setUsers] = useState<AdminUserRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isDeleting, setIsDeleting] = useState(false)

    const deleteUsers = async (userIds: string[]) => {
        try {
            setIsDeleting(true)

            await deleteAdminUsers(userIds)

            setUsers((prev) => prev.filter((user) => !userIds.includes(user.uid)))
        } finally {
            setIsDeleting(false)
        }
    }

    const loadUsers = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const result = await fetchAdminUsers()
            setUsers(result)
        } catch (error) {
            console.error("Failed to fetch admin users:", error)
            setError("Failed to load users.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    return {
        users,
        isLoading,
        isDeleting,
        error,
        refetch: loadUsers,
        deleteUsers,
    }
}