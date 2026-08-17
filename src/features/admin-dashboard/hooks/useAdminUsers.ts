import { useCallback, useEffect, useState } from "react"
import { AdminUserRestrictionKey, AdminUserRow } from "../types/adminUsers.types"
import { deleteAdminUsers, fetchAdminUsers, updateAdminUserRestriction } from "../services/adminUsers.service"

export function useAdminUsers() {
    const [users, setUsers] = useState<AdminUserRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isDeleting, setIsDeleting] = useState(false)
    const [updatingRestriction, setUpdatingRestriction] = useState<{
        userId: string
        restriction: AdminUserRestrictionKey
    } | null>(null)

    const deleteUsers = async (userIds: string[]) => {
        try {
            setIsDeleting(true)

            await deleteAdminUsers(userIds)

            setUsers((prev) => prev.filter((user) => !userIds.includes(user.uid)))
        } finally {
            setIsDeleting(false)
        }
    }

    const updateUserRestriction = async ({
        userId,
        restriction,
        allowed,
    }: {
        userId: string
        restriction: AdminUserRestrictionKey
        allowed: boolean
    }) => {
        const previousUser = users.find((user) => user.uid === userId)

        if (!previousUser) return

        setUpdatingRestriction({userId, restriction,})

        setUsers((prev) =>
            prev.map((user) =>
                user.uid === userId
                ? {
                    ...user,
                    restrictions: {
                        ...user.restrictions,
                        [restriction]: allowed,
                    },
                    }
                : user
            )
        )

        try {
        await updateAdminUserRestriction({
            userId,
            restriction,
            allowed,
        })
        } catch (error) {
        console.error("Failed to update user restriction:", error)

        setUsers((prev) =>
            prev.map((user) =>
            user.uid === userId
                ? {
                    ...user,
                    restrictions:
                    previousUser.restrictions,
                }
                : user
            )
        )

        throw error
        } finally {
            setUpdatingRestriction(null)
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
        void loadUsers()
    }, [loadUsers])

    return {
        users,
        isLoading,
        isDeleting,
        error,
        updatingRestriction,
        
        refetch: loadUsers,
        deleteUsers,
        updateUserRestriction,
    }
}