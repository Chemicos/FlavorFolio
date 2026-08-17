import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { DEFAULT_USER_RESTRICTIONS, subscribeToUserRestrictions, UserRestrictions } from "./service/userRestrictions.service"
import { auth } from "../../firebase-config"

interface UserCapabilitiesContextValue {
    restrictions: UserRestrictions
    isLoading: boolean
}

const UserCapabilitiesContext = createContext<UserCapabilitiesContextValue | null>(null)

export function UserCapabilitiesProvider({children}: {children: ReactNode}) {
    const [restrictions, setRestrictions] = useState(DEFAULT_USER_RESTRICTIONS)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const userId = auth.currentUser?.uid

        if (!userId) {
            setRestrictions(DEFAULT_USER_RESTRICTIONS)
            setIsLoading(false)
            return
        }

        const unsubscribe = subscribeToUserRestrictions({
            userId,

            onChange: (nextRestrictions) => {
                setRestrictions(nextRestrictions)
                setIsLoading(false)
            },

            onError: (error) => {
                console.error("Failed to load user restrictions:", error)
                setIsLoading(false)
            }
        })

        return () => unsubscribe()
    }, [])

    return (
        <UserCapabilitiesContext.Provider
            value={{restrictions, isLoading}}
        >
            {children}
        </UserCapabilitiesContext.Provider>
    )
}

export function useUserCapabilities() {
    const context = useContext(UserCapabilitiesContext)

    if (!context) {
        throw new Error("useUserCapabilities must be used inside UserCapabilitiesProvider")
    }

    return context
}