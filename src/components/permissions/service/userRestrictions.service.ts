import { doc, onSnapshot } from "@firebase/firestore"
import { db } from "../../../firebase-config"

export interface UserRestrictions {
    canPostRecipes: boolean
    canPostReels: boolean
    canComment: boolean
}

export const DEFAULT_USER_RESTRICTIONS: UserRestrictions = {
    canPostRecipes: true,
    canPostReels: true,
    canComment: true,
}

export function subscribeToUserRestrictions({
    userId,
    onChange,
    onError,    
}: {
    userId: string
    onChange: (restrictions: UserRestrictions) => void
    onError: (error: Error) => void
}) {
    return onSnapshot(
        doc(db, "users", userId),
        (snapshot) => {
            const data = snapshot.data()
            const restrictions = data?.restrictions || {}

            onChange({
                canPostRecipes: restrictions.canPostRecipes !== false,

                canPostReels: restrictions.canPostReels !== false,

                canComment: restrictions.canComment !== false,
            })
        },
        onError
    )
}