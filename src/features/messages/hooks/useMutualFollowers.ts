import { collection, doc, getDoc, getDocs } from "@firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../../../firebase-config"

export interface MutualFollower {
    userId: string
    username: string
    profileImage: string
    firstName: string
    lastName: string
}

export function useMutualFollowers(currentUserId?: string | null) {
  const [users, setUsers] = useState<MutualFollower[]>([])
  const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!currentUserId) {
            setUsers([])
            setIsLoading(false)
            return
        }

        const uid = currentUserId
        let isMounted = true

        async function loadMutualFollowers() {
            try {
            setIsLoading(true)

            const followingSnapshot = await getDocs(
                collection(db, "users", uid, "following")
            )

            const result = await Promise.all(
                followingSnapshot.docs.map(async (followingDoc) => {
                const targetUserId = followingDoc.id

                const followsBackSnap = await getDoc(
                    doc(db, "users", targetUserId, "following", uid)
                )

                if (!followsBackSnap.exists()) return null

                const userSnap = await getDoc(doc(db, "users", targetUserId))
                if (!userSnap.exists()) return null

                const data = userSnap.data()

                return {
                    userId: targetUserId,
                    username: data.username || "Unknown",
                    profileImage: data.profileImage || "",
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                }
                })
            )

            if (isMounted) {
                setUsers(result.filter(Boolean) as MutualFollower[])
            }
            } finally {
            if (isMounted) setIsLoading(false)
            }
        }

        loadMutualFollowers()

        return () => {
            isMounted = false
        }
    }, [currentUserId])

  return { users, isLoading }
}